/**
 * SpecButton ghost · icon — transparent idle, circular wash on hover.
 * Pair with a text-* color for the glyph (e.g. text-zinc-400 / text-zinc-500).
 * Visuals live in `globals.css` under `.ghost-icon-button`.
 *
 * `rounded-full` is required so site-wide `corner-shape: squircle` (unlayered
 * in index.css) does not turn the equal-size hit area into a rounded square.
 */
export const ghostIconButtonSize = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;

export type GhostIconButtonSize = keyof typeof ghostIconButtonSize;

/** Base semantic class for a ghost icon button (add size + text color). */
export const GHOST_ICON_BUTTON = "ghost-icon-button";

export function ghostIconButtonClass(
  size: GhostIconButtonSize = "md",
  className = "",
): string {
  return [GHOST_ICON_BUTTON, ghostIconButtonSize[size], "rounded-full", className]
    .filter(Boolean)
    .join(" ");
}
