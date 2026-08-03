import assert from "node:assert/strict";
import test from "node:test";
import {
  CANVAS_DUST_PARTICLES,
  canvasDustAnimationName,
  canvasDustKeyframesCss,
} from "./canvasDust.ts";

test("canvas dust keeps eight pale particles for the materials specimen", () => {
  assert.equal(CANVAS_DUST_PARTICLES.length, 8);
  for (const p of CANVAS_DUST_PARTICLES) {
    assert.ok(p.size >= 2 && p.size <= 4);
    assert.ok(p.opacity > 0 && p.opacity <= 1);
    assert.match(p.color, /^#[0-9a-f]{6}$/i);
  }
});

test("each dust particle has a distinct slow drift loop", () => {
  const durations = new Set(CANVAS_DUST_PARTICLES.map((p) => p.durationMs));
  const delays = new Set(CANVAS_DUST_PARTICLES.map((p) => p.delayMs));
  assert.ok(durations.size >= 4);
  assert.ok(delays.size >= 4);
  for (const p of CANVAS_DUST_PARTICLES) {
    assert.ok(p.durationMs >= 4000 && p.durationMs <= 7000);
    assert.ok(Math.abs(p.driftX) > 0 || Math.abs(p.driftY) > 0);
    assert.ok(Math.abs(p.driftY) >= 4);
  }
});

test("dust keyframes only animate transform and opacity", () => {
  const css = canvasDustKeyframesCss();
  assert.match(css, /@keyframes dust-drift/);
  assert.match(css, /transform:/);
  assert.match(css, /opacity:/);
  assert.doesNotMatch(css, /width:|height:|top:|left:|margin:|padding:/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none/);
});

test("particle animation names are stable for CSS wiring", () => {
  assert.equal(canvasDustAnimationName(0), "dust-drift-0");
  assert.equal(canvasDustAnimationName(7), "dust-drift-7");
});
