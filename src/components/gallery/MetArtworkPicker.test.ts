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
