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
 * House stroke weight for every UI stroke icon (Chevron, Close, Arrow,
 * ArrowUpRight, Code, Plus, …), in CSS px. Paired with
 * `vectorEffect="non-scaling-stroke"`, so the rendered stroke stays this many
 * CSS px at any glyph size — a 12px icon and a 32px icon share one weight.
 *
 * This is the ONE place to tune icon weight site-wide; every stroke icon reads
 * from it and none hardcode their own. 1.5 then 1.75 both read too thin against
 * the site's type, so the house weight is 3. Change this single number to
 * retune everything at once (2.5 and 2 are the next steps down).
 */
export const ICON_STROKE_WIDTH = 3;

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
