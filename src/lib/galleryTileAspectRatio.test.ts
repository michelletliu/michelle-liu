import assert from "node:assert/strict";
import test from "node:test";
import { galleryTileAspectRatio } from "./galleryTileAspectRatio.ts";

const url = (w: number, h: number) =>
  `https://cdn.sanity.io/images/am3v0x1c/production/abc-${w}x${h}.webp?w=1200&q=85`;

test("uses the most common aspect ratio", () => {
  assert.equal(
    galleryTileAspectRatio([url(960, 540), url(750, 1000), url(1920, 1080)]),
    "960 / 540",
  );
});

test("breaks ties with the first image", () => {
  assert.equal(
    galleryTileAspectRatio([url(750, 1000), url(750, 1000), url(750, 937), url(750, 937)]),
    "750 / 1000",
  );
});

test("returns undefined when no dimensions are available", () => {
  assert.equal(galleryTileAspectRatio(["https://example.com/photo.jpg"]), undefined);
});
