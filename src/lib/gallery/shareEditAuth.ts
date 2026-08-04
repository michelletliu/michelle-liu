import { createHash, timingSafeEqual } from "node:crypto";
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

export async function putShareEditSecret(
  shareId: string,
  tokenHash: string,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<void> {
  const body: ShareEditSecret = { version: 1, tokenHash };
  // Public store only allows public blobs. Payload is a SHA-256 of a
  // high-entropy edit token (not reversible), never the raw token.
  await put(editSecretPath(shareId), JSON.stringify(body), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

export async function getShareEditSecret(
  shareId: string,
): Promise<ShareEditSecret | null> {
  try {
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
  } catch {
    return null;
  }
}

/**
 * True when `token` matches the private edit secret for `shareId`.
 * Galleries without an edit secret (legacy) cannot be written.
 */
export async function verifyShareEditToken(
  shareId: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (typeof token !== "string" || !token.trim()) return false;
  const secret = await getShareEditSecret(shareId);
  if (!secret) return false;
  return editTokensMatch(token.trim(), secret.tokenHash);
}

export function editTokenFromRequest(req: {
  headers: { get(name: string): string | null };
}): string | null {
  const header = req.headers.get(EDIT_TOKEN_HEADER);
  if (typeof header === "string" && header.trim()) return header.trim();
  return null;
}
