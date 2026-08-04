import {
  EDIT_TOKEN_HEADER,
  MAX_HANG_BYTES,
  type SharedGalleryHang,
} from "./sharedGallery";

export type SaveGalleryHangInput = {
  paintingId: string;
  /** data: URL or https Blob URL from the live session */
  imageUrl: string;
  inspirationTitle?: string;
};

export type SaveGalleryShareInput =
  | {
      mode: "create";
      name: string;
      creator: string;
      hangs: SaveGalleryHangInput[];
    }
  | {
      mode: "update";
      name: string;
      creator: string;
      hangs: SaveGalleryHangInput[];
      existingShareId: string;
      existingEditToken: string;
    };

export type SaveGalleryShareResult = {
  shareId: string;
  editToken: string;
  url: string;
  name: string;
  creator: string;
};

export type SaveGalleryShareProgress = {
  phase: "start" | "upload" | "finalize";
  /** Steps finished (0…total). */
  completed: number;
  /** start + each hang + finalize. */
  total: number;
};

/** Per-request ceiling so a stalled upload cannot leave Saving… forever. */
const SHARE_FETCH_TIMEOUT_MS = 60_000;

/**
 * Parallel hang uploads. Blob + edit-secret auth tolerate a few concurrent
 * puts; keeping a small pool avoids saturating the browser or the store.
 */
const HANG_UPLOAD_CONCURRENCY = 4;

/**
 * Large PNGs (legacy generate fallback / canvas captures) are ~4–5MB and used
 * to stall the hang POST. Re-encode those to WebP; leave small PNGs alone.
 */
const PNG_REENCODE_THRESHOLD_BYTES = 1_000_000;

async function readShareApiJson<T extends object>(
  res: Response,
  fallbackError: string,
): Promise<T> {
  let data: T & { error?: string };
  try {
    data = (await res.json()) as T & { error?: string };
  } catch {
    throw new Error(fallbackError);
  }
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" && data.error
        ? data.error
        : fallbackError,
    );
  }
  return data;
}

function mimeFromDataUrl(imageUrl: string): string | null {
  const match = /^data:([^;,]+)[;,]/i.exec(imageUrl);
  return match ? match[1]!.toLowerCase() : null;
}

async function encodeBitmapAsWebp(
  blob: Blob,
  paintingId: string,
): Promise<File> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not encode artwork for save.");
    ctx.drawImage(bitmap, 0, 0);
    const encoded = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) =>
          next
            ? resolve(next)
            : reject(new Error("Image encode failed")),
        "image/webp",
        0.92,
      );
    });
    if (encoded.size <= 0 || encoded.size > MAX_HANG_BYTES) {
      throw new Error(
        `Artwork ${paintingId} is too large to save (max 8MB).`,
      );
    }
    return new File([encoded], `${paintingId}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

/**
 * Prepare a hang file for Blob upload.
 *
 * Live generate returns WebP data URLs (~0.3–0.5MB after 2× upscale). Pass
 * WebP through as-is. Small PNGs pass through; large PNGs are re-encoded to
 * WebP so the hang POST stays fast. Other bitmaps convert to WebP.
 */
export async function imageUrlToUploadFile(
  imageUrl: string,
  paintingId: string,
): Promise<File> {
  const res = await fetch(imageUrl, {
    signal: AbortSignal.timeout(SHARE_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Could not read image for ${paintingId}.`);
  }
  const blob = await res.blob();
  const type = (blob.type || mimeFromDataUrl(imageUrl) || "").toLowerCase();

  if (type === "image/webp") {
    if (blob.size <= 0 || blob.size > MAX_HANG_BYTES) {
      throw new Error(
        `Artwork ${paintingId} is too large to save (max 8MB).`,
      );
    }
    return new File([blob], `${paintingId}.webp`, { type: "image/webp" });
  }

  if (type === "image/png" && blob.size <= PNG_REENCODE_THRESHOLD_BYTES) {
    if (blob.size <= 0) {
      throw new Error(`Could not read image for ${paintingId}.`);
    }
    return new File([blob], `${paintingId}.png`, { type: "image/png" });
  }

  // Large PNG or non-png/webp bitmap → WebP.
  return encodeBitmapAsWebp(blob, paintingId);
}

function rethrowShareError(err: unknown): never {
  if (
    err instanceof Error &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  ) {
    throw new Error("Save timed out. Try again.");
  }
  throw err;
}

/** Run `fn` over `items` with at most `concurrency` in flight. */
async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let firstError: unknown;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        if (firstError) return;
        const index = nextIndex++;
        if (index >= items.length) return;
        try {
          results[index] = await fn(items[index]!, index);
        } catch (err) {
          firstError = err;
          return;
        }
      }
    },
  );

  await Promise.all(workers);
  if (firstError) throw firstError;
  return results;
}

export async function saveGalleryShare(
  input: SaveGalleryShareInput,
  options?: { onProgress?: (progress: SaveGalleryShareProgress) => void },
): Promise<SaveGalleryShareResult> {
  try {
    return await saveGalleryShareInner(input, options?.onProgress);
  } catch (err) {
    rethrowShareError(err);
  }
}

/**
 * Start → parallel hang uploads → finalize.
 * File prep runs in parallel; uploads use a small concurrency pool so one
 * failure stops the batch before finalize without serializing wall-clock.
 */
async function saveGalleryShareInner(
  input: SaveGalleryShareInput,
  onProgress?: (progress: SaveGalleryShareProgress) => void,
): Promise<SaveGalleryShareResult> {
  if (input.hangs.length === 0) {
    throw new Error("Generate at least one artwork to save.");
  }

  const totalSteps = input.hangs.length * 2 + 2;
  let completed = 0;
  const report = (phase: SaveGalleryShareProgress["phase"]) => {
    onProgress?.({ phase, completed, total: totalSteps });
  };
  report("start");

  const startHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (input.mode === "update") {
    startHeaders[EDIT_TOKEN_HEADER] = input.existingEditToken;
  }

  const startRes = await fetch("/api/gallery/share", {
    method: "POST",
    headers: startHeaders,
    body: JSON.stringify(
      input.mode === "update"
        ? {
            mode: "update",
            shareId: input.existingShareId,
          }
        : { mode: "create", name: input.name },
    ),
    signal: AbortSignal.timeout(SHARE_FETCH_TIMEOUT_MS),
  });
  const startData = await readShareApiJson<{
    shareId?: string;
    editToken?: string;
    previous?: { createdAt?: string };
  }>(startRes, "Could not start save.");
  if (!startData.shareId || !startData.editToken) {
    throw new Error("Could not start save.");
  }

  completed = 1;
  report("start");

  const shareId = startData.shareId;
  const editToken = startData.editToken;
  const editHeaders = { [EDIT_TOKEN_HEADER]: editToken };

  // Decode / optionally re-encode every hang before uploading so the pool
  // spends its slots on network, not canvas work.
  const prepared = await Promise.all(
    input.hangs.map(async (hang) => {
      const file = await imageUrlToUploadFile(hang.imageUrl, hang.paintingId);
      completed += 1;
      report("upload");
      return { hang, file };
    }),
  );

  const uploaded = await mapPool(
    prepared,
    HANG_UPLOAD_CONCURRENCY,
    async ({ hang, file }) => {
      const form = new FormData();
      form.set("file", file);
      form.set("paintingId", hang.paintingId);
      if (hang.inspirationTitle) {
        form.set("inspirationTitle", hang.inspirationTitle);
      }

      const hangRes = await fetch(`/api/gallery/share/${shareId}/hang`, {
        method: "POST",
        headers: editHeaders,
        body: form,
        signal: AbortSignal.timeout(SHARE_FETCH_TIMEOUT_MS),
      });
      const hangData = await readShareApiJson<{
        paintingId?: string;
        imageUrl?: string;
        inspirationTitle?: string;
      }>(hangRes, `Failed to upload ${hang.paintingId}.`);
      if (!hangData.imageUrl || !hangData.paintingId) {
        throw new Error(`Failed to upload ${hang.paintingId}.`);
      }

      completed += 1;
      report("upload");

      const entry: SharedGalleryHang = {
        paintingId: hangData.paintingId,
        imageUrl: hangData.imageUrl,
        ...(hangData.inspirationTitle
          ? { inspirationTitle: hangData.inspirationTitle }
          : hang.inspirationTitle
            ? { inspirationTitle: hang.inspirationTitle }
            : {}),
      };
      return entry;
    },
  );

  const finalizeRes = await fetch(`/api/gallery/share/${shareId}/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...editHeaders,
    },
    body: JSON.stringify({
      name: input.name,
      creator: input.creator,
      hangs: uploaded,
      createdAt: startData.previous?.createdAt,
    }),
    signal: AbortSignal.timeout(SHARE_FETCH_TIMEOUT_MS),
  });
  const finalizeData = await readShareApiJson<{
    shareId?: string;
    url?: string;
    name?: string;
    creator?: string;
  }>(finalizeRes, "Failed to finish saving.");
  if (!finalizeData.shareId || !finalizeData.url) {
    throw new Error("Failed to finish saving.");
  }

  completed = totalSteps;
  report("finalize");

  return {
    shareId: finalizeData.shareId,
    editToken,
    url: finalizeData.url,
    name: finalizeData.name || input.name,
    creator: finalizeData.creator || input.creator,
  };
}
