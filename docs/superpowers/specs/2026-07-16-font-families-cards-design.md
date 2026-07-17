# Font Families Cards — Design Spec

**Date:** 2026-07-16  
**Scope:** Design system page → Typography → Families  
**File:** `src/components/system/sections/TypographySection.tsx`

## Problem

The four font families (Figtree, SF Pro, Courier New, SF Mono) render as a divided list. Other token sections (Borders, Radius, Shadows, Spacing) use `TokenCard` + `Grid` with a zinc-50 specimen tile. Families should match that pattern so typefaces are easier to scan and compare.

## Decision

Reuse existing `TokenCard` and `Grid` primitives. No new components.

## Layout

- Replace the Families `divide-y` list with `<Grid min="220px">`.
- One `TokenCard` per entry in `fontFamilies` (4 cards).
- Responsive: ~2×2 on desktop, single column on narrow viewports.

## Card content

| Slot | Source |
|------|--------|
| Specimen | Font name (`f.name`) at `text-2xl` or `text-3xl`, color `text-zinc-700`, `style={{ fontFamily: f.fontFamily ?? f.stack }}` |
| Name | `f.name` (mono label, as `TokenCard` expects) |
| Tag | `f.tag` only when `uniformTag(fontFamilies)` is falsy (same as today) |
| Value | `f.stack` (CSS font-family stack) |
| Usage | `f.usage` |

## Out of scope

- Scale, Weights, Tracking, Leading subsections
- Token data changes in `tokens.ts`
- New primitives or custom font-card components

## Acceptance

- Families section shows four cards in a grid
- Each specimen renders in its own typeface
- Stack + usage remain readable below the tile
- Canonical / Experiment tags still appear correctly (or via section-level uniform tag)
- Visual language matches Borders / Radius token cards
