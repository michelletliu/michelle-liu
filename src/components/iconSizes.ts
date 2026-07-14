/**
 * Shared stroke-icon size ramp (px).
 * Prefer `iconSize("toolbar")` over ad-hoc rem/`size-*` classes so
 * `strokeWidth={1.5}` + `vectorEffect="non-scaling-stroke"` stay consistent.
 *
 * Pairing rule: chevrons sit one step below the paired Close
 * (sheet Close = touch 24 → sticky/list chevrons = toolbar 20).
 */
export const iconSizes = {
  /** Dense / meta */
  meta: 12,
  /** Inline with text / dense leading marks */
  inline: 16,
  /** Toolbar / filter disclosure / sheet list chevrons */
  toolbar: 20,
  /** Default touch affordance / primary sheet Close */
  touch: 24,
  /** Hero / specimen */
  hero: 32,
} as const;

export type IconSizeName = keyof typeof iconSizes;
export type IconSizePx = (typeof iconSizes)[IconSizeName];

/** CSS length for the `size` prop on Chevron / Close / Arrow / ArrowUpRight. */
export function iconSize(name: IconSizeName): `${IconSizePx}px` {
  return `${iconSizes[name]}px`;
}
