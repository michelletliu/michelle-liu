export const MAX_GALLERY_NAME_LENGTH = 80;
export const MAX_HANG_BYTES = 8 * 1024 * 1024;
export const SHARE_ID_LENGTH = 12;
/** High-entropy secret for write ops; never embedded in the public share URL. */
export const EDIT_TOKEN_LENGTH = 32;
export const EDIT_TOKEN_HEADER = "x-gallery-edit-token";

export const LAST_SHARE_STORAGE_KEY = "gallery:lastShare";

export type SharedGalleryHang = {
  paintingId: string;
  imageUrl: string;
  inspirationTitle?: string;
};

export type SharedGalleryMeta = {
  version: 1;
  shareId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  hangs: SharedGalleryHang[];
};

export type LastShareRecord = {
  shareId: string;
  name: string;
  /** Creator-only write capability; required to update an existing share. */
  editToken: string;
};

/** Fixed hang ids: `{wall}-{1|2|3}` for the four room walls. */
const PAINTING_ID_RE = /^(left|right|back|front)-[1-3]$/;

/** True when `id` is one of the twelve fixed hang ids. */
export function isGalleryPaintingId(id: string): boolean {
  return PAINTING_ID_RE.test(id);
}

/**
 * Trim, strip control chars, enforce 1–80 length.
 * Returns `null` when empty after cleaning.
 */
export function sanitizeGalleryName(raw: string): string | null {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, MAX_GALLERY_NAME_LENGTH);
}

export function readLastShare(): LastShareRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_SHARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastShareRecord>;
    if (
      typeof parsed.shareId !== "string" ||
      !parsed.shareId ||
      typeof parsed.name !== "string" ||
      typeof parsed.editToken !== "string" ||
      !parsed.editToken
    ) {
      return null;
    }
    return {
      shareId: parsed.shareId,
      name: parsed.name,
      editToken: parsed.editToken,
    };
  } catch {
    return null;
  }
}

export function writeLastShare(record: LastShareRecord): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_SHARE_STORAGE_KEY, JSON.stringify(record));
}

export function clearLastShare(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LAST_SHARE_STORAGE_KEY);
}

const URL_SAFE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function opaqueUrlSafeId(
  length: number,
  randomBytes: (n: number) => Uint8Array,
): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += URL_SAFE_ALPHABET[bytes[i]! % 64]!;
  }
  return out;
}

/** Opaque URL-safe share id (~12 chars). */
export function createShareId(randomBytes: (n: number) => Uint8Array): string {
  return opaqueUrlSafeId(SHARE_ID_LENGTH, randomBytes);
}

/**
 * Opaque write capability for a share. Kept in sessionStorage only —
 * never put in the public viewer URL or public meta.json.
 */
export function createEditToken(randomBytes: (n: number) => Uint8Array): string {
  return opaqueUrlSafeId(EDIT_TOKEN_LENGTH, randomBytes);
}
