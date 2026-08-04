import assert from "node:assert/strict";
import test from "node:test";
import {
  hangContentVersion,
  hangUrlBelongsToShare,
  resolveBlobPublicHost,
  withHangCacheBust,
} from "./shareBlob.ts";

const SHARE = "abc123XYZ_-";
const PAINTING = "front-1";
const TRUSTED_HOST = "mystoreid.public.blob.vercel-storage.com";
const TRUSTED = `https://${TRUSTED_HOST}/galleries/${SHARE}/${PAINTING}.png`;

function withPinnedHost(host: string | undefined, run: () => void) {
  const previousHost = process.env.BLOB_PUBLIC_HOST;
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (host === undefined) {
    delete process.env.BLOB_PUBLIC_HOST;
  } else {
    process.env.BLOB_PUBLIC_HOST = host;
  }
  // Clear token so host pinning doesn't silently switch to the local store id.
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    run();
  } finally {
    if (previousHost === undefined) delete process.env.BLOB_PUBLIC_HOST;
    else process.env.BLOB_PUBLIC_HOST = previousHost;
    if (previousToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previousToken;
  }
}

test("resolveBlobPublicHost prefers BLOB_PUBLIC_HOST then token store id", () => {
  assert.equal(
    resolveBlobPublicHost({
      BLOB_PUBLIC_HOST: "Custom.Public.Blob.Vercel-Storage.com",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_otherStore_secret",
    }),
    "custom.public.blob.vercel-storage.com",
  );
  assert.equal(
    resolveBlobPublicHost({
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_nnda12SCjbMfGDbu_secret",
    }),
    "nnda12scjbmfgdbu.public.blob.vercel-storage.com",
  );
  assert.equal(resolveBlobPublicHost({}), null);
});

test("hangUrlBelongsToShare accepts trusted Vercel Blob hang URLs", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    assert.equal(hangUrlBelongsToShare(TRUSTED, SHARE, PAINTING), true);
  });
});

test("hangUrlBelongsToShare accepts WebP hang URLs", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    const webp = `https://${TRUSTED_HOST}/galleries/${SHARE}/${PAINTING}.webp`;
    assert.equal(hangUrlBelongsToShare(webp, SHARE, PAINTING), true);
    assert.equal(
      hangUrlBelongsToShare(`${webp}?v=abc123def456`, SHARE, PAINTING),
      true,
    );
  });
});

test("hangUrlBelongsToShare accepts cache-bust query on hang URLs", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    assert.equal(
      hangUrlBelongsToShare(`${TRUSTED}?v=abc123def456`, SHARE, PAINTING),
      true,
    );
  });
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
  assert.equal(withHangCacheBust(TRUSTED, "aaa"), `${TRUSTED}?v=aaa`);
  assert.equal(
    withHangCacheBust(`${TRUSTED}?v=old`, "new"),
    `${TRUSTED}?v=new`,
  );
});

test("hangUrlBelongsToShare rejects attacker hosts with matching pathname", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    const evil = `https://evil.example/galleries/${SHARE}/${PAINTING}.png`;
    assert.equal(hangUrlBelongsToShare(evil, SHARE, PAINTING), false);
  });
});

test("hangUrlBelongsToShare rejects another Vercel public store when pinned", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    const otherStore = `https://attacker-store.public.blob.vercel-storage.com/galleries/${SHARE}/${PAINTING}.png`;
    assert.equal(hangUrlBelongsToShare(otherStore, SHARE, PAINTING), false);
  });
});

test("hangUrlBelongsToShare rejects pathname that only contains the share prefix", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    const nested = `https://${TRUSTED_HOST}/cdn/galleries/${SHARE}/${PAINTING}.png`;
    assert.equal(hangUrlBelongsToShare(nested, SHARE, PAINTING), false);
  });
});

test("hangUrlBelongsToShare rejects wrong painting id under the same share", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    const other = `https://${TRUSTED_HOST}/galleries/${SHARE}/left-2.png`;
    assert.equal(hangUrlBelongsToShare(other, SHARE, PAINTING), false);
  });
});

test("hangUrlBelongsToShare rejects http and credentialed URLs", () => {
  withPinnedHost(TRUSTED_HOST, () => {
    assert.equal(
      hangUrlBelongsToShare(
        `http://${TRUSTED_HOST}/galleries/${SHARE}/${PAINTING}.png`,
        SHARE,
        PAINTING,
      ),
      false,
    );
    assert.equal(
      hangUrlBelongsToShare(
        `https://user:pass@${TRUSTED_HOST}/galleries/${SHARE}/${PAINTING}.png`,
        SHARE,
        PAINTING,
      ),
      false,
    );
  });
});

test("hangUrlBelongsToShare rejects non-public blob hosts", () => {
  withPinnedHost(undefined, () => {
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
});
