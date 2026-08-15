/**
 * Saving a generated canvas to disk.
 *
 * The generate route hands back a `data:` URL today, but that is an
 * implementation detail of the generation response, so the download path also
 * handles a remote http(s) URL by pulling it into a blob first.
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

/** Characters Windows (and most filesystems) reject in a filename. */
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/**
 * Soft ceiling for a single filename (base + extension). macOS/Windows allow
 * ~255; stay under that so a Downloads folder path still fits MAX_PATH, without
 * chopping ordinary Met titles mid-phrase.
 */
const MAX_FILENAME_LENGTH = 200;

/** Default label budget — long enough for full Met titles like The Great Wave. */
const DEFAULT_LABEL_MAX = 180;

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
 * Keep a human-readable label filesystem-safe: strip illegal characters and
 * control chars, collapse whitespace, preserve case and spaces.
 *
 * Truncates only when an explicit or default ceiling is hit, preferring a
 * word boundary so titles are not sliced mid-phrase.
 */
export function sanitizeFilenameLabel(
  text: string,
  maxLength = DEFAULT_LABEL_MAX,
): string {
  const cleaned = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(ILLEGAL_FILENAME_CHARS, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return truncateAtWordBoundary(cleaned, maxLength);
}

/** Prefer cutting on a space; fall back to a hard slice. Strip trailing crumbs. */
function truncateAtWordBoundary(text: string, maxLength: number): string {
  let truncated = text.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxLength * 0.55)) {
    truncated = truncated.slice(0, lastSpace).trimEnd();
  }
  // Drop dangling punctuation and short connectors left by a mid-title cut
  // ("…, or" / "… from the") so the filename does not end mid-phrase.
  for (let i = 0; i < 3; i++) {
    const next = truncated
      .replace(/[,;:\-–—.(]+$/u, "")
      .replace(/\b(?:or|and|the|a|an|from|of|to|in|with)\s*$/i, "")
      .trimEnd();
    if (next === truncated) break;
    truncated = next;
  }
  return truncated;
}

/**
 * Reduce arbitrary text to a compact slug (ASCII-ish, hyphen-separated).
 * Kept for callers that still want a slug; download names use
 * {@link sanitizeFilenameLabel} instead.
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

export type GeneratedFilenameParts = {
  /** Title of the Met artwork used as inspiration, when there was one. */
  inspirationTitle?: string | null;
  imageUrl: string;
};

/**
 * Names the file after the inspiration when present, otherwise a plain
 * "Artwork" label. Browser overwrite-on-redownload is fine — no timestamp.
 *
 * Examples: `Inspired by The Lake of Zug.png`, `Artwork.png`
 *
 * Keeps the full Met title whenever it fits under {@link MAX_FILENAME_LENGTH};
 * only then trims at a word boundary so `.png` is never glued to a mid-phrase cut.
 */
export function generatedImageFilename({
  inspirationTitle,
  imageUrl,
}: GeneratedFilenameParts): string {
  const extension = extensionForMimeType(mimeTypeFromUrl(imageUrl));
  const maxBase = MAX_FILENAME_LENGTH - extension.length - 1;
  const title = inspirationTitle
    ? sanitizeFilenameLabel(inspirationTitle, maxBase)
    : "";
  let base = title ? `Inspired by ${title}` : "Artwork";

  if (base.length > maxBase) {
    const prefix = "Inspired by ";
    const titleBudget = Math.max(24, maxBase - prefix.length);
    const shortTitle = sanitizeFilenameLabel(title, titleBudget);
    base = shortTitle ? `${prefix}${shortTitle}` : "Artwork";
    if (base.length > maxBase) {
      base = truncateAtWordBoundary(base, maxBase);
    }
  }

  return `${base}.${extension}`;
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
