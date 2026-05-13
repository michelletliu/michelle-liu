import crypto from "crypto";

// ---------------------------------------------------------------------------
// Constant-time string comparison via HMAC (avoids length-leak of timingSafeEqual).
// ---------------------------------------------------------------------------
export function safeEqual(a: string, b: string): boolean {
  const key = crypto.randomBytes(32);
  const ha = crypto.createHmac("sha256", key).update(a).digest();
  const hb = crypto.createHmac("sha256", key).update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---------------------------------------------------------------------------
// Signing helpers for the unlock cookie.
// Requires PASSWORD_SIGNING_SECRET env var (≥ 32 random characters).
// ---------------------------------------------------------------------------
function getSigningKey(): Buffer | null {
  const raw = process.env.PASSWORD_SIGNING_SECRET;
  if (!raw || raw.length < 32) return null;
  return Buffer.from(raw, "utf-8");
}

export function signUnlockToken(project: string): string | null {
  const key = getSigningKey();
  if (!key) return null;
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto
    .createHmac("sha256", key)
    .update(`${project}:${ts}`)
    .digest("hex");
  return `${ts}.${sig}`;
}

export function verifyUnlockToken(
  project: string,
  token: string,
  maxAgeSec = 86400,
): boolean {
  const key = getSigningKey();
  if (!key) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const ts = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const age = Math.floor(Date.now() / 1000) - Number(ts);
  if (Number.isNaN(age) || age < 0 || age > maxAgeSec) return false;
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${project}:${ts}`)
    .digest("hex");
  return safeEqual(sig, expected);
}

export function unlockCookieName(project: string): string {
  return `unlock_${project}`;
}
