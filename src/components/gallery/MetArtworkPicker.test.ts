import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./MetArtworkPicker.tsx", import.meta.url),
  "utf8",
);

test("artwork strip uses compact vertical padding and horizontal-only bleed", () => {
  assert.match(source, /const STRIP_PADDING = "px-4 py-2";/);
  assert.match(source, /const STRIP_SHADOW_CLIP = "h-\[132px\] -mb-4";/);
  assert.match(source, /const STRIP_BLEED = "-mx-4";/);
  assert.doesNotMatch(source, /const STRIP_BLEED = "[^"]*-my-/);
});

test("panel carousel reserves curated image size before onLoad", () => {
  assert.match(source, /curatedImageSize\(artwork\.objectID\)/);
  assert.match(source, /predictCurated=\{mode === "curated"\}/);
});

test("panel carousel eagerly loads visible inspiration tiles", () => {
  assert.match(
    source,
    /loading="eager"[\s\S]*?fetchPriority=\{Math\.abs\(distance\) <= 1 \? "high" : "auto"\}/,
  );
});

test("panel popup carousel steps with arrow keys when search is unfocused", () => {
  assert.match(source, /window\.addEventListener\("keydown", onKeyDown, true\)/);
  assert.match(source, /e\.key !== "ArrowLeft" && e\.key !== "ArrowRight"/);
  assert.match(
    source,
    /closest\?\.\("input, textarea, \[contenteditable=true\]"\)/,
  );
});

test("panel carousel uses native wheel and pointer pan for horizontal scroll", () => {
  assert.match(source, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/);
  assert.match(source, /PANEL_SWIPE_STEP/);
  assert.match(source, /onPointerDown=\{onPointerDown\}/);
  assert.match(source, /data-panel-chevron/);
});
