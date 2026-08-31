import assert from "node:assert/strict";
import test from "node:test";
import { extractSanityDimensions } from "./sanityImageDimensions.ts";

test("uses filename dimensions for uncropped Sanity URLs", () => {
  assert.deepEqual(
    extractSanityDimensions(
      "https://cdn.sanity.io/images/am3v0x1c/production/abc-1896x1517.jpg?w=1200&auto=format",
    ),
    { width: 1896, height: 1517 },
  );
});

test("prefers rect crop over original filename dimensions", () => {
  assert.deepEqual(
    extractSanityDimensions(
      "https://cdn.sanity.io/images/am3v0x1c/production/fcd01919cd3abb85e8d3e55044ca9c1dfc7628ce-1896x1517.jpg?rect=129,223,1644,1012&w=1200&q=85&auto=format",
    ),
    { width: 1644, height: 1012 },
  );
});

test("returns empty dimensions for non-Sanity sources", () => {
  assert.deepEqual(extractSanityDimensions("/holiday-card.png"), {});
});
