import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";
import type { SharedGalleryMeta } from "@/components/gallery/sharedGallery";

/** Public Vercel Blob store host: `{storeId}.public.blob.vercel-storage.com`. */
const VERCEL_BLOB_PUBLIC_HOST_RE =
  /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

/**
 * Blob defaults to ~1 month CDN cache. Overwriting the same hang pathname
 * keeps the same public URL, so browsers/CDN would keep serving the prior PNG
 * after a regenerate + update. Query bust + short max-age force a fresh fetch.
 */
const HANG_CACHE_MAX_AGE_SEC = 60;

export function metaPath(shareId: string): string {
  return `galleries/${shareId}/meta.json`;
}

export function hangPath(shareId: string, paintingId: string): string {
  return `galleries/${shareId}/${paintingId}.png`;
}

/** Short content fingerprint for hang URL cache-busting (`?v=`). */
export function hangContentVersion(body: Buffer | ArrayBuffer | Uint8Array): string {
  const bytes = Buffer.isBuffer(body)
    ? body
    : body instanceof ArrayBuffer
      ? Buffer.from(body)
      : Buffer.from(body);
  return createHash("sha256").update(bytes).digest("hex").slice(0, 12);
}

/**
 * Append or replace `?v=` so regenerated hangs do not share a stale cache key
 * with the previous overwrite at the same pathname.
 */
export function withHangCacheBust(blobUrl: string, version: string): string {
  const url = new URL(blobUrl);
  url.searchParams.set("v", version);
  return url.toString();
}

/**
 * True when `imageUrl` is an https public Vercel Blob URL for this share hang.
 * Rejects attacker-controlled hosts that only mimic the pathname prefix.
 * Query params (e.g. cache bust `?v=`) are ignored for the path check.
 */
export function hangUrlBelongsToShare(
  imageUrl: string,
  shareId: string,
  paintingId: string,
): boolean {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (!VERCEL_BLOB_PUBLIC_HOST_RE.test(url.hostname)) return false;
    return url.pathname === `/${hangPath(shareId, paintingId)}`;
  } catch {
    return false;
  }
}

export async function putHangPng(
  shareId: string,
  paintingId: string,
  body: Blob | ArrayBuffer | Buffer,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<{ url: string }> {
  const bytes =
    body instanceof Blob
      ? Buffer.from(await body.arrayBuffer())
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body);
  const result = await put(hangPath(shareId, paintingId), bytes, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    cacheControlMaxAge: HANG_CACHE_MAX_AGE_SEC,
  });
  return {
    url: withHangCacheBust(result.url, hangContentVersion(bytes)),
  };
}

export async function putShareMeta(
  meta: SharedGalleryMeta,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<void> {
  await put(metaPath(meta.shareId), JSON.stringify(meta), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

export async function getShareMeta(
  shareId: string,
): Promise<SharedGalleryMeta | null> {
  try {
    // Bypass CDN so update→read and finalize checks see the latest meta.
    const result = await get(metaPath(shareId), {
      access: "public",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as SharedGalleryMeta;
    if (parsed?.version !== 1 || typeof parsed.shareId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
