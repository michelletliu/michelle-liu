import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ArtLightbox.tsx", import.meta.url), "utf8");

test("uses the elevated shadow without adding a lightbox photo frame", () => {
  assert.match(
    source,
    /max-h-\[min\(75vh,820px\)\][^"]*shadow-elevated/,
  );
  assert.doesNotMatch(
    source,
    /max-h-\[min\(75vh,820px\)\][^"]*\b(border|p-[0-9])/,
  );
});
