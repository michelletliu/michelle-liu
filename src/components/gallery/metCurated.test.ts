import assert from "node:assert/strict";
import test from "node:test";
// Relative and extension-qualified so `node --test` can resolve it without a
// bundler, matching the other unit tests here and carrying the same TS5097.
import { CURATED_MET_OBJECT_IDS } from "./metCurated.ts";

/**
 * The three works the strip is required to open with, in order. Spelled out
 * here rather than read from the list so that reordering the list fails this
 * test instead of quietly redefining what it is asserting.
 */
const LEAD_WORKS = [
  39799, // Hokusai, The Great Wave
  436528, // Van Gogh, Irises
  337496, // Leonardo da Vinci, The Head of the Virgin
];

test("opens on the three works the strip is built around, in order", () => {
  assert.deepEqual(CURATED_MET_OBJECT_IDS.slice(0, 3), LEAD_WORKS);
});

test("every id is a plausible Met object id", () => {
  for (const id of CURATED_MET_OBJECT_IDS) {
    assert.equal(Number.isInteger(id), true, `${id} is not an integer`);
    assert.equal(id > 0, true, `${id} is not positive`);
  }
});

test("holds no duplicates", () => {
  assert.equal(
    new Set(CURATED_MET_OBJECT_IDS).size,
    CURATED_MET_OBJECT_IDS.length,
  );
});

test("has enough works to fill the strip past its visible edge", () => {
  // The strip shows about five tiles at the design width; the fade at its
  // right edge is only honest if there is genuinely more to scroll to.
  assert.equal(CURATED_MET_OBJECT_IDS.length >= 8, true);
});
