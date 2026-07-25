/**
 * The one focus treatment every control in the gallery action bar shares.
 *
 * A ring is a box-shadow, so it traces the control's own border-radius exactly,
 * including the squircle corners `index.css` applies. It also survives the
 * global `input:focus-visible { outline: none }` reset, which would otherwise
 * leave the text fields with no visible focus at all.
 *
 * Three things keep it quiet, all of which were wrong at some point:
 *
 * - `gallery-focus` opts out of the unlayered global `*:focus-visible` outline.
 *   Tailwind's `outline-none` is layered and loses to it, so without this the
 *   outline and the ring both paint and read as two stacked boundaries.
 * - `focus-visible` rather than `focus`, so clicking into a field or typing in
 *   it shows nothing; the ring is for keyboard navigation only.
 * - `ring-2 ring-zinc-300` is the same weight and token as the global outline
 *   it replaces — a quiet state change rather than a heavy black box. No
 *   `ring-offset`, whose background-coloured gap is itself a second boundary.
 *
 * Controls pair this with a plain `border-zinc-200` and no focus border shift,
 * so the ring is the only thing that changes.
 */
export const GALLERY_FOCUS_RING =
  "gallery-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";
