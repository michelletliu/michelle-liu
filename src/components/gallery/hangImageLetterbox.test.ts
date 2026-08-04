import assert from "node:assert/strict";
import test from "node:test";
import {
  contentAspectAfterTrim,
  COVER_SAFETY_INSET,
  coverUvTransform,
  coverUvWithLetterbox,
  NO_LETTERBOX_TRIM,
} from "./galleryFrameGeometry.ts";
import { detectDarkLetterboxTrim } from "./hangImageLetterbox.ts";

function rgbaFill(
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y);
      const o = (y * width + x) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
  }
  return data;
}

test("clean painting with no dark pad returns zero trim", () => {
  const data = rgbaFill(64, 48, () => [120, 90, 70]);
  assert.deepEqual(detectDarkLetterboxTrim(64, 48, data), NO_LETTERBOX_TRIM);
});

test("uniform black keyline on every side is trimmed", () => {
  const pad = 4;
  const data = rgbaFill(100, 80, (x, y) => {
    if (x < pad || x >= 100 - pad || y < pad || y >= 80 - pad) {
      return [12, 12, 12];
    }
    return [140, 110, 90];
  });
  const trim = detectDarkLetterboxTrim(100, 80, data);
  assert.equal(trim.left, pad / 100);
  assert.equal(trim.right, pad / 100);
  assert.equal(trim.top, pad / 80);
  assert.equal(trim.bottom, pad / 80);
});

test("mostly-black painting is not mistaken for a letterbox", () => {
  const data = rgbaFill(64, 64, () => [8, 8, 8]);
  assert.deepEqual(detectDarkLetterboxTrim(64, 64, data), NO_LETTERBOX_TRIM);
});

test("dark paint under a black keyline is still trimmed", () => {
  // Butterfly-style: near-black pad, then dark brown pigment (below an absolute
  // "must look lit" floor, but clearly lifted above the pad).
  const pad = 4;
  const data = rgbaFill(80, 60, (_x, y) => {
    if (y < pad || y >= 60 - pad) return [6, 6, 6];
    if (y < pad + 8 || y >= 60 - pad - 8) return [48, 32, 18];
    return [140, 110, 90];
  });
  const trim = detectDarkLetterboxTrim(80, 60, data);
  assert.equal(trim.top, pad / 60);
  assert.equal(trim.bottom, pad / 60);
  assert.equal(trim.left, 0);
  assert.equal(trim.right, 0);
});

test("content aspect accounts for asymmetric letterbox crop", () => {
  const trim = { left: 0.05, right: 0.05, top: 0.1, bottom: 0 };
  assert.ok(Math.abs(contentAspectAfterTrim(2, trim) - 2) < 1e-9);
});

test("cover UV with letterbox insets the cover window into the content rect", () => {
  const trim = { left: 0.1, right: 0.1, top: 0.1, bottom: 0.1 };
  const uv = coverUvWithLetterbox(1.5, 1.5, trim, 0);
  assert.ok(Math.abs(uv.offsetX - 0.1) < 1e-9, `offsetX ${uv.offsetX}`);
  assert.ok(Math.abs(uv.offsetY - 0.1) < 1e-9, `offsetY ${uv.offsetY}`);
  assert.ok(Math.abs(uv.repeatX - 0.8) < 1e-9, `repeatX ${uv.repeatX}`);
  assert.ok(Math.abs(uv.repeatY - 0.8) < 1e-9, `repeatY ${uv.repeatY}`);
});

test("cover UV without trim matches plain cover when safety is off", () => {
  const uv = coverUvWithLetterbox(3 / 2, 3 / 4, NO_LETTERBOX_TRIM, 0);
  const plain = coverUvTransform(3 / 2, 3 / 4);
  assert.ok(Math.abs(uv.repeatX - plain.repeatX) < 1e-9);
  assert.ok(Math.abs(uv.repeatY - plain.repeatY) < 1e-9);
  assert.ok(Math.abs(uv.offsetX - plain.offsetX) < 1e-9);
  assert.ok(Math.abs(uv.offsetY - plain.offsetY) < 1e-9);
});

test("default cover UV applies a safety inset inside the letterbox window", () => {
  const uv = coverUvWithLetterbox(1.5, 1.5, NO_LETTERBOX_TRIM);
  const s = COVER_SAFETY_INSET;
  assert.ok(Math.abs(uv.offsetX - s) < 1e-9, `offsetX ${uv.offsetX}`);
  assert.ok(Math.abs(uv.offsetY - s) < 1e-9, `offsetY ${uv.offsetY}`);
  assert.ok(Math.abs(uv.repeatX - (1 - 2 * s)) < 1e-9, `repeatX ${uv.repeatX}`);
  assert.ok(Math.abs(uv.repeatY - (1 - 2 * s)) < 1e-9, `repeatY ${uv.repeatY}`);
});
