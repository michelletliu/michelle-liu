import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";
import {
  isGalleryPaintingId,
  sanitizeCreatorName,
  sanitizeGalleryName,
  type SharedGalleryHang,
  type SharedGalleryMeta,
} from "../../components/gallery/sharedGallery.ts";

/** Public Vercel Blob store host: `{storeId}.public.blob.vercel-storage.com`. */
const VERCEL_BLOB_PUBLIC_HOST_RE =
  /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

/**
 * Blob defaults to ~1 month CDN cache. Overwriting the same hang pathname
 * keeps the same public URL, so browsers/CDN would keep serving the prior PNG
 * after a regenerate + update. Query bust + short max-age force a fresh fetch.
 */
const HANG_CACHE_MAX_AGE_SEC = 60;

/**
 * Pin hang URLs to *this* project's public Blob store.
 * Prefer `BLOB_PUBLIC_HOST`; otherwise derive `{storeId}.public…` from
 * `vercel_blob_rw_{storeId}_…` tokens. Without either, fall back to the
 * public-host shape check (weaker — any Vercel public store).
 */
export function resolveBlobPublicHost(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const explicit = env.BLOB_PUBLIC_HOST?.trim().toLowerCase();
  if (explicit) return explicit;

  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  const match = /^vercel_blob_rw_([A-Za-z0-9]+)_/i.exec(token);
  if (!match?.[1]) return null;
  return `${match[1].toLowerCase()}.public.blob.vercel-storage.com`;
}

function isAllowedBlobPublicHost(hostname: string): boolean {
  const pinned = resolveBlobPublicHost();
  if (pinned) return hostname.toLowerCase() === pinned;
  return VERCEL_BLOB_PUBLIC_HOST_RE.test(hostname);
}

export function metaPath(shareId: string): string {
  return `galleries/${shareId}/meta.json`;
}

/** Stored hang formats. Live generate prefers WebP; legacy shares keep PNG. */
export type HangImageFormat = "png" | "webp";

export function hangPath(
  shareId: string,
  paintingId: string,
  format: HangImageFormat = "png",
): string {
  return `galleries/${shareId}/${paintingId}.${format}`;
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
    if (!isAllowedBlobPublicHost(url.hostname)) return false;
    const path = url.pathname;
    return (
      path === `/${hangPath(shareId, paintingId, "png")}` ||
      path === `/${hangPath(shareId, paintingId, "webp")}`
    );
  } catch {
    return false;
  }
}

function parseSharedHang(
  value: unknown,
  shareId: string,
): SharedGalleryHang | null {
  if (!value || typeof value !== "object") return null;
  const hang = value as Partial<SharedGalleryHang>;
  if (typeof hang.paintingId !== "string" || !isGalleryPaintingId(hang.paintingId)) {
    return null;
  }
  if (typeof hang.imageUrl !== "string") return null;
  if (!hangUrlBelongsToShare(hang.imageUrl, shareId, hang.paintingId)) {
    return null;
  }
  const inspirationTitle =
    typeof hang.inspirationTitle === "string" && hang.inspirationTitle.trim()
      ? hang.inspirationTitle.trim()
      : undefined;
  return {
    paintingId: hang.paintingId,
    imageUrl: hang.imageUrl,
    ...(inspirationTitle ? { inspirationTitle } : {}),
  };
}

export async function putHangImage(
  shareId: string,
  paintingId: string,
  body: Blob | ArrayBuffer | Buffer,
  format: HangImageFormat,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<{ url: string }> {
  const bytes =
    body instanceof Blob
      ? Buffer.from(await body.arrayBuffer())
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body);
  const contentType = format === "webp" ? "image/webp" : "image/png";
  const result = await put(hangPath(shareId, paintingId, format), bytes, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    cacheControlMaxAge: HANG_CACHE_MAX_AGE_SEC,
  });
  return {
    url: withHangCacheBust(result.url, hangContentVersion(bytes)),
  };
}

/** @deprecated Prefer `putHangImage` — kept for call sites that only upload PNG. */
export async function putHangPng(
  shareId: string,
  paintingId: string,
  body: Blob | ArrayBuffer | Buffer,
  options: { overwrite?: boolean } = {},
): Promise<{ url: string }> {
  return putHangImage(shareId, paintingId, body, "png", options);
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
    const parsed = JSON.parse(text) as Partial<SharedGalleryMeta>;
    if (parsed?.version !== 1 || parsed.shareId !== shareId) {
      return null;
    }
    const name = sanitizeGalleryName(
      typeof parsed.name === "string" ? parsed.name : "",
    );
    if (!name) return null;
    if (typeof parsed.createdAt !== "string" || typeof parsed.updatedAt !== "string") {
      return null;
    }
    if (!Array.isArray(parsed.hangs)) return null;
    const hangs: SharedGalleryHang[] = [];
    for (const entry of parsed.hangs) {
      const hang = parseSharedHang(entry, shareId);
      if (!hang) return null;
      hangs.push(hang);
    }
    const creator =
      typeof parsed.creator === "string"
        ? sanitizeCreatorName(parsed.creator) ?? undefined
        : undefined;
    return {
      version: 1,
      shareId,
      name,
      ...(creator ? { creator } : {}),
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
      hangs,
    };
  } catch {
    return null;
  }
}
