import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomBytes } from "node:crypto";
import {
  editTokenFromRequest,
  editTokensMatch,
  hashEditToken,
  mintShareEditToken,
  verifyShareEditTokenHmac,
} from "./shareEditAuth.ts";
import {
  createEditToken,
  EDIT_TOKEN_HEADER,
  EDIT_TOKEN_LENGTH,
} from "../../components/gallery/sharedGallery.ts";

test("createEditToken returns opaque URL-safe secret longer than share id", () => {
  const token = createEditToken((n) => {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = (i * 19 + 7) % 256;
    return bytes;
  });
  assert.equal(token.length, EDIT_TOKEN_LENGTH);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test("hashEditToken is stable and not the raw token", () => {
  const token = "abcDEF0123-_xyz";
  const hash = hashEditToken(token);
  assert.equal(hash, hashEditToken(token));
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("editTokensMatch accepts the correct token only", () => {
  const token = createEditToken((n) => new Uint8Array(n).fill(42));
  const storedHash = hashEditToken(token);
  assert.equal(editTokensMatch(token, storedHash), true);
  assert.equal(editTokensMatch("wrong-token", storedHash), false);
  assert.equal(editTokensMatch("", storedHash), false);
});

test("editTokenFromRequest reads the write-capability header", () => {
  assert.equal(
    editTokenFromRequest({
      headers: {
        get: (name) => (name === EDIT_TOKEN_HEADER ? " secret " : null),
      },
    }),
    "secret",
  );
  assert.equal(
    editTokenFromRequest({
      headers: { get: () => null },
    }),
    null,
  );
});

test("mintShareEditToken is bound to shareId via HMAC", () => {
  process.env.BLOB_READ_WRITE_TOKEN ??=
    "vercel_blob_rw_teststore_dummytokenfortests";
  const token = mintShareEditToken("michelle", (n) => randomBytes(n));
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(verifyShareEditTokenHmac("michelle", token), true);
  assert.equal(verifyShareEditTokenHmac("other-slug", token), false);
  assert.equal(verifyShareEditTokenHmac("michelle", "not-a-hmac-token"), false);
  // Tamper mac
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(verifyShareEditTokenHmac("michelle", tampered), false);
  // Hash still works for edit.json storage
  assert.match(hashEditToken(token), /^[a-f0-9]{64}$/);
  assert.notEqual(
    hashEditToken(token),
    createHash("sha256").update("x").digest("hex"),
  );
});
