/**
 * Saving a generated canvas to disk.
 *
 * The generate route hands back a `data:` URL today, but that is an
 * implementation detail of the Reve response, so the download path also handles
 * a remote http(s) URL by pulling it into a blob first.
 */

const DEFAULT_EXTENSION = "png";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function extensionForMimeType(mimeType: string | null): string {
  if (!mimeType) return DEFAULT_EXTENSION;
  return MIME_EXTENSIONS[mimeType.trim().toLowerCase()] ?? DEFAULT_EXTENSION;
}

/** The MIME type declared by a data URL, or `null` for any other URL. */
export function mimeTypeFromUrl(url: string): string | null {
  const match = /^data:([^;,]+)[;,]/i.exec(url.trim());
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * Reduce arbitrary text (an artwork title, say) to something safe on every
 * filesystem: ASCII-ish, no separators, no leading/trailing punctuation.
 */
export function slugifyForFilename(text: string, maxLength = 40): string {
  const slug = text
    .normalize("NFKD")
    // Drop combining marks so accented letters become their base letter.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

/** `2026-07-24T17-05-31` — sortable, and legal on Windows (no colons). */
export function filenameTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

export type GeneratedFilenameParts = {
  /** Title of the Met artwork used as inspiration, when there was one. */
  inspirationTitle?: string | null;
  imageUrl: string;
  date?: Date;
};

/**
 * Names the file after what the image is, never after the canvas it hangs on:
 * `back-2` is an internal identifier and means nothing in a downloads folder.
 * The timestamp is what keeps successive downloads distinct.
 */
export function generatedImageFilename({
  inspirationTitle,
  imageUrl,
  date = new Date(),
}: GeneratedFilenameParts): string {
  const extension = extensionForMimeType(mimeTypeFromUrl(imageUrl));
  const titleSlug = inspirationTitle ? slugifyForFilename(inspirationTitle) : "";
  const parts = ["gallery", titleSlug, filenameTimestamp(date)];

  return `${parts.filter(Boolean).join("-")}.${extension}`;
}

function triggerAnchorDownload(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Save `url` as `filename`. Data URLs go straight to an anchor; anything else is
 * fetched into a blob so the browser saves it rather than navigating to it.
 */
export async function downloadImage(
  url: string,
  filename: string,
): Promise<void> {
  if (url.startsWith("data:")) {
    triggerAnchorDownload(url, filename);
    return;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch the image (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerAnchorDownload(objectUrl, filename);
  } finally {
    // Revoked on the next tick so the click has been dispatched first.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}
