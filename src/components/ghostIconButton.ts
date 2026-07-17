/**
 * SpecButton ghost · icon — transparent idle, circular wash on hover.
 * Pair with a text-* color for the glyph (e.g. text-zinc-400 / text-zinc-500).
 */
export const ghostIconButtonSize = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export type GhostIconButtonSize = keyof typeof ghostIconButtonSize;

/** Base classes for a ghost icon button (add size + text color). */
export const GHOST_ICON_BUTTON =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors duration-200 ease-out hover:bg-zinc-900/5";

export function ghostIconButtonClass(
  size: GhostIconButtonSize = "md",
  className = "",
): string {
  return [GHOST_ICON_BUTTON, ghostIconButtonSize[size], className]
    .filter(Boolean)
    .join(" ");
}
