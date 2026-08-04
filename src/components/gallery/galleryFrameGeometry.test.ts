import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAME_LIP_WIDTH,
  MAT_WIDTH,
  coverUvTransform,
  frameGeometryForArtwork,
} from "./galleryFrameGeometry.ts";
import { paintingSize } from "./galleryPaintings.ts";

const closeTo = (actual: number, expected: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`,
  );
};

test("paint apertures match Reve 3:4 and 3:2 generate ratios", () => {
  const portrait = paintingSize("portrait");
  const landscape = paintingSize("landscape");
  closeTo(portrait.width / portrait.height, 3 / 4, "portrait aspect");
  closeTo(landscape.width / landscape.height, 3 / 2, "landscape aspect");
});

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

test("cover fill uses the full aperture and keeps the white mat ridge", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 1, "cover");

  closeTo(geometry.art.width, 1.95, "cover art width");
  closeTo(geometry.art.height, 1.32, "cover art height");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "cover mat ridge",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "cover mat ridge vertical",
  );
  closeTo(
    (geometry.frame.width - geometry.matte.width) / 2,
    FRAME_LIP_WIDTH,
    "cover lip",
  );
});

test("cover UV crops the wide side of a landscape image in a portrait aperture", () => {
  const uv = coverUvTransform(3 / 4, 3 / 2);
  closeTo(uv.repeatY, 1, "repeat Y");
  closeTo(uv.repeatX, (3 / 4) / (3 / 2), "repeat X");
  closeTo(uv.offsetX, (1 - uv.repeatX) / 2, "offset X");
  closeTo(uv.offsetY, 0, "offset Y");
});

test("cover UV crops the tall side of a portrait image in a landscape aperture", () => {
  const uv = coverUvTransform(3 / 2, 3 / 4);
  closeTo(uv.repeatX, 1, "repeat X");
  closeTo(uv.repeatY, (3 / 4) / (3 / 2), "repeat Y");
  closeTo(uv.offsetY, (1 - uv.repeatY) / 2, "offset Y");
  closeTo(uv.offsetX, 0, "offset X");
});
