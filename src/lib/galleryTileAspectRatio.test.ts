import assert from "node:assert/strict";
import test from "node:test";
import { galleryImageCoversTile, galleryTileAspectRatio } from "./galleryTileAspectRatio.ts";

const url = (w: number, h: number) =>
  `https://cdn.sanity.io/images/am3v0x1c/production/abc-${w}x${h}.webp?w=1200&q=85`;

test("uses the most common aspect ratio", () => {
  assert.equal(
    galleryTileAspectRatio([url(960, 540), url(750, 1000), url(1920, 1080)]),
    960 / 540,
  );
});

test("breaks ties with the first image", () => {
  assert.equal(
    galleryTileAspectRatio([url(750, 1000), url(750, 1000), url(750, 937), url(750, 937)]),
    0.75,
  );
});

test("returns undefined when no dimensions are available", () => {
  assert.equal(galleryTileAspectRatio(["https://example.com/photo.jpg"]), undefined);
});

test("crops images close to the tile shape", () => {
  assert.equal(galleryImageCoversTile(url(750, 937), 0.75), true);
});

test("does not crop images far from the tile shape", () => {
  assert.equal(galleryImageCoversTile(url(3991, 3791), 2360 / 1640), false);
});
