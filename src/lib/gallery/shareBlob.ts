import { get, put } from "@vercel/blob";
import type { SharedGalleryMeta } from "@/components/gallery/sharedGallery";

export function metaPath(shareId: string): string {
  return `galleries/${shareId}/meta.json`;
}

export function hangPath(shareId: string, paintingId: string): string {
  return `galleries/${shareId}/${paintingId}.png`;
}

export async function putHangPng(
  shareId: string,
  paintingId: string,
  body: Blob | ArrayBuffer | Buffer,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<{ url: string }> {
  const result = await put(hangPath(shareId, paintingId), body, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
  return { url: result.url };
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
