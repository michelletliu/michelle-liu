# Iconography classification & specimen sizing

## Goal

Make the design-system Iconography page classify and size icons correctly.

## Changes

1. **Filled vs stroke** — Move `Circle` and `Squircle` from Stroke icons into Filled icons (they are solid glyphs).
2. **Stroke specimen size** — Render every stroke-icon specimen at toolbar size (`20px` / `iconSize("toolbar")`), including Close and each glyph in Eye / eye-off.
3. **Alphabetical order** — Within Filled, Social, and Stroke, list specimens A–Z by display label.

## Out of scope

- Redrawing glyph paths for optical balance
- Changing in-product icon component APIs
- Reordering Iconography subsections (Size / Filled / Social / Stroke)

## File

- `src/components/system/sections/IconSection.tsx` only
