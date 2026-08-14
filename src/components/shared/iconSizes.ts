/**
 * Shared stroke-icon size ramp (px).
 * Prefer `iconSize("md")` over ad-hoc rem/`size-*` classes so
 * `strokeWidth={ICON_STROKE_WIDTH}` + `vectorEffect="non-scaling-stroke"`
 * stay consistent.
 *
 * Sticky morph (chevron↔Close) uses `lg` (24) for both states. Close’s
 * 12×12 path band matches Chevron’s vertical span so glyphs read the same size.
 */

/**
 * House stroke for UI stroke icons (Chevron, Close, Arrow, ArrowUpRight,
 * Expand, Link, Code, Plus, …). Paired with `vectorEffect="non-scaling-stroke"`
 * so weight is CSS px, not viewBox units.
 *
 * Mobile stays 1.5px so 12–16px Visit Site marks don't blob. Desktop (768px+)
 * is 2.5px: 2px still reads as a hairline on the ~14px ↗ in Visit Site.
 *
 * Pass `ICON_STROKE_WIDTH` to SVG `strokeWidth`. globals.css also sets
 * `stroke-width` as a CSS property so the var paints even when SVG
 * presentation attributes fail to resolve `var()`. Numeric px are MOBILE /
 * DESKTOP for tests. Social brand marks are filled, not this stroke.
 */
export const ICON_STROKE_WIDTH_MOBILE = 1.5;
export const ICON_STROKE_WIDTH_DESKTOP = 2.5;
export const ICON_STROKE_WIDTH: number | string = "var(--icon-stroke-width)";

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
