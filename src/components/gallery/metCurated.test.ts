import assert from "node:assert/strict";
import test from "node:test";
// Relative and extension-qualified so `node --test` can resolve it without a
// bundler, matching the other unit tests here and carrying the same TS5097.
import {
  CURATED_MET_IMAGE_SIZES,
  CURATED_MET_OBJECT_IDS,
  curatedFirstOpenObjectIds,
  curatedImageSize,
} from "./metCurated.ts";

/**
 * The three works the strip is required to open with, in order. Spelled out
 * here rather than read from the list so that reordering the list fails this
 * test instead of quietly redefining what it is asserting.
 */
const LEAD_WORKS = [
  39799, // Hokusai, The Great Wave
  436535, // Van Gogh, Wheat Field with Cypresses
  337499, // J. M. W. Turner, The Lake of Zug
];

/** Works woven through the Van Gogh cluster — must stay in the opening hand. */
const INTERSPERSED = {
  seuratCircus: 437654,
  degasDancers: 436140,
  sargentMadameX: 12127,
  seuratJatte: 437658,
  degasDanceLesson: 436132,
};

const VAN_GOGH_CLUSTER = [
  436535, // Wheat Field
  436528, // Irises
  436532, // Straw Hat
  437980, // Cypresses
  436529, // L'Arlésienne
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

test("Monet Family wraps to Hokusai’s left when the carousel opens on index 0", () => {
  assert.equal(CURATED_MET_OBJECT_IDS[0], 39799); // Hokusai
  assert.equal(
    CURATED_MET_OBJECT_IDS[CURATED_MET_OBJECT_IDS.length - 1],
    436965, // Manet, The Monet Family in Their Garden at Argenteuil
  );
  assert.deepEqual(curatedFirstOpenObjectIds(), [
    37031, // Hiroshige, far left (−2)
    436965, // Monet Family, near left (−1)
    39799, // Hokusai, centre
    436535, // Wheat Field, near right (+1)
    337499, // Lake of Zug, far right (+2)
  ]);
});

test("every curated id has a primaryImageSmall size for carousel aspect reserve", () => {
  for (const id of CURATED_MET_OBJECT_IDS) {
    const size = curatedImageSize(id);
    assert.ok(size, `missing CURATED_MET_IMAGE_SIZES entry for ${id}`);
    assert.ok(size!.width > 0 && size!.height > 0, `${id} size must be positive`);
  }
  assert.equal(
    Object.keys(CURATED_MET_IMAGE_SIZES).length,
    CURATED_MET_OBJECT_IDS.length,
  );
});

test("Monet Family is wider than the −1 slot fallback so reserve matters", () => {
  // Slot −1 fallback aspect is maxWidth/height = 128/100 = 1.28. Monet Family
  // is ~1.59; without a reserved size the tile shrinks from 100px to ~81px tall.
  const monet = curatedImageSize(436965)!;
  assert.ok(monet.width / monet.height > 1.4);
});

test("Seurat / Degas / Sargent sit between the Van Goghs", () => {
  const ids = CURATED_MET_OBJECT_IDS;
  const wheat = ids.indexOf(VAN_GOGH_CLUSTER[0]!);
  const arlesienne = ids.indexOf(VAN_GOGH_CLUSTER[VAN_GOGH_CLUSTER.length - 1]!);
  assert.ok(wheat >= 0 && arlesienne > wheat);
  const between = ids.slice(wheat, arlesienne + 1);

  for (const [name, id] of Object.entries(INTERSPERSED)) {
    assert.ok(
      between.includes(id),
      `${name} (${id}) should sit inside the Van Gogh cluster`,
    );
  }

  // Irises is the first work after the lead trio so one right-scroll shows it.
  assert.equal(ids[3], VAN_GOGH_CLUSTER[1]);
});
