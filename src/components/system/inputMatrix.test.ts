import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getHorizontalFadeVisibility } from "./inputMatrixScroll.ts";

const section = readFileSync(
  new URL("./sections/ComponentSection.tsx", import.meta.url),
  "utf8",
);

test("input matrix labels live outside the horizontal scroller", () => {
  assert.doesNotMatch(section, /INPUT_MATRIX_STICKY_COL/);
  assert.match(
    section,
    /md:grid-cols-\[7\.5rem_minmax\(0,1fr\)\]/,
  );
});

test("input matrix renders fades at both horizontal edges", () => {
  assert.match(
    section,
    /left-0 z-10 w-10 bg-gradient-to-r from-zinc-50 to-transparent/,
  );
  assert.match(
    section,
    /right-0 z-10 w-10 bg-gradient-to-l from-zinc-50 to-transparent/,
  );
});

test("horizontal fades hide at their corresponding scroll boundaries", () => {
  assert.deepEqual(
    getHorizontalFadeVisibility({
      scrollLeft: 0,
      clientWidth: 400,
      scrollWidth: 800,
    }),
    { showLeft: false, showRight: true },
  );
  assert.deepEqual(
    getHorizontalFadeVisibility({
      scrollLeft: 400,
      clientWidth: 400,
      scrollWidth: 800,
    }),
    { showLeft: true, showRight: false },
  );
});

test("horizontal fades tolerate fractional scroll positions at the edges", () => {
  assert.deepEqual(
    getHorizontalFadeVisibility({
      scrollLeft: 0.5,
      clientWidth: 400,
      scrollWidth: 800,
    }),
    { showLeft: false, showRight: true },
  );
  assert.deepEqual(
    getHorizontalFadeVisibility({
      scrollLeft: 399.5,
      clientWidth: 400,
      scrollWidth: 800,
    }),
    { showLeft: true, showRight: false },
  );
});
