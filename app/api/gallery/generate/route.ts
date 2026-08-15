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

const PIKA_API_BASE = "https://api.dev.pika.art";
/**
 * Nano Banana 2 (Gemini 3.1 Flash Image): exact 3:4 / 3:2 hang ratios,
 * text-to-image and style-reference image-to-image on the same model.
 */
const PIKA_TEXT_TO_IMAGE = `${PIKA_API_BASE}/v1/media/google/gemini-3.1-flash-image/text-to-image`;
const PIKA_IMAGE_TO_IMAGE = `${PIKA_API_BASE}/v1/media/google/gemini-3.1-flash-image/image-to-image`;
const PIKA_RESOLUTION = "2K";
const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS = 105_000;

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

type PikaJob = {
  id?: string;
  status?: "queued" | "running" | "completed" | "failed";
  output?: {
    images?: { url?: string; content_type?: string }[];
  };
  error?: { code?: string; message?: string };
  message?: string;
};

/**
 * Pika aspect for the hang. Aperture sizes in `paintingSize` are exact 3:4 and
 * 3:2 so generate output matches the paint rect. Matching ratios still avoids
 * needless UV crop.
 */
function aspectForPainting(painting: GalleryPainting): "3:4" | "3:2" {
  return painting.aspect === "portrait" ? "3:4" : "3:2";
}

function pikaHeaders(apiKey: string, extra?: Record<string, string>) {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

function pikaErrorMessage(job: PikaJob, status: number): {
  error: string;
  status: number;
} {
  const code = job.error?.code;

  if (code === "content_moderation") {
    return { error: "Prompt was blocked by content policy", status: 400 };
  }
  if (code === "rate_limited") {
    return { error: "Too many generations right now. Try again in a moment.", status: 429 };
  }
  if (code === "insufficient_balance" || code === "cycle_limit_exceeded") {
    return { error: "Generation is temporarily unavailable", status: 502 };
  }
  if (code === "invalid_input") {
    return { error: "Could not generate that image", status: 400 };
  }
  if (status === 401) {
    return { error: "Generation is not configured", status: 502 };
  }
  return {
    error: "Generation failed",
    status: status === 401 ? 502 : status >= 400 ? status : 502,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJob(apiKey: string, jobId: string): Promise<PikaJob> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const res = await fetch(`${PIKA_API_BASE}/v1/media/jobs/${jobId}`, {
      headers: pikaHeaders(apiKey),
    });
    const job = (await res.json()) as PikaJob;
    if (!res.ok) {
      throw Object.assign(new Error("poll failed"), { job, status: res.status });
    }
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw Object.assign(new Error("timed out"), {
    job: { error: { code: "timed_out", message: "Generation timed out" } } satisfies PikaJob,
    status: 504,
  });
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
  return null;
}

/**
 * The artwork's Open Access image URL, passed to Pika as `image_urls`.
 * Public Met CDN URLs need no Pika upload.
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

export async function POST(req: NextRequest) {
  const apiKey = process.env.PIKA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "PIKA_API_KEY is not configured" },
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
  const composed = composeInspiredPrompt(prompt, inspiration, {
    referenceImage: referenceUrl !== null,
  });
  const aspect_ratio = aspectForPainting(painting);
  const usingRemix = referenceUrl !== null;
  const endpoint = usingRemix ? PIKA_IMAGE_TO_IMAGE : PIKA_TEXT_TO_IMAGE;

  const payload = {
    prompt: composed.prompt,
    num_images: 1,
    aspect_ratio,
    output_format: "png",
    resolution: PIKA_RESOLUTION,
    ...(referenceUrl ? { image_urls: [referenceUrl] } : {}),
  };

  console.info(
    `[gallery/generate] painting=${painting.id} inspiration=${
      composed.inspiredByObjectID ?? "none"
    } endpoint=${usingRemix ? "image-to-image" : "text-to-image"} model=google/gemini-3.1-flash-image aspect=${aspect_ratio} resolution=${PIKA_RESOLUTION}\n` +
      `[gallery/generate] prompt: ${composed.prompt}`,
  );

  let submitRes: Response;
  try {
    submitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...pikaHeaders(apiKey),
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach generation API" },
      { status: 502 },
    );
  }

  let job: PikaJob;
  try {
    job = (await submitRes.json()) as PikaJob;
  } catch {
    return NextResponse.json(
      { error: "Invalid generation response" },
      { status: 502 },
    );
  }

  console.info(
    `[gallery/generate] pika submit status=${submitRes.status} job=${job.id ?? "none"} job-status=${job.status ?? "none"} error=${job.error?.code ?? "none"} ${job.error?.message ?? job.message ?? ""}`.trimEnd(),
  );

  if (!submitRes.ok || job.status === "failed" || !job.id) {
    const mapped = pikaErrorMessage(job, submitRes.status);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  try {
    job = await pollJob(apiKey, job.id);
  } catch (err) {
    const failed = err as { job?: PikaJob; status?: number };
    const mapped = pikaErrorMessage(failed.job ?? {}, failed.status ?? 504);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  console.info(
    `[gallery/generate] pika job=${job.id} status=${job.status ?? "none"} error=${job.error?.code ?? "none"}`,
  );

  if (job.status !== "completed") {
    const mapped = pikaErrorMessage(job, 502);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  const imageUrl = job.output?.images?.[0]?.url;
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Generation returned no image" },
      { status: 502 },
    );
  }

  let imageRes: Response;
  try {
    imageRes = await fetch(imageUrl, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to download generated image" },
      { status: 502 },
    );
  }

  if (!imageRes.ok) {
    return NextResponse.json(
      { error: "Failed to download generated image" },
      { status: 502 },
    );
  }

  const bytes = Buffer.from(await imageRes.arrayBuffer());
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
