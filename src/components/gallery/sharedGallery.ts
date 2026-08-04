export const MAX_GALLERY_NAME_LENGTH = 80;
/** Same length budget as gallery name — creator shows in viewer chrome. */
export const MAX_CREATOR_NAME_LENGTH = MAX_GALLERY_NAME_LENGTH;
export const MAX_HANG_BYTES = 8 * 1024 * 1024;
/** Opaque fallback id length when a name cannot yield a slug. */
export const SHARE_ID_LENGTH = 12;
/**
 * Public path segment under `/gallery/s/…`. Name-derived slugs stay readable;
 * legacy opaque ids (12 chars) remain valid forever.
 */
export const MAX_SHARE_ID_LENGTH = 48;
/** Slug base before `-2` / `-3` uniqueness suffixes. */
export const SHARE_SLUG_BASE_LENGTH = 40;
/**
 * Max numbered slug probes (`name`, `name-2`, …) before falling back to an
 * opaque id. Keeps unauthenticated create from scanning hundreds of blob keys.
 */
export const MAX_SHARE_SLUG_PROBES = 8;
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
  /** Display name of who made the gallery; omitted on legacy shares. */
  creator?: string;
  createdAt: string;
  updatedAt: string;
  hangs: SharedGalleryHang[];
};

export type LastShareRecord = {
  shareId: string;
  name: string;
  /** Prefill “Your name” when updating an existing share this session. */
  creator?: string;
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

/** Same cleaning rules as gallery name (creator attribution). */
export function sanitizeCreatorName(raw: string): string | null {
  const cleaned = sanitizeGalleryName(raw);
  if (!cleaned) return null;
  return cleaned.slice(0, MAX_CREATOR_NAME_LENGTH);
}

/**
 * Viewer chrome / metadata label: `"Name by Creator"` when creator is set,
 * otherwise just the gallery name (legacy shares).
 */
export function formatGalleryAttribution(
  name: string,
  creator?: string | null,
): string {
  const who = typeof creator === "string" ? creator.trim() : "";
  return who ? `${name} by ${who}` : name;
}

export function readLastShare(): LastShareRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_SHARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastShareRecord>;
    if (
      typeof parsed.shareId !== "string" ||
      !isValidShareId(parsed.shareId) ||
      typeof parsed.name !== "string" ||
      typeof parsed.editToken !== "string" ||
      !parsed.editToken
    ) {
      return null;
    }
    const creator =
      typeof parsed.creator === "string"
        ? sanitizeCreatorName(parsed.creator) ?? undefined
        : undefined;
    return {
      shareId: parsed.shareId,
      name: parsed.name,
      ...(creator ? { creator } : {}),
      editToken: parsed.editToken,
    };
  } catch {
    return null;
  }
}

export function writeLastShare(record: LastShareRecord): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_SHARE_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private mode / quota — update UX still works for this session via state.
  }
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

/**
 * True when `id` is a safe public share path segment.
 * Accepts legacy opaque ids and newer name-derived slugs (`michelle`, `michelle-2`).
 */
export function isValidShareId(id: string): boolean {
  return (
    Boolean(id) &&
    id.length <= MAX_SHARE_ID_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(id)
  );
}

/**
 * Turn a gallery display name into a URL slug (`Michelle's Room` → `michelles-room`).
 * Returns `null` when nothing URL-safe remains (emoji-only names, etc.).
 */
export function slugifyGalleryShareId(
  name: string,
  maxLength = SHARE_SLUG_BASE_LENGTH,
): string | null {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return null;
  if (slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-+$/g, "") || null;
}

/**
 * Pick the first free slug for `name`: `michelle`, then `michelle-2`, …
 * Falls back to an opaque id when the name cannot slugify, after
 * `MAX_SHARE_SLUG_PROBES` collisions, or when suffixes are exhausted.
 *
 * `isTaken` should be true for both finished galleries and in-progress creates
 * (edit secret already reserved).
 */
export async function allocateShareSlug(
  name: string,
  isTaken: (id: string) => Promise<boolean>,
  randomBytes: (n: number) => Uint8Array,
): Promise<string> {
  const base = slugifyGalleryShareId(name) ?? "gallery";
  for (let n = 1; n <= MAX_SHARE_SLUG_PROBES; n++) {
    const suffix = n === 1 ? "" : `-${n}`;
    const maxBase = MAX_SHARE_ID_LENGTH - suffix.length;
    const trimmed =
      base.length <= maxBase
        ? base
        : base.slice(0, maxBase).replace(/-+$/g, "") || "gallery";
    const candidate = `${trimmed}${suffix}`;
    if (!isValidShareId(candidate)) continue;
    if (!(await isTaken(candidate))) return candidate;
  }
  // Collision storm or probe budget exhausted — opaque id is unique enough.
  for (let attempt = 0; attempt < 8; attempt++) {
    const opaque = createShareId(randomBytes);
    if (!(await isTaken(opaque))) return opaque;
  }
  return createShareId(randomBytes);
}
