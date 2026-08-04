import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { get, put } from "@vercel/blob";
import { EDIT_TOKEN_HEADER } from "../../components/gallery/sharedGallery.ts";

export type ShareEditSecret = {
  version: 1;
  tokenHash: string;
};

export function editSecretPath(shareId: string): string {
  return `galleries/${shareId}/edit.json`;
}

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Compare a presented token to a stored SHA-256 hex hash. */
export function editTokensMatch(token: string, storedHash: string): boolean {
  if (!token || !storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }
  const expected = Buffer.from(storedHash.toLowerCase(), "hex");
  const actual = Buffer.from(hashEditToken(token), "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/**
 * Short-lived OK cache so a save that uploads many hangs does not re-fetch
 * `edit.json` from Blob on every hang POST. Seeded only after successful verify
 * (not on unauthenticated share creation).
 */
const VERIFY_CACHE_TTL_MS = 30_000;
const VERIFY_CACHE_MAX_ENTRIES = 2_048;
const verifyOkCache = new Map<string, number>();

function pruneVerifyOkCache(now: number): void {
  for (const [key, expiresAt] of verifyOkCache) {
    if (expiresAt <= now) verifyOkCache.delete(key);
  }
  while (verifyOkCache.size > VERIFY_CACHE_MAX_ENTRIES) {
    const oldestKey = verifyOkCache.keys().next().value;
    if (oldestKey === undefined) break;
    verifyOkCache.delete(oldestKey);
  }
}

function rememberVerified(
  shareId: string,
  tokenHash: string,
  now = Date.now(),
): void {
  const key = `${shareId}:${tokenHash}`;
  // Re-insert so refreshed entries are newest under the insertion-order cap.
  if (verifyOkCache.has(key)) verifyOkCache.delete(key);
  verifyOkCache.set(key, now + VERIFY_CACHE_TTL_MS);
  pruneVerifyOkCache(now);
}

/** @internal Test-only accessors for verify-ok cache bounds. */
export const verifyOkCacheTestApi = {
  clear: () => {
    verifyOkCache.clear();
  },
  size: () => verifyOkCache.size,
  remember: (shareId: string, tokenHash: string, now?: number) =>
    rememberVerified(shareId, tokenHash, now),
  maxEntries: () => VERIFY_CACHE_MAX_ENTRIES,
  ttlMs: () => VERIFY_CACHE_TTL_MS,
};

/** Backoff when Blob GET of a fresh public object returns transient 403/5xx. */
const EDIT_SECRET_RETRY_DELAYS_MS = [0, 40, 120, 280] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableBlobReadError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /403|429|500|502|503|504|Forbidden|Too Many|fetch blob/i.test(message);
}

const HMAC_NONCE_LENGTH = 16;
const HMAC_MAC_LENGTH = 32;
const URL_SAFE = /^[A-Za-z0-9_-]+$/;

/**
 * Server-only key for shareId-bound edit tokens. Derived from an explicit
 * secret when set, otherwise from the Blob RW token (already required for share).
 */
function editHmacKey(): Buffer {
  const raw =
    process.env.GALLERY_EDIT_HMAC_SECRET?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    "";
  if (!raw) {
    throw new Error("Gallery edit HMAC secret is not configured.");
  }
  return createHash("sha256").update(`gallery-edit-v1:${raw}`, "utf8").digest();
}

function hmacMacForShare(shareId: string, nonce: string): string {
  return createHmac("sha256", editHmacKey())
    .update(`${shareId}:${nonce}`, "utf8")
    .digest("base64url")
    .slice(0, HMAC_MAC_LENGTH);
}

function opaqueNonce(
  length: number,
  randomBytes: (n: number) => Uint8Array,
): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i]! % 64]!;
  }
  return out;
}

/**
 * Mint a write capability bound to `shareId`.
 * Format: `{nonce}.{mac}` — verifiable locally without reading Blob, so
 * parallel hang uploads do not stampede `edit.json` GETs.
 */
export function mintShareEditToken(
  shareId: string,
  randomBytes: (n: number) => Uint8Array,
): string {
  const nonce = opaqueNonce(HMAC_NONCE_LENGTH, randomBytes);
  return `${nonce}.${hmacMacForShare(shareId, nonce)}`;
}

/**
 * True when `token` is a shareId-bound HMAC capability (not a legacy opaque token).
 */
export function verifyShareEditTokenHmac(
  shareId: string,
  token: string,
): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== HMAC_NONCE_LENGTH) return false;
  const nonce = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!URL_SAFE.test(nonce) || mac.length !== HMAC_MAC_LENGTH) return false;
  if (!URL_SAFE.test(mac)) return false;
  const expected = hmacMacForShare(shareId, nonce);
  if (expected.length !== mac.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
  } catch {
    return false;
  }
}

export async function putShareEditSecret(
  shareId: string,
  tokenHash: string,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<void> {
  const normalizedHash = tokenHash.toLowerCase();
  const body: ShareEditSecret = { version: 1, tokenHash: normalizedHash };
  // Public store only allows public blobs. Payload is a SHA-256 of a
  // high-entropy edit token (not reversible), never the raw token.
  await put(editSecretPath(shareId), JSON.stringify(body), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

/**
 * One attempt to load `edit.json`. Returns `null` for missing blobs.
 * Throws on retryable/transport Blob errors so callers can back off.
 */
async function readShareEditSecretOnce(
  shareId: string,
): Promise<ShareEditSecret | null> {
  const result = await get(editSecretPath(shareId), {
    access: "public",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as ShareEditSecret;
  if (
    parsed?.version !== 1 ||
    typeof parsed.tokenHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(parsed.tokenHash)
  ) {
    return null;
  }
  return { version: 1, tokenHash: parsed.tokenHash.toLowerCase() };
}

/**
 * Load the edit secret for `shareId` (legacy opaque-token path + slug probes).
 * Retries transient Blob 403/5xx. Clean 404 returns `null` immediately.
 */
export async function getShareEditSecret(
  shareId: string,
): Promise<ShareEditSecret | null> {
  let lastError: unknown;

  for (let i = 0; i < EDIT_SECRET_RETRY_DELAYS_MS.length; i++) {
    const delayMs = EDIT_SECRET_RETRY_DELAYS_MS[i]!;
    if (delayMs > 0) await sleep(delayMs);
    try {
      return await readShareEditSecretOnce(shareId);
    } catch (err) {
      lastError = err;
      if (!isRetryableBlobReadError(err)) throw err;
      if (i === EDIT_SECRET_RETRY_DELAYS_MS.length - 1) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to read gallery edit secret.");
}

/**
 * True when `token` matches the `{16-char-nonce}.{32-char-mac}` HMAC shape.
 * Legacy opaque tokens are a single 32-char segment with no dot.
 */
function looksLikeHmacEditToken(token: string): boolean {
  const dot = token.indexOf(".");
  return (
    dot === HMAC_NONCE_LENGTH &&
    token.length === HMAC_NONCE_LENGTH + 1 + HMAC_MAC_LENGTH &&
    URL_SAFE.test(token.slice(0, dot)) &&
    URL_SAFE.test(token.slice(dot + 1))
  );
}

/**
 * True when `token` may write `shareId`.
 *
 * Prefer shareId-bound HMAC tokens (no Blob read — safe under parallel hang
 * uploads). Fall back to `edit.json` hash check for legacy opaque tokens.
 *
 * Throws when the legacy Blob lookup fails after retries (caller should 502)
 * so store blips are not reported as permission failures.
 */
export async function verifyShareEditToken(
  shareId: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (typeof token !== "string" || !token.trim()) return false;
  const trimmed = token.trim();
  const tokenHash = hashEditToken(trimmed);
  const cacheKey = `${shareId}:${tokenHash}`;
  const now = Date.now();
  const cachedUntil = verifyOkCache.get(cacheKey);
  if (cachedUntil !== undefined) {
    if (cachedUntil > now) return true;
    verifyOkCache.delete(cacheKey);
  }

  // New tokens: local crypto only — avoids parallel GET storms on edit.json.
  if (looksLikeHmacEditToken(trimmed)) {
    if (!verifyShareEditTokenHmac(shareId, trimmed)) return false;
    rememberVerified(shareId, tokenHash);
    return true;
  }

  const secret = await getShareEditSecret(shareId);
  if (!secret) return false;
  const ok = editTokensMatch(trimmed, secret.tokenHash);
  if (ok) {
    rememberVerified(shareId, tokenHash);
  }
  return ok;
}

export function editTokenFromRequest(req: {
  headers: { get(name: string): string | null };
}): string | null {
  const header = req.headers.get(EDIT_TOKEN_HEADER);
  if (typeof header === "string" && header.trim()) return header.trim();
  return null;
}
