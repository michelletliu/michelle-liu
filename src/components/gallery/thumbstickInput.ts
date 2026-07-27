/**
 * Pure input maths for the gallery thumbstick.
 *
 * Split out from the component because the interesting parts — the dead zone,
 * the knob clamp and above all the repeat cadence — are timing-dependent rules
 * that are miserable to prove by dragging a mouse and trivial to prove by
 * feeding a clock. The component keeps only the pointer plumbing.
 */

/** Deflection below this fraction of full travel is treated as centred. */
export const DEAD_ZONE = 0.2;
/** Horizontal deflection that counts as a deliberate push to the next hang. */
export const NAV_TRIGGER = 0.55;
/**
 * Nav cadence, in milliseconds.
 *
 * The camera's ease between hangs runs 780ms. Repeating faster than that would
 * start each transition from a half-finished one, so the room would lurch
 * rather than walk, and the viewer would lose track of where they are.
 */
export const NAV_INITIAL_DELAY_MS = 620;
export const NAV_REPEAT_MS = 900;
/** Zoom units per second at full deflection: the whole range in about 2.5s. */
export const ZOOM_RATE_PER_S = 0.85;
/**
 * One press of + or −.
 *
 * Sized against the drag path rather than picked: `ZOOM_RATE_PER_S` crosses the
 * usable range in about 2.5 seconds, so this is roughly a sixth of a second of
 * holding the stick. Small enough that a press reads as a nudge and repeated
 * presses stay controllable, large enough to see.
 */
export const ZOOM_STEP = 0.14;

/**
 * Deflection with the dead zone removed, rescaled so full travel still gives 1.
 *
 * Rescaling matters: without it the axis would jump from 0 straight to the dead
 * zone's width the instant it was crossed, so zoom would start at a fifth speed
 * rather than from nothing.
 */
export function applyDeadZone(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude <= DEAD_ZONE) return 0;
  return Math.sign(value) * ((magnitude - DEAD_ZONE) / (1 - DEAD_ZONE));
}

/**
 * Pointer offset from the base's centre, clamped into the base circle.
 *
 * Clamped radially rather than per-axis so the knob tracks the pointer's
 * direction exactly at the rim instead of sliding along a square's edge.
 */
export function clampKnob(dx: number, dy: number, maxTravel: number) {
  const distance = Math.hypot(dx, dy);
  if (distance <= maxTravel || distance === 0) return { x: dx, y: dy };
  const scale = maxTravel / distance;
  return { x: dx * scale, y: dy * scale };
}

export type NavRepeatState = {
  /** Direction currently held past the trigger, or 0 for none. */
  heldDirection: -1 | 0 | 1;
  /** Milliseconds until the next repeat fires. */
  dueInMs: number;
};

export const NAV_REPEAT_IDLE: NavRepeatState = {
  heldDirection: 0,
  dueInMs: 0,
};

/**
 * Advance the repeat clock by one frame.
 *
 * Returns the direction to step this frame, or 0. Crossing the trigger fires
 * immediately so a quick flick moves exactly one painting, and falling back
 * inside the trigger rearms that immediate step — holding the stick over is a
 * slow walk, flicking it is a single deliberate move, and the two do not need
 * separate gestures.
 */
export function advanceNavRepeat(
  state: NavRepeatState,
  x: number,
  deltaMs: number,
): { state: NavRepeatState; step: -1 | 0 | 1 } {
  if (Math.abs(x) <= NAV_TRIGGER) {
    return { state: NAV_REPEAT_IDLE, step: 0 };
  }

  const direction = x > 0 ? 1 : -1;
  if (state.heldDirection !== direction) {
    return {
      state: { heldDirection: direction, dueInMs: NAV_INITIAL_DELAY_MS },
      step: direction,
    };
  }

  const dueInMs = state.dueInMs - deltaMs;
  if (dueInMs > 0) {
    return { state: { heldDirection: direction, dueInMs }, step: 0 };
  }
  // Reset to the full interval rather than adding to the overshoot, so one
  // long frame cannot bank credit and fire two steps back to back.
  return {
    state: { heldDirection: direction, dueInMs: NAV_REPEAT_MS },
    step: direction,
  };
}

/** Zoom delta for one frame at the given vertical deflection. Up zooms in. */
export function zoomDeltaFor(y: number, deltaMs: number): number {
  return (-y * ZOOM_RATE_PER_S * deltaMs) / 1000;
}
