import { NextRequest, NextResponse } from "next/server";
import {
  GALLERY_PAINTINGS,
  type GalleryPainting,
} from "@/components/gallery/galleryPaintings";
import {
  artworkEligibility,
  composeInspiredPrompt,
  openAccessImageUrl,
  type MetArtwork,
} from "@/components/gallery/metArtworks";
import { MetApiError, fetchMetObject } from "@/lib/met/metClient";

export const runtime = "nodejs";
export const maxDuration = 120;

const REVE_CREATE_URL = "https://api.reve.com/v1/image/create/";
/** Takes `reference_images`; `create` does not. */
const REVE_REMIX_URL = "https://api.reve.com/v1/image/remix/";
/** Met's web derivative, ~2-4MB at most, well inside a JSON request body. */
const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;

/**
 * Remix has a documented fast tier (`latest-fast` → `reve-remix-fast@…`).
 * Create does not — `latest-fast` on create silently maps back to the same
 * `reve-create@…` model, so text-only stays on `latest`.
 *
 * Measured (same prompt / aspect, Met web-large reference when remixing):
 *   remix `latest`      ~18s, 30 credits
 *   remix `latest-fast`  ~8s,  5 credits
 * Quality tradeoff: fast tier is slightly softer on fine brushwork; still
 * reads as a painting on the wall and is the right default for interactive use.
 */
const REVE_CREATE_VERSION = "latest";
const REVE_REMIX_VERSION = "latest-fast";

/**
 * Ask Reve for WebP bytes instead of the default JSON+PNG base64 payload.
 * Generation time is unchanged (~6s create / ~8s remix-fast), but the response
 * drops from ~2–3MB PNG-in-JSON to ~70–160KB WebP — cutting Reve→server and
 * server→client transfer that used to dominate the wait after the image was
 * already ready. Wall/download quality at native Reve resolution is fine;
 * share upload re-encodes to PNG for the existing Blob pipeline.
 */
const REVE_ACCEPT = "image/webp";

/**
 * The artwork's Open Access image, base64-encoded for Reve's `reference_images`.
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

  const url = openAccessImageUrl(artwork);
  if (!url) return downgrade("record has no Open Access image");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return downgrade(`image fetch returned ${res.status}`);

    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0) return downgrade("image body was empty");
    if (bytes.byteLength > MAX_REFERENCE_BYTES) {
      return downgrade(`image is ${bytes.byteLength} bytes, over the limit`);
    }
    // Raw base64, no data: prefix — Reve rejects URLs and prefixed payloads.
    return Buffer.from(bytes).toString("base64");
  } catch (err) {
    return downgrade(err instanceof Error ? err.message : "image fetch failed");
  }
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
 * The closest ratio Reve offers to the frame the image is being generated for.
 *
 * The hangs are 1.15 x 1.55 and 1.95 x 1.32, so 0.742 and 1.477. Reve's menu is
 * 16:9, 3:2, 4:3, 1:1, 3:4, 2:3, 9:16, and the nearest members are 3:4 (0.750,
 * 1% out) and 3:2 (1.500, 1.5% out).
 *
 * Portrait used to ask for 2:3, which is 0.667 and a full 11% narrower than the
 * frame — every portrait generation came back stretched sideways once hung.
 * Nothing was cropped, so it read as a subtly wrong picture rather than an
 * obvious bug, which is the worst kind. The scene letterboxes whatever is left
 * over, so these only have to be close, not exact.
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
  if (prompt.length > 2000) {
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
   * Reve rejects unknown fields with a 400 rather than ignoring them, so this
   * is the whole recognised set for remix minus `test_time_scaling` (a paid
   * quality dial that does not reduce latency) and `postprocessing`. There is
   * no strength or negative-prompt parameter — the frame tag and the prompt
   * wording are the only style dial.
   *
   * Exactly one reference is sent, which is what keeps the frame index at 0.
   */
  const payload = {
    prompt: composed.prompt,
    aspect_ratio,
    version,
    ...(referenceImage ? { reference_images: [referenceImage] } : {}),
  };

  console.info(
    `[gallery/generate] painting=${painting.id} inspiration=${
      composed.inspiredByObjectID ?? "none"
    } endpoint=${usingRemix ? "remix" : "create"} version=${version} aspect=${aspect_ratio}\n` +
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
    } version=${reveRes.headers.get("x-reve-version") ?? "none"}`,
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
