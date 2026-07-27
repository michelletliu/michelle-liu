import assert from "node:assert/strict";
import test from "node:test";
import {
  easeHues,
  FALLBACK_HUES,
  hueDelta,
  hueModes,
  orderForBlending,
  huesFromPixels,
  pickHues,
  rgbToOklch,
  spreadHues,
  type ShimmerHues,
} from "./shimmerPalette.ts";

const minGapOf = (hues: number[]) => {
  let min = 360;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      min = Math.min(min, Math.abs(hueDelta(hues[i], hues[j])));
    }
  }
  return min;
};

/** A histogram with a heavy warm hump around 75 and a lighter blue one at 245. */
function twoFamilyWeights() {
  const weights = new Array(36).fill(0);
  for (const [bin, w] of [[6, 80], [7, 100], [8, 70]] as const) weights[bin] = w;
  for (const [bin, w] of [[24, 40], [25, 30]] as const) weights[bin] = w;
  return weights;
}

/** An image of solid `[r,g,b]` blocks, in the proportions given by `weight`. */
function pixels(blocks: { rgb: [number, number, number]; weight: number }[]) {
  const out: number[] = [];
  for (const { rgb, weight } of blocks) {
    for (let i = 0; i < weight; i++) out.push(rgb[0], rgb[1], rgb[2], 255);
  }
  return new Uint8ClampedArray(out);
}

test("rgbToOklch puts known colours at the expected hue angles", () => {
  // Sanity check on the transform itself, since everything downstream is
  // angles and a wrong matrix would be invisible until the colours were wrong.
  const red = rgbToOklch(255, 0, 0);
  const green = rgbToOklch(0, 255, 0);
  const blue = rgbToOklch(0, 0, 255);
  assert.ok(Math.abs(hueDelta(29, red.h)) < 6, `red at ${red.h}`);
  assert.ok(Math.abs(hueDelta(142, green.h)) < 8, `green at ${green.h}`);
  assert.ok(Math.abs(hueDelta(264, blue.h)) < 8, `blue at ${blue.h}`);
  assert.ok(red.C > 0.15 && green.C > 0.15 && blue.C > 0.1);
});

test("grey has essentially no chroma, so it cannot vote on hue", () => {
  for (const v of [40, 128, 200]) {
    assert.ok(rgbToOklch(v, v, v).C < 0.001, `grey ${v} carried chroma`);
  }
});

test("spreadHues fans a collapsed set apart and leaves a spread one alone", () => {
  const collapsed = spreadHues([60, 62, 64, 66]);
  assert.ok(
    minGapOf(collapsed) >= 19.5,
    `collapsed set still crowded: ${collapsed}`,
  );
  // Still recognisably the source's colour: the mean should barely move.
  const mean = collapsed.reduce((s, h) => s + h, 0) / 4;
  assert.ok(Math.abs(mean - 63) < 12, `set drifted off its source: ${mean}`);

  const spread = [10, 100, 190, 280];
  assert.deepEqual(spreadHues(spread), spread);
});

test("spreadHues settles even when every hue is identical", () => {
  const fanned = spreadHues([200, 200, 200, 200]);
  assert.equal(fanned.length, 4);
  assert.ok(minGapOf(fanned) >= 19.5, `identical hues not fanned: ${fanned}`);
  assert.ok(fanned.every(Number.isFinite));
});

test("spreadHues handles a set straddling the 0/360 wrap", () => {
  const fanned = spreadHues([350, 355, 2, 8]);
  assert.ok(minGapOf(fanned) >= 19.5, `wrap case crowded: ${fanned}`);
});

test("pickHues selects for separation, not just for frequency", () => {
  // Four adjacent heavy bins and one lighter bin far away. Picking by weight
  // alone would take the four browns; the far one has to make the cut.
  const weights = new Array(36).fill(0);
  weights[6] = 100;
  weights[7] = 95;
  weights[8] = 90;
  weights[9] = 85;
  weights[22] = 30;
  const hues = pickHues(weights);
  assert.ok(hues);
  const far = (22 + 0.5) * 10;
  assert.ok(
    hues.some((h) => Math.abs(hueDelta(h, far)) < 25),
    `distant hue was ignored: ${hues}`,
  );
});

test("pickHues leads with the dominant hue", () => {
  const weights = new Array(36).fill(0);
  weights[20] = 500;
  weights[4] = 60;
  weights[12] = 55;
  weights[30] = 50;
  const hues = pickHues(weights);
  assert.ok(hues);
  assert.ok(
    Math.abs(hueDelta(hues[0], 205)) < 20,
    `expected to open on the dominant hue, got ${hues[0]}`,
  );
});

test("a two-colour source gives each family half the slots", () => {
  // Cream paper and a blue, the shape of a woodblock print.
  const hues = pickHues(twoFamilyWeights());
  assert.ok(hues);
  const warm = (h: number) => Math.abs(hueDelta(h, 75)) < 45;
  const blue = (h: number) => Math.abs(hueDelta(h, 245)) < 45;
  assert.equal(hues.filter(warm).length, 2, `warm slots: ${hues}`);
  assert.equal(hues.filter(blue).length, 2, `blue slots: ${hues}`);
  assert.ok(warm(hues[0]), `base should be the dominant family: ${hues[0]}`);
});

test("distant families are walked once, not crossed at every step", () => {
  // The shader blends each layer into the hue accumulated so far along the
  // shorter arc, so an order that alternates families drags the blend across
  // the empty half of the wheel three times and invents a colour the painting
  // does not contain. Exactly one long transition is the most that is
  // unavoidable when a painting genuinely has two opposed families.
  const hues = pickHues(twoFamilyWeights());
  assert.ok(hues);
  const longSteps = [0, 1, 2].filter(
    (i) => Math.abs(hueDelta(hues[i], hues[i + 1])) > 90,
  );
  assert.equal(
    longSteps.length,
    1,
    `expected one long transition, got ${longSteps.length} in ${hues.map((h) => h.toFixed(0))}`,
  );
});

test("orderForBlending opens on the family holding the dominant hue", () => {
  // A warm pair and a blue pair. Either orientation leaves one long
  // transition, so the choice is which family the base layer belongs to.
  assert.deepEqual(orderForBlending([40, 70, 230, 250], 60), [70, 40, 250, 230]);
  assert.deepEqual(orderForBlending([40, 70, 230, 250], 240), [230, 250, 40, 70]);
});

test("orderForBlending walks an evenly spread set without doubling back", () => {
  // No unused region to anchor on, so any rotation is as good as another —
  // what must hold is that it still walks the circle one step at a time
  // instead of hopping across it.
  const walk = orderForBlending([10, 100, 190, 280], 10);
  assert.equal(walk[0], 10, `should open on the dominant hue: ${walk}`);
  for (let i = 0; i < 3; i++) {
    assert.ok(
      Math.abs(hueDelta(walk[i], walk[i + 1])) <= 100,
      `hopped across the wheel at step ${i}: ${walk}`,
    );
  }
});

test("hueModes stops at the number of families actually present", () => {
  const oneHump = new Array(36).fill(0);
  oneHump[10] = 50;
  oneHump[11] = 90;
  oneHump[12] = 45;
  assert.deepEqual(hueModes(oneHump), [115]);
});

test("pickHues returns null for an empty histogram", () => {
  assert.equal(pickHues(new Array(36).fill(0)), null);
});

test("an earth-toned source yields separated hues, not four browns", () => {
  // The failure this whole module exists to prevent: browns and ochres only.
  const hues = huesFromPixels(
    pixels([
      { rgb: [120, 92, 58], weight: 400 },
      { rgb: [146, 110, 68], weight: 300 },
      { rgb: [98, 76, 50], weight: 260 },
      { rgb: [165, 132, 88], weight: 200 },
    ]),
  );
  assert.ok(hues, "earth-toned source produced no hues at all");
  assert.ok(
    minGapOf(hues) >= 19.5,
    `earth tones collapsed to one hue: ${hues.map((h) => h.toFixed(0))}`,
  );
});

test("a near-monochrome source still reports its own colour", () => {
  // A silverpoint drawing: warm grey paper, barely any chroma anywhere.
  const hues = huesFromPixels(
    pixels([
      { rgb: [198, 188, 172], weight: 700 },
      { rgb: [176, 166, 150], weight: 300 },
      { rgb: [150, 141, 126], weight: 200 },
    ]),
  );
  assert.ok(hues, "monochrome source fell through every chroma floor");
  // The paper is warm, so the set should sit in the warm quadrant rather than
  // wander off to a hue the drawing does not contain.
  assert.ok(
    hues.some((h) => Math.abs(hueDelta(h, 80)) < 60),
    `lost the source's warmth: ${hues.map((h) => h.toFixed(0))}`,
  );
  assert.ok(minGapOf(hues) >= 19.5, `monochrome set crowded: ${hues}`);
});

test("a true greyscale source reports nothing rather than inventing a hue", () => {
  const hues = huesFromPixels(
    pixels([
      { rgb: [30, 30, 30], weight: 200 },
      { rgb: [128, 128, 128], weight: 400 },
      { rgb: [210, 210, 210], weight: 300 },
    ]),
  );
  assert.equal(hues, null);
});

test("pure black and pure white are ignored, so they cannot pin the result", () => {
  const hues = huesFromPixels(
    pixels([
      { rgb: [0, 0, 0], weight: 900 },
      { rgb: [255, 255, 255], weight: 900 },
      { rgb: [40, 90, 200], weight: 120 },
    ]),
  );
  assert.ok(hues, "the one coloured region was drowned out");
  assert.ok(
    hues.some((h) => Math.abs(hueDelta(h, 264)) < 45),
    `expected the blue to survive: ${hues.map((h) => h.toFixed(0))}`,
  );
});

test("a small vivid passage outweighs a large dull one", () => {
  // Weighting by summed chroma rather than pixel count is what makes this
  // work: the scarlet is a tenth of the canvas and is what the piece reads as.
  const hues = huesFromPixels(
    pixels([
      { rgb: [154, 148, 138], weight: 900 },
      { rgb: [222, 40, 20], weight: 100 },
    ]),
  );
  assert.ok(hues);
  assert.ok(
    hues.some((h) => Math.abs(hueDelta(h, 29)) < 30),
    `the vivid passage lost to the dull one: ${hues.map((h) => h.toFixed(0))}`,
  );
});

test("every hue set is finite and inside 0..360", () => {
  const cases = [
    pixels([{ rgb: [12, 90, 140], weight: 500 }]),
    pixels([{ rgb: [250, 250, 240], weight: 500 }]),
    pixels([
      { rgb: [200, 30, 90], weight: 50 },
      { rgb: [20, 180, 160], weight: 50 },
    ]),
  ];
  for (const data of cases) {
    const hues = huesFromPixels(data);
    if (!hues) continue;
    for (const h of hues) {
      assert.ok(Number.isFinite(h), `non-finite hue in ${hues}`);
      assert.ok(h >= 0 && h < 360, `hue out of range: ${h}`);
    }
  }
});

/** Run the ease at 60fps for `ms` and report where the hues ended up. */
function settle(from: number[], to: ShimmerHues, ms: number) {
  const slots = { x: from[0], y: from[1], z: from[2], w: from[3] };
  for (let t = 0; t < ms; t += 1000 / 60) easeHues(slots, to, 1 / 60);
  return [slots.x, slots.y, slots.z, slots.w];
}

test("a palette swap lands on the target within about 400ms", () => {
  const target: ShimmerHues = [115, 155, 195, 245];
  const landed = settle([...FALLBACK_HUES], target, 400);
  for (let i = 0; i < 4; i++) {
    assert.ok(
      Math.abs(hueDelta(landed[i], target[i])) < 1.5,
      `slot ${i} stalled at ${landed[i].toFixed(1)}, wanted ${target[i]}`,
    );
  }
});

test("an easing hue takes the short way round, not across the wheel", () => {
  // 350 to 10 is 20 degrees forward, not 340 backward. A hue that sweeps the
  // long way visits every colour on the wheel on the way, which mid-generation
  // reads as a glitch rather than a crossfade.
  const slots = { x: 350, y: 350, z: 350, w: 350 };
  const strayed: number[] = [];
  for (let i = 0; i < 30; i++) {
    easeHues(slots, [10, 10, 10, 10], 1 / 60);
    const h = ((slots.x % 360) + 360) % 360;
    if (h > 30 && h < 340) strayed.push(h);
  }
  assert.deepEqual(strayed, []);
});

test("easing onto the palette already showing changes nothing", () => {
  const held = settle([...FALLBACK_HUES], [...FALLBACK_HUES], 500);
  assert.deepEqual(held.map(Math.round), [...FALLBACK_HUES]);
});

test("the fallback set is itself well separated", () => {
  assert.equal(FALLBACK_HUES.length, 4);
  assert.ok(minGapOf([...FALLBACK_HUES]) >= 19.5);
});
