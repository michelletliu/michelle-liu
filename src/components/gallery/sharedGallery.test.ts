import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateShareSlug,
  createEditToken,
  createShareId,
  EDIT_TOKEN_LENGTH,
  isGalleryPaintingId,
  isValidShareId,
  MAX_GALLERY_NAME_LENGTH,
  MAX_SHARE_ID_LENGTH,
  sanitizeGalleryName,
  SHARE_ID_LENGTH,
  slugifyGalleryShareId,
} from "./sharedGallery.ts";

test("sanitizeGalleryName trims and strips control characters", () => {
  assert.equal(sanitizeGalleryName("  My Gallery\n "), "My Gallery");
  assert.equal(sanitizeGalleryName("\u0000Hello\u007f"), "Hello");
});

test("sanitizeGalleryName returns null for empty / whitespace", () => {
  assert.equal(sanitizeGalleryName(""), null);
  assert.equal(sanitizeGalleryName("   "), null);
  assert.equal(sanitizeGalleryName("\n\t"), null);
});

test("sanitizeGalleryName enforces max length", () => {
  const long = "a".repeat(MAX_GALLERY_NAME_LENGTH + 20);
  const result = sanitizeGalleryName(long);
  assert.ok(result);
  assert.equal(result.length, MAX_GALLERY_NAME_LENGTH);
});

test("isGalleryPaintingId accepts room hang ids only", () => {
  assert.equal(isGalleryPaintingId("left-1"), true);
  assert.equal(isGalleryPaintingId("front-3"), true);
  assert.equal(isGalleryPaintingId("left-99"), false);
  assert.equal(isGalleryPaintingId(""), false);
});

test("createShareId returns opaque URL-safe id of expected length", () => {
  const id = createShareId((n) => {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = i * 17;
    return bytes;
  });
  assert.equal(id.length, 12);
  assert.match(id, /^[A-Za-z0-9_-]+$/);
});

test("createEditToken is longer than share id and URL-safe", () => {
  const token = createEditToken((n) => {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = i * 3;
    return bytes;
  });
  assert.equal(token.length, EDIT_TOKEN_LENGTH);
  assert.ok(token.length > SHARE_ID_LENGTH);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test("isValidShareId accepts legacy opaque ids and name slugs", () => {
  assert.equal(isValidShareId("vvapHY3AIE"), true);
  assert.equal(isValidShareId("michelle"), true);
  assert.equal(isValidShareId("michelle-2"), true);
  assert.equal(isValidShareId(""), false);
  assert.equal(isValidShareId("bad id"), false);
  assert.equal(isValidShareId("a".repeat(MAX_SHARE_ID_LENGTH + 1)), false);
});

test("slugifyGalleryShareId builds readable path segments", () => {
  assert.equal(slugifyGalleryShareId("Michelle"), "michelle");
  assert.equal(slugifyGalleryShareId("Michelle's Room"), "michelle-s-room");
  assert.equal(slugifyGalleryShareId("  Sunset / Gallery  "), "sunset-gallery");
  assert.equal(slugifyGalleryShareId("***"), null);
});

test("allocateShareSlug returns base then numbered suffixes", async () => {
  const taken = new Set(["michelle", "michelle-2"]);
  const id = await allocateShareSlug(
    "Michelle",
    async (candidate) => taken.has(candidate),
    (n) => new Uint8Array(n),
  );
  assert.equal(id, "michelle-3");
});

test("allocateShareSlug falls back to gallery when name cannot slugify", async () => {
  const id = await allocateShareSlug(
    "***",
    async () => false,
    (n) => new Uint8Array(n),
  );
  assert.equal(id, "gallery");
});
