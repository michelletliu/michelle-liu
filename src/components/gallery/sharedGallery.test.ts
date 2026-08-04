import assert from "node:assert/strict";
import test from "node:test";
import {
  createEditToken,
  createShareId,
  EDIT_TOKEN_LENGTH,
  isGalleryPaintingId,
  MAX_GALLERY_NAME_LENGTH,
  sanitizeGalleryName,
  SHARE_ID_LENGTH,
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
