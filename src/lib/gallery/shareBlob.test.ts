import assert from "node:assert/strict";
import test from "node:test";
import {
  hangContentVersion,
  hangUrlBelongsToShare,
  withHangCacheBust,
} from "./shareBlob.ts";

const SHARE = "abc123XYZ_-";
const PAINTING = "front-1";
const TRUSTED = `https://mystoreid.public.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`;

test("hangUrlBelongsToShare accepts trusted Vercel Blob hang URLs", () => {
  assert.equal(hangUrlBelongsToShare(TRUSTED, SHARE, PAINTING), true);
});

test("hangUrlBelongsToShare accepts cache-bust query on hang URLs", () => {
  assert.equal(
    hangUrlBelongsToShare(`${TRUSTED}?v=abc123def456`, SHARE, PAINTING),
    true,
  );
});

test("hangContentVersion is stable for the same bytes", () => {
  const a = hangContentVersion(Buffer.from("png-bytes"));
  const b = hangContentVersion(Buffer.from("png-bytes"));
  const c = hangContentVersion(Buffer.from("other-bytes"));
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a.length, 12);
});

test("withHangCacheBust sets and replaces v query", () => {
  assert.equal(
    withHangCacheBust(TRUSTED, "aaa"),
    `${TRUSTED}?v=aaa`,
  );
  assert.equal(
    withHangCacheBust(`${TRUSTED}?v=old`, "new"),
    `${TRUSTED}?v=new`,
  );
});

test("hangUrlBelongsToShare rejects attacker hosts with matching pathname", () => {
  const evil = `https://evil.example/galleries/${SHARE}/${PAINTING}.png`;
  assert.equal(hangUrlBelongsToShare(evil, SHARE, PAINTING), false);
});

test("hangUrlBelongsToShare rejects pathname that only contains the share prefix", () => {
  const nested = `https://mystoreid.public.blob.vercel-storage.com/cdn/galleries/${SHARE}/${PAINTING}.png`;
  assert.equal(hangUrlBelongsToShare(nested, SHARE, PAINTING), false);
});

test("hangUrlBelongsToShare rejects wrong painting id under the same share", () => {
  const other = `https://mystoreid.public.blob.vercel-storage.com/galleries/${SHARE}/left-2.png`;
  assert.equal(hangUrlBelongsToShare(other, SHARE, PAINTING), false);
});

test("hangUrlBelongsToShare rejects http and credentialed URLs", () => {
  assert.equal(
    hangUrlBelongsToShare(
      `http://mystoreid.public.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`,
      SHARE,
      PAINTING,
    ),
    false,
  );
  assert.equal(
    hangUrlBelongsToShare(
      `https://user:pass@mystoreid.public.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`,
      SHARE,
      PAINTING,
    ),
    false,
  );
});

test("hangUrlBelongsToShare rejects non-public blob hosts", () => {
  assert.equal(
    hangUrlBelongsToShare(
      `https://mystoreid.private.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`,
      SHARE,
      PAINTING,
    ),
    false,
  );
  assert.equal(
    hangUrlBelongsToShare(
      `https://public.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`,
      SHARE,
      PAINTING,
    ),
    false,
  );
});
