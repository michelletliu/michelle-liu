import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAME_LIP_WIDTH,
  MAT_WIDTH,
  frameGeometryForArtwork,
} from "./galleryFrameGeometry.ts";

const closeTo = (actual: number, expected: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`,
  );
};

test("3:2 landscape artwork has one world-space mat width on every side", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 3 / 2);

  closeTo(geometry.art.width, 1.95, "art width");
  closeTo(geometry.art.height, 1.3, "art height");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "left/right mat",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "top/bottom mat",
  );
});

test("3:4 portrait artwork has the same physical mat and frame lip", () => {
  const geometry = frameGeometryForArtwork(1.15, 1.55, 3 / 4);

  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "portrait horizontal mat",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "portrait vertical mat",
  );
  closeTo(
    (geometry.frame.width - geometry.matte.width) / 2,
    FRAME_LIP_WIDTH,
    "portrait horizontal lip",
  );
  closeTo(
    (geometry.frame.height - geometry.matte.height) / 2,
    FRAME_LIP_WIDTH,
    "portrait vertical lip",
  );
});

test("square-ish artwork is contained without distortion or uneven matting", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 1);

  closeTo(geometry.art.width, 1.32, "square art width");
  closeTo(geometry.art.height, 1.32, "square art height");
  closeTo(geometry.art.width / geometry.art.height, 1, "square art aspect");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    (geometry.matte.height - geometry.art.height) / 2,
    "square mat equality",
  );
});
