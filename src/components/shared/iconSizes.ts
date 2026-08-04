/**
 * Shared stroke-icon size ramp (px).
 * Prefer `iconSize("md")` over ad-hoc rem/`size-*` classes so
 * `strokeWidth={1.5}` + `vectorEffect="non-scaling-stroke"` stay consistent.
 *
 * Sticky morph (chevron↔Close) uses `lg` (24) for both states. Close’s
 * 12×12 path band matches Chevron’s vertical span so glyphs read the same size.
 */
export const iconSizes = {
  /** Dense / meta marks */
  xs: 12,
  /** Inline with text */
  sm: 16,
  /** Default control / field / toolbar icons */
  md: 20,
  /** Primary touch affordance / sheet dismiss */
  lg: 24,
  /** Hero / specimen */
  xl: 32,
} as const;

export type IconSizeName = keyof typeof iconSizes;
export type IconSizePx = (typeof iconSizes)[IconSizeName];

/** CSS length for the `size` prop on Chevron / Close / Arrow / ArrowUpRight. */
export function iconSize(name: IconSizeName): `${IconSizePx}px` {
  return `${iconSizes[name]}px`;
}
