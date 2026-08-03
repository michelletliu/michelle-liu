import assert from "node:assert/strict";
import test from "node:test";
import {
  MET_BLACK_MAT_TRIM,
  metImageTrimScale,
  metImageTrimStyle,
} from "./metImageMat.ts";

test("Manet garden scene trims enough to clear its baked-in black mat", () => {
  assert.equal(MET_BLACK_MAT_TRIM[436965]! >= 0.07, true);
  assert.ok(metImageTrimScale(436965) > 1.15);
});

test("clean works stay unscaled", () => {
  assert.equal(metImageTrimScale(436528), 1); // Irises
  assert.equal(metImageTrimStyle(436528), undefined);
});

test("trim style only appears when a scale is needed", () => {
  assert.deepEqual(metImageTrimStyle(436965), {
    transform: `scale(${metImageTrimScale(436965)})`,
  });
});
