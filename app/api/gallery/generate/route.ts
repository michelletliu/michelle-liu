import { NextRequest, NextResponse } from "next/server";
import {
  GALLERY_PAINTINGS,
  type GalleryPainting,
} from "@/components/gallery/galleryPaintings";
import {
  artworkEligibility,
  composeInspiredPrompt,
  type MetArtwork,
} from "@/components/gallery/metArtworks";
import { MetApiError, fetchMetObject } from "@/lib/met/metClient";

export const runtime = "nodejs";
export const maxDuration = 120;

const REVE_CREATE_URL = "https://api.reve.com/v1/image/create/";
/** Takes `reference_images`; `create` does not. */
const REVE_REMIX_URL = "https://api.reve.com/v1/image/remix/";
/**
 * Cap for a single style-reference download. Reve allows up to 40MB per image;
 * Met masters are usually well under this. Prefer failing over to the small
 * derivative rather than sending a giant body.
 */
const MAX_REFERENCE_BYTES = 25 * 1024 * 1024;

/**
 * Remix and create both use `latest`. Remix also exposes `latest-fast`
 * (~8s / 5 credits vs ~18s / 30), but the fast tier softens fine brushwork
 * enough that wall hangs look blurry — quality wins over that latency cut.
 * Create ignores `latest-fast` anyway (maps back to the same create model).
 */
const REVE_CREATE_VERSION = "latest";
const REVE_REMIX_VERSION = "latest";

/**
 * Ask Reve for WebP bytes instead of the default JSON+PNG base64 payload.
 * Generation time is unchanged; the response drops from ~2–3MB PNG-in-JSON to
 * ~70–160KB WebP (larger with 2× upscale, still far under PNG). Decode-to-texture
 * quality at native Reve resolution is fine; softness came from skipping
 * `test_time_scaling`, not WebP. Share upload stores the WebP as-is (PNG
 * re-encode of 2× frames balloons to ~4–5MB and hangs the hang POST).
 */
const REVE_ACCEPT = "image/webp";

/**
 * Reve's quality dial. Default is 1; higher spends more credits for better
 * images without slowing the request. Docs: values above 5 only occasionally
 * help, so 5 is the practical ceiling for wall hangs.
 */
const REVE_TEST_TIME_SCALING = 5;

/**
 * Post-generation upscale. 2× is sharp enough on the wall without the huge
 * payloads (and credit burn) of 3×/4×.
 */
const REVE_POSTPROCESSING = [{ process: "upscale", upscale_factor: 2 }] as const;

/**
 * The artwork's Open Access image, base64-encoded for Reve's `reference_images`.
 *
 * Prefer the full `primaryImage` master over `primaryImageSmall`: the small
 * derivative is fine for UI tiles but softens brushwork that remix needs to
 * copy. Falls back to small when the master is missing or over the byte cap.
 *
 * Text alone could not carry style: prompts describing impasto and broken
 * colour still came back as smooth digital illustration. Conditioning on the
 * image itself is the only lever that moves it. Legal footing is checked before
 * this runs — only `isPublicDomain` Open Access records get here — and the
 * prompt directs the model to take handling from the reference while depicting
 * the user's subject, so the output stays an original picture.
 *
 * Returns `null` on any failure: a missing reference downgrades to a text-only
 * generation rather than failing the request.
 */
async function fetchReferenceImage(artwork: MetArtwork): Promise<string | null> {
  // Every downgrade is logged: a text-only generation looks exactly like a
  // style failure from the outside, and silently swallowing the cause once cost
  // several rounds of chasing the prompt instead of the transport.
  const downgrade = (why: string) => {
    console.warn(
      `[gallery/generate] no style reference for objectID=${artwork.objectID} (${why}); falling back to text-only create`,
    );
    return null;
  };

  const candidates = [
    artwork.primaryImage,
    artwork.primaryImageSmall,
  ].filter((url): url is string => Boolean(url));
  if (candidates.length === 0) {
    return downgrade("record has no Open Access image");
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        console.warn(
          `[gallery/generate] style reference fetch ${res.status} for ${url}`,
        );
        continue;
      }

      const bytes = await res.arrayBuffer();
      if (bytes.byteLength === 0) continue;
      if (bytes.byteLength > MAX_REFERENCE_BYTES) {
        console.warn(
          `[gallery/generate] style reference is ${bytes.byteLength} bytes (cap ${MAX_REFERENCE_BYTES}); trying next candidate`,
        );
        continue;
      }
      // Raw base64, no data: prefix — Reve rejects URLs and prefixed payloads.
      return Buffer.from(bytes).toString("base64");
    } catch (err) {
      console.warn(
        `[gallery/generate] style reference fetch failed for ${url}: ${
          err instanceof Error ? err.message : "unknown"
        }`,
      );
    }
  }

  return downgrade("all Open Access image candidates failed or were too large");
}

type GenerateBody = {
  prompt?: string;
  paintingId?: string;
  /**
   * Optional Met object to take style cues from. Only the id is accepted —
   * the record itself is re-fetched here so a client cannot assert its own
   * eligibility or inject prompt text through the metadata fields.
   */
  inspirationObjectID?: number;
};

/**
 * Reve aspect for the hang. Aperture sizes in `paintingSize` are exact 3:4 and
 * 3:2 so generate output matches the paint rect. Portrait used to ask for 2:3
 * (11% too narrow); the scene now cover-fills and crops baked keylines, but
 * matching ratios still avoids needless UV crop.
 */
function aspectForPainting(painting: GalleryPainting): "3:4" | "3:2" {
  return painting.aspect === "portrait" ? "3:4" : "3:2";
}

function reveErrorMessage(raw: string, status: number): string {
  let message = `Reve error (${status})`;
  try {
    const err = JSON.parse(raw) as { message?: string; error?: string };
    message = err.message || err.error || message;
  } catch {
    /* keep default */
  }
  return message;
}

export async function POST(req: NextRequest) {
  const token = process.env.REVE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REVE_API_TOKEN is not configured" },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  const paintingId = body.paintingId?.trim() ?? "";
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 2560) {
    return NextResponse.json({ error: "Prompt is too long" }, { status: 400 });
  }

  const painting = GALLERY_PAINTINGS.find((p) => p.id === paintingId);
  if (!painting) {
    return NextResponse.json({ error: "Unknown painting" }, { status: 400 });
  }

  const inspirationId = body.inspirationObjectID;
  let inspiration: MetArtwork | null = null;
  if (inspirationId !== undefined) {
    if (typeof inspirationId !== "number" || !Number.isInteger(inspirationId)) {
      return NextResponse.json(
        { error: "inspirationObjectID must be an integer" },
        { status: 400 },
      );
    }

    try {
      inspiration = await fetchMetObject(inspirationId);
    } catch (err) {
      const status = err instanceof MetApiError ? err.status : 502;
      return NextResponse.json(
        { error: "Could not verify the artwork with The Met" },
        { status },
      );
    }

    if (!inspiration) {
      return NextResponse.json(
        { error: "That artwork is not in The Met's Open Access collection" },
        { status: 404 },
      );
    }

    // Eligibility is re-derived from the freshly fetched record on every call;
    // the client's view of public-domain status is never trusted.
    const eligibility = artworkEligibility(inspiration);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.message, reason: eligibility.reason },
        { status: 403 },
      );
    }
  }

  const referenceImage = inspiration
    ? await fetchReferenceImage(inspiration)
    : null;

  const composed = composeInspiredPrompt(prompt, inspiration, {
    referenceImage: referenceImage !== null,
  });
  const aspect_ratio = aspectForPainting(painting);
  const usingRemix = referenceImage !== null;
  const version = usingRemix ? REVE_REMIX_VERSION : REVE_CREATE_VERSION;

  /*
   * Reve rejects unknown fields with a 400 rather than ignoring them.
   * `test_time_scaling` is the quality dial (default 1 is soft); `postprocessing`
   * 2× upscale sharpens wall hangs. There is still no strength or negative-prompt
   * parameter — the frame tag and the prompt wording remain the style dial.
   *
   * Exactly one reference is sent, which is what keeps the frame index at 0.
   */
  const payload = {
    prompt: composed.prompt,
    aspect_ratio,
    version,
    test_time_scaling: REVE_TEST_TIME_SCALING,
    postprocessing: [...REVE_POSTPROCESSING],
    ...(referenceImage ? { reference_images: [referenceImage] } : {}),
  };

  console.info(
    `[gallery/generate] painting=${painting.id} inspiration=${
      composed.inspiredByObjectID ?? "none"
    } endpoint=${usingRemix ? "remix" : "create"} version=${version} aspect=${aspect_ratio} tts=${REVE_TEST_TIME_SCALING} upscale=2\n` +
      `[gallery/generate] prompt: ${composed.prompt}`,
  );

  let reveRes: Response;
  try {
    reveRes = await fetch(usingRemix ? REVE_REMIX_URL : REVE_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: REVE_ACCEPT,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Reve API" },
      { status: 502 },
    );
  }

  // Reve support cannot look up a request without this id.
  console.info(
    `[gallery/generate] reve status=${reveRes.status} request-id=${
      reveRes.headers.get("x-reve-request-id") ?? "none"
    } version=${reveRes.headers.get("x-reve-version") ?? "none"} credits=${
      reveRes.headers.get("x-reve-credits-used") ?? "none"
    }`,
  );

  if (!reveRes.ok) {
    const raw = await reveRes.text();
    return NextResponse.json(
      { error: reveErrorMessage(raw, reveRes.status) },
      { status: reveRes.status === 401 ? 502 : reveRes.status },
    );
  }

  if (reveRes.headers.get("x-reve-content-violation") === "true") {
    return NextResponse.json(
      { error: "Prompt was blocked by content policy" },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await reveRes.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json(
      { error: "Reve returned no image" },
      { status: 502 },
    );
  }

  // WebP RIFF magic — guard against an unexpected JSON body slipping through
  // with a 200 (Reve still returns JSON for some policy/error shapes).
  if (
    bytes.byteLength < 12 ||
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    const asText = bytes.toString("utf8");
    try {
      const data = JSON.parse(asText) as {
        image?: string;
        content_violation?: boolean;
        message?: string;
      };
      if (data.content_violation) {
        return NextResponse.json(
          { error: "Prompt was blocked by content policy" },
          { status: 400 },
        );
      }
      if (data.image) {
        // Fallback: older JSON+PNG shape if Accept was ignored.
        return NextResponse.json({
          imageUrl: `data:image/png;base64,${data.image}`,
          paintingId: painting.id,
          inspiredByObjectID: composed.inspiredByObjectID,
        });
      }
      return NextResponse.json(
        { error: data.message || "Reve returned no image" },
        { status: 502 },
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid Reve response" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    imageUrl: `data:image/webp;base64,${bytes.toString("base64")}`,
    paintingId: painting.id,
    inspiredByObjectID: composed.inspiredByObjectID,
  });
}
