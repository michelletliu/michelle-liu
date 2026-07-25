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

  /*
   * Reve rejects unknown fields with a 400 rather than ignoring them, so this
   * is the whole recognised set for remix minus `test_time_scaling` (a paid
   * quality dial) and `postprocessing`. There is no strength or negative-prompt
   * parameter — the frame tag and the prompt wording are the only style dial.
   *
   * Exactly one reference is sent, which is what keeps the frame index at 0.
   */
  const payload = {
    prompt: composed.prompt,
    aspect_ratio,
    version: "latest",
    ...(referenceImage ? { reference_images: [referenceImage] } : {}),
  };

  console.info(
    `[gallery/generate] painting=${painting.id} inspiration=${
      composed.inspiredByObjectID ?? "none"
    } endpoint=${referenceImage ? "remix" : "create"} aspect=${aspect_ratio}\n` +
      `[gallery/generate] prompt: ${composed.prompt}`,
  );

  let reveRes: Response;
  try {
    reveRes = await fetch(referenceImage ? REVE_REMIX_URL : REVE_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Reve API" },
      { status: 502 },
    );
  }

  const raw = await reveRes.text();
  // Reve support cannot look up a request without this id.
  console.info(
    `[gallery/generate] reve status=${reveRes.status} request-id=${
      reveRes.headers.get("x-reve-request-id") ?? "none"
    }`,
  );

  if (!reveRes.ok) {
    let message = `Reve error (${reveRes.status})`;
    try {
      const err = JSON.parse(raw) as { message?: string; error?: string };
      message = err.message || err.error || message;
    } catch {
      /* keep default */
    }
    return NextResponse.json(
      { error: message },
      { status: reveRes.status === 401 ? 502 : reveRes.status },
    );
  }

  try {
    const data = JSON.parse(raw) as {
      image?: string;
      content_violation?: boolean;
    };
    if (data.content_violation) {
      return NextResponse.json(
        { error: "Prompt was blocked by content policy" },
        { status: 400 },
      );
    }
    if (!data.image) {
      return NextResponse.json(
        { error: "Reve returned no image" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      imageUrl: `data:image/png;base64,${data.image}`,
      paintingId: painting.id,
      inspiredByObjectID: composed.inspiredByObjectID,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Reve response" },
      { status: 502 },
    );
  }
}
