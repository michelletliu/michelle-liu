/** Max |distance| (in virtual index units) that still uses the quadratic falloff. */
export const DISTANCE_LIMIT = 6;

/**
 * Quadratic proximity falloff. Matches:
 * `normalizedDistance = initialValue - |distance| / DISTANCE_LIMIT`, `scaleFactor = normalizedDistance²`.
 * Pass **initialValue = 1** so normalizedDistance stays in a sensible range near the focal index.
 * Beyond the limit, returns **baseValue** (same as the curve at the limit) so the floor is consistent.
 */
export function transformScale(
  distance: number,
  initialValue: number,
  baseValue: number,
  intensity: number,
) {
  if (Math.abs(distance) > DISTANCE_LIMIT) {
    return baseValue;
  }
  const normalizedDistance = initialValue - Math.abs(distance) / DISTANCE_LIMIT;
  const scaleFactor = normalizedDistance * normalizedDistance;
  return baseValue + intensity * scaleFactor;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const DEFAULT_TRANSITION_MS = 300;
/** Minimum blend per frame so marks still settle when scroll velocity is ~0. */
const IDLE_LERP_FLOOR = 0.14;

/**
 * `lerp(current, target, velocityFactor)` with velocityFactor from scroll speed.
 * Adds a small floor so ticks converge after the gallery stops moving.
 */
export function lerpLinemarkTowardTarget(
  current: number,
  targetScale: number,
  scrollVelocity: number,
  transitionDurationMs: number = DEFAULT_TRANSITION_MS,
) {
  const currentVelocity = Math.abs(scrollVelocity);
  const velocityFactor = Math.min(1, currentVelocity / transitionDurationMs);
  const t = Math.max(velocityFactor, IDLE_LERP_FLOOR);
  return lerp(current, targetScale, t);
}

/** Matches sketchbook `PageIndicatorBar` proximity: marks within this index distance pick up hover height. */
export const MARK_HOVER_PROXIMITY_LIMIT = 4;

/**
 * Extra line height (px) toward a hovered mark — quadratic falloff like sketchbook `transformProximity`.
 */
export function transformMarkHoverBonus(distance: number, intensity: number): number {
  if (Math.abs(distance) > MARK_HOVER_PROXIMITY_LIMIT) {
    return 0;
  }
  const normalizedDistance = 1 - Math.abs(distance) / MARK_HOVER_PROXIMITY_LIMIT;
  const scaleFactor = normalizedDistance * normalizedDistance;
  return intensity * scaleFactor;
}
