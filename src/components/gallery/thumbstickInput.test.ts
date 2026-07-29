import assert from "node:assert/strict";
import test from "node:test";
import {
  DEAD_ZONE,
  NAV_INITIAL_DELAY_MS,
  NAV_REPEAT_IDLE,
  NAV_REPEAT_MS,
  NAV_TRIGGER,
  advanceNavRepeat,
  applyDeadZone,
  clampKnob,
  zoomDeltaFor,
} from "./thumbstickInput.ts";

test("the dead zone swallows jitter and keeps full travel reachable", () => {
  assert.equal(applyDeadZone(0), 0);
  assert.equal(applyDeadZone(DEAD_ZONE), 0);
  assert.equal(applyDeadZone(-DEAD_ZONE), 0);
  assert.equal(applyDeadZone(1), 1);
  assert.equal(applyDeadZone(-1), -1);
});

test("deflection ramps from zero at the dead zone edge, not from a step", () => {
  const justOutside = applyDeadZone(DEAD_ZONE + 0.001);
  assert.ok(justOutside > 0 && justOutside < 0.01, String(justOutside));
  // Halfway through the live range gives half output.
  assert.ok(Math.abs(applyDeadZone(DEAD_ZONE + (1 - DEAD_ZONE) / 2) - 0.5) < 1e-9);
});

test("the knob is clamped into the base circle, keeping its direction", () => {
  assert.deepEqual(clampKnob(0, 0, 24), { x: 0, y: 0 });
  assert.deepEqual(clampKnob(10, 0, 24), { x: 10, y: 0 });

  // Far outside the element, as happens on every real drag.
  const far = clampKnob(600, 0, 24);
  assert.equal(Math.round(far.x), 24);
  assert.equal(far.y, 0);

  // Diagonal stays on the circle, not on a bounding square's corner.
  const diagonal = clampKnob(500, 500, 24);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 24) < 1e-9);
  assert.ok(Math.abs(diagonal.x - diagonal.y) < 1e-9);
});

test("no navigation below the trigger, however long it is held", () => {
  let state = NAV_REPEAT_IDLE;
  for (let elapsed = 0; elapsed < 5000; elapsed += 16) {
    const next = advanceNavRepeat(state, NAV_TRIGGER, 16);
    assert.equal(next.step, 0);
    state = next.state;
  }
});

test("crossing the trigger steps immediately, then repeats on cadence", () => {
  let state = NAV_REPEAT_IDLE;
  const firedAt: number[] = [];
  for (let elapsed = 0; elapsed <= 4000; elapsed += 16) {
    const next = advanceNavRepeat(state, 1, 16);
    if (next.step !== 0) {
      assert.equal(next.step, 1);
      firedAt.push(elapsed);
    }
    state = next.state;
  }

  assert.equal(firedAt[0], 0, "the first step should not wait for the delay");
  const gaps = firedAt.slice(1).map((t, i) => t - firedAt[i]!);
  // Within one frame of the configured delay, then the repeat interval.
  assert.ok(Math.abs(gaps[0]! - NAV_INITIAL_DELAY_MS) <= 16, String(gaps));
  for (const gap of gaps.slice(1)) {
    assert.ok(Math.abs(gap - NAV_REPEAT_MS) <= 16, String(gaps));
  }
});

test("the cadence never outruns the 780ms camera ease", () => {
  assert.ok(NAV_INITIAL_DELAY_MS < NAV_REPEAT_MS);
  assert.ok(NAV_REPEAT_MS >= 780);
});

test("a long frame cannot bank credit and fire twice in a row", () => {
  let state = advanceNavRepeat(NAV_REPEAT_IDLE, 1, 16).state;
  // One stalled frame far longer than the whole delay.
  const stalled = advanceNavRepeat(state, 1, 5000);
  assert.equal(stalled.step, 1);
  // The next frame must wait out a full interval rather than fire again.
  const after = advanceNavRepeat(stalled.state, 1, 16);
  assert.equal(after.step, 0);
});

test("reversing direction steps at once rather than waiting", () => {
  const held = advanceNavRepeat(NAV_REPEAT_IDLE, 1, 16);
  assert.equal(held.step, 1);
  const reversed = advanceNavRepeat(held.state, -1, 16);
  assert.equal(reversed.step, -1);
});

test("falling back to centre rearms the immediate step", () => {
  let state = advanceNavRepeat(NAV_REPEAT_IDLE, 1, 16).state;
  state = advanceNavRepeat(state, 0, 16).state;
  assert.deepEqual(state, NAV_REPEAT_IDLE);
  // A second flick moves again straight away, so repeated flicks are not
  // silently throttled to the hold cadence.
  assert.equal(advanceNavRepeat(state, 1, 16).step, 1);
});

test("zoom is proportional to deflection, and up zooms in", () => {
  assert.equal(Math.abs(zoomDeltaFor(0, 16)), 0);
  assert.ok(zoomDeltaFor(-1, 16) > 0, "pushing up should zoom in");
  assert.ok(zoomDeltaFor(1, 16) < 0, "pulling down should zoom out");
  assert.ok(
    Math.abs(zoomDeltaFor(-0.5, 16) - zoomDeltaFor(-1, 16) / 2) < 1e-9,
    "half deflection should zoom at half rate",
  );
  // Rate is per second, so the same deflection over twice the time does twice
  // the work regardless of frame rate.
  assert.ok(Math.abs(zoomDeltaFor(-1, 32) - zoomDeltaFor(-1, 16) * 2) < 1e-9);
});

test("full deflection crosses the whole zoom range in a usable time", () => {
  let zoom = 0.65;
  let elapsed = 0;
  while (zoom < 2.8 && elapsed < 10_000) {
    zoom += zoomDeltaFor(-1, 16);
    elapsed += 16;
  }
  assert.ok(elapsed > 1500, `too twitchy: ${elapsed}ms end to end`);
  assert.ok(elapsed < 4000, `too sluggish: ${elapsed}ms end to end`);
});
