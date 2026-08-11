import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getHorizontalFadeVisibility } from "./inputMatrixScroll.ts";

const section = readFileSync(
  new URL(
    "./sections/component-section/InputSpecimens.tsx",
    import.meta.url,
  ),
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

test("only the muted input composition uses the muted shell tone", () => {
  assert.match(
    section,
    /const shellTone =\s*composition === "muted" \? "muted" : "surface";/,
  );
  assert.match(section, /tone=\{shellTone\}/);
  // First clsx arg may include extra utilities (e.g. rounded-full); shellComposition
  // must still be applied on the input sample alongside the input-sample class.
  assert.match(
    section,
    /className=\{clsx\("input-sample[^"]*", shellComposition\)\}/,
  );
  assert.doesNotMatch(
    section,
    /composition === "leading" \|\| composition === "muted"/,
  );
});

test("leading icon specimens use a 4px shell left inset", () => {
  const css = readFileSync(
    new URL("../../styles/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(section, /shellComposition/);
  assert.match(section, /composition === "leading"/);
  assert.match(
    css,
    /\.field-shell\.leading\s*\{[^}]*padding-left:\s*0\.25rem/s,
  );
});

test("filled input matrix specimens stay editable", () => {
  assert.match(section, /readOnly=\{isFocus \|\| isError\}/);
  assert.doesNotMatch(section, /readOnly=\{showValue \|\| isFocus\}/);
});

test("input matrix specimens do not force medium weight", () => {
  assert.doesNotMatch(
    section,
    /composition === "leading"\s*\?\s*"[^"]*\bfont-medium\b/,
  );
});

test("input matrix icons use the shared icon size scale", () => {
  assert.match(section, /<ArrowRightIcon size=\{iconSize\("sm"\)\}/);
  assert.match(section, /<SearchMagnifierIcon size=\{iconSize\("xs"\)\}/);
  assert.doesNotMatch(section, /<ArrowRightIcon size="\d+px"/);
  assert.doesNotMatch(section, /<SearchMagnifierIcon size="\d+px"/);
});
