import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { iconSize, iconSizes, ICON_STROKE_WIDTH, ICON_STROKE_WIDTH_DESKTOP, ICON_STROKE_WIDTH_MOBILE, ICON_STROKE_WIDTH_PX } from "./iconSizes.ts";

const globalsCss = readFileSync(
  new URL("../../styles/globals.css", import.meta.url),
  "utf8",
);

test("house stroke is 1.5px at every breakpoint", () => {
  assert.equal(ICON_STROKE_WIDTH_PX, 1.5);
  assert.equal(ICON_STROKE_WIDTH_MOBILE, 1.5);
  assert.equal(ICON_STROKE_WIDTH_DESKTOP, 1.5);
  assert.equal(ICON_STROKE_WIDTH, "var(--icon-stroke-width)");
  assert.match(globalsCss, /--icon-stroke-width:\s*1\.5px;/);
  assert.doesNotMatch(globalsCss, /--icon-stroke-width:\s*2\.5px/);
  assert.doesNotMatch(
    globalsCss,
    /@media \(min-width: 768px\) \{[\s\S]*?--icon-stroke-width:/,
  );
  assert.match(
    globalsCss,
    /\[stroke-width="var\(--icon-stroke-width\)"\] \{\s*stroke-width:\s*var\(--icon-stroke-width\);/,
  );
});

test("icon size tokens use xs/sm/md/lg/xl names", () => {
  assert.deepEqual(Object.keys(iconSizes), ["xs", "sm", "md", "lg", "xl"]);
  assert.equal(iconSizes.xs, 12);
  assert.equal(iconSizes.sm, 16);
  assert.equal(iconSizes.md, 20);
  assert.equal(iconSizes.lg, 24);
  assert.equal(iconSizes.xl, 32);
  assert.equal(iconSize("md"), "20px");
});
