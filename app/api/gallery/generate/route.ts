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
import {
  GEMINI_IMAGE_MODEL,
  GEMINI_IMAGE_SIZE,
  GEMINI_INTERACTIONS_URL,
  geminiGenerateBody,
  geminiHeaders,
  geminiHttpError,
  geminiImageBase64,
  geminiInteractionId,
  geminiInteractionStatus,
  geminiNeedsPoll,
  type GeminiInlineImage,
} from "@/lib/gemini/galleryImage";

export const runtime = "nodejs";
export const maxDuration = 120;

const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS = 105_000;
const REFERENCE_MAX_EDGE = 1536;

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
 * Hang aspect. Aperture sizes in `paintingSize` are exact 3:4 and 3:2 so
 * generate output matches the paint rect.
 */
function aspectForPainting(painting: GalleryPainting): "3:4" | "3:2" {
  return painting.aspect === "portrait" ? "3:4" : "3:2";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isWebp(bytes: Buffer): boolean {
  return (
    bytes.byteLength >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes.subarray(1, 4).toString("ascii") === "PNG"
  );
}

function isJpeg(bytes: Buffer): boolean {
  return bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Return a WebP data URL so share upload stays small. PNG 2K frames used to
 * balloon the hang POST; WebP at native resolution is sharp enough on the wall.
 */
async function toImageDataUrl(bytes: Buffer): Promise<string | null> {
  if (isWebp(bytes)) {
    return `data:image/webp;base64,${bytes.toString("base64")}`;
  }

  try {
    const sharp = (await import("sharp")).default;
    const webp = await sharp(bytes).webp({ quality: 88 }).toBuffer();
    return `data:image/webp;base64,${webp.toString("base64")}`;
  } catch (err) {
    console.warn(
      `[gallery/generate] webp encode failed: ${
        err instanceof Error ? err.message : "unknown"
      }`,
    );
  }

  if (isPng(bytes)) {
    return `data:image/png;base64,${bytes.toString("base64")}`;
  }
  if (isJpeg(bytes)) {
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  }
  return null;
}

/**
 * The artwork's Open Access image, sent to Gemini as inline image bytes.
 * Public Met CDN URLs are fetched here so the client never supplies the pixels.
 *
 * Text alone could not carry style: prompts describing impasto and broken
 * colour still came back as smooth digital illustration. Conditioning on the
 * image itself is the only lever that moves it. Legal footing is checked before
 * this runs — only `isPublicDomain` Open Access records get here.
 */
function styleReferenceUrl(artwork: MetArtwork): string | null {
  const url = artwork.primaryImage || artwork.primaryImageSmall;
  if (!url) {
    console.warn(
      `[gallery/generate] no style reference for objectID=${artwork.objectID} (record has no Open Access image); falling back to text-only create`,
    );
    return null;
  }
  return url;
}

function mimeFor(bytes: Buffer): string | null {
  if (isJpeg(bytes)) return "image/jpeg";
  if (isPng(bytes)) return "image/png";
  if (isWebp(bytes)) return "image/webp";
  return null;
}

async function referenceInline(url: string): Promise<GeminiInlineImage | null> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    console.warn(
      `[gallery/generate] style reference fetch failed: ${
        err instanceof Error ? err.message : "unknown"
      }`,
    );
    return null;
  }
  if (!res.ok) {
    console.warn(`[gallery/generate] style reference HTTP ${res.status}`);
    return null;
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength === 0) return null;

  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(bytes)
      .rotate()
      .resize({
        width: REFERENCE_MAX_EDGE,
        height: REFERENCE_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82 })
      .toBuffer();
    return { mimeType: "image/jpeg", data: jpeg.toString("base64") };
  } catch (err) {
    console.warn(
      `[gallery/generate] style reference encode failed: ${
        err instanceof Error ? err.message : "unknown"
      }`,
    );
  }

  const mimeType = mimeFor(bytes);
  if (!mimeType || bytes.byteLength > 6_000_000) return null;
  return { mimeType, data: bytes.toString("base64") };
}

async function geminiFetch(apiKey: string, url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...geminiHeaders(apiKey),
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(POLL_TIMEOUT_MS),
  });
}

async function readInteraction(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function pollInteraction(apiKey: string, id: string, deadline: number): Promise<unknown> {
  let latest: unknown = null;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const remaining = Math.max(1_000, deadline - Date.now());
    const res = await geminiFetch(apiKey, `${GEMINI_INTERACTIONS_URL}/${encodeURIComponent(id)}`, {
      method: "GET",
      signal: AbortSignal.timeout(remaining),
    });
    latest = await readInteraction(res);
    if (!res.ok || !geminiNeedsPoll(latest)) return latest;
  }
  return latest;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
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

  const referenceUrl = inspiration ? styleReferenceUrl(inspiration) : null;
  const reference = referenceUrl ? await referenceInline(referenceUrl) : null;
  const composed = composeInspiredPrompt(prompt, inspiration, {
    referenceImage: reference !== null,
  });
  const aspectRatio = aspectForPainting(painting);

  console.info(
    `[gallery/generate] painting=${painting.id} inspiration=${
      composed.inspiredByObjectID ?? "none"
    } endpoint=${reference ? "image-to-image" : "text-to-image"} model=${GEMINI_IMAGE_MODEL} aspect=${aspectRatio} resolution=${GEMINI_IMAGE_SIZE}\n` +
      `[gallery/generate] prompt: ${composed.prompt}`,
  );

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let submitRes: Response;
  try {
    submitRes = await geminiFetch(apiKey, GEMINI_INTERACTIONS_URL, {
      method: "POST",
      body: JSON.stringify(
        geminiGenerateBody({
          prompt: composed.prompt,
          aspectRatio,
          reference,
        }),
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach generation API" },
      { status: 502 },
    );
  }

  let interaction = await readInteraction(submitRes);
  console.info(
    `[gallery/generate] gemini submit status=${submitRes.status} id=${
      geminiInteractionId(interaction) ?? "none"
    } job-status=${geminiInteractionStatus(interaction) ?? "none"}`,
  );

  if (!submitRes.ok) {
    const mapped = geminiHttpError(submitRes.status, interaction);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  if (geminiNeedsPoll(interaction)) {
    const id = geminiInteractionId(interaction);
    if (!id) {
      return NextResponse.json({ error: "Generation failed" }, { status: 502 });
    }
    try {
      interaction = await pollInteraction(apiKey, id, deadline);
    } catch {
      return NextResponse.json(
        { error: "Failed to reach generation API" },
        { status: 502 },
      );
    }
    console.info(
      `[gallery/generate] gemini job=${id} status=${geminiInteractionStatus(interaction) ?? "none"}`,
    );
  }

  const status = geminiInteractionStatus(interaction);
  if (status && status !== "completed") {
    const mapped = geminiHttpError(502, interaction);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  const imageBase64 = geminiImageBase64(interaction);
  if (!imageBase64) {
    const mapped = geminiHttpError(502, interaction);
    return NextResponse.json(
      { error: mapped.error === "Generation failed" ? "Generation returned no image" : mapped.error },
      { status: mapped.status === 502 ? 502 : mapped.status },
    );
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(imageBase64, "base64");
  } catch {
    return NextResponse.json(
      { error: "Invalid generation response" },
      { status: 502 },
    );
  }
  if (bytes.byteLength === 0) {
    return NextResponse.json(
      { error: "Generation returned no image" },
      { status: 502 },
    );
  }

  const dataUrl = await toImageDataUrl(bytes);
  if (!dataUrl) {
    return NextResponse.json(
      { error: "Invalid generation response" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    imageUrl: dataUrl,
    paintingId: painting.id,
    inspiredByObjectID: composed.inspiredByObjectID,
  });
}
