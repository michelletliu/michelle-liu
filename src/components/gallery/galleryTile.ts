/**
 * The one shape every artwork tile wears, wherever it is standing.
 *
 * A tile appears in three places — the strip, the loading placeholders that
 * hold its spot, and the fan of peek cards behind the collapsed bar — and the
 * three have to agree exactly, or a tile changes shape as its image arrives or
 * as the panel opens. Since the same nodes now fly between the fan and the
 * strip, a mismatch would also be visible mid-flight rather than only at rest.
 *
 * `rounded-xl` rather than a hand-written radius because `index.css` bumps that
 * class to 20px under `corner-shape: squircle`, which is what makes these read
 * as squircles instead of rounded rectangles. The old `rounded-md` was outside
 * that compensation list, so at 6px the superellipse had nothing to show.
 * Browsers without `corner-shape` land on a plain 12px rounded rect, which is
 * the intended fallback rather than a broken state.
 */
export const TILE_SHAPE = "size-25 rounded-xl";

/**
 * The white edge, painted over the artwork instead of around it.
 *
 * As a border it sat between the image and the tile's own white background, so
 * `border-white/20` composited against white and arrived looking like a solid
 * white frame — 20% of nothing. An inset ring paints over the image, where the
 * 20% is actually 20% of the picture underneath. It also costs no layout: the
 * image keeps the tile's full footprint rather than being pushed in by two
 * pixels, which matters when the same node is mid-flight between layouts.
 *
 * `inset-ring` and not `shadow-[inset_…]`, which is what this was first written
 * as and which rendered nothing at all: Tailwind composes `box-shadow` out of
 * five slots, and a bare `shadow-[…]` writes the same slot as the tile's
 * `shadow-lg`, so the two silently overwrote each other and the drop shadow won.
 * `inset-ring` owns its own slot, which is the whole reason it exists — it
 * stacks with the drop shadow and with the `focus-visible` ring rather than
 * competing for one variable with either.
 *
 * Box shadows trace `border-radius` and, in browsers that have it, the
 * `corner-shape` with it, so the ring follows the squircle rather than cutting
 * a rounded rectangle inside one.
 */
export const TILE_INSET_RING = "inset-ring-2 inset-ring-white/20";

/**
 * The same white edge, brightened while the pointer is on the tile.
 *
 * Not a second design value so much as the resting one turned up: hover used
 * to be `border-zinc-300`, which at these radii read as the tile changing
 * colour rather than lighting up. Named here beside the other two so the three
 * ring states stay a set and cannot drift apart in a class string.
 */
export const TILE_HOVER_RING = "hover:inset-ring-white/50";

/**
 * Selection, in the same slot as the white edge so the two swap rather than
 * stack — the same ink the Generate button uses.
 */
export const TILE_SELECTED_RING = "inset-ring-2 inset-ring-zinc-900";

/**
 * Ties a tile in the strip to the same artwork's card in the collapsed fan, so
 * framer-motion moves one node between the two layouts instead of crossfading
 * two. Only the works the fan actually shows have a counterpart; the rest of
 * the strip has nothing to fly to and simply fades, which is correct — they
 * have no position in the collapsed state to move from.
 */
export function tileLayoutId(objectID: number): string {
  return `gallery-tile-${objectID}`;
}
