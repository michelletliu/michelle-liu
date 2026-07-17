# Squircle Corner Diagram — Design Spec

**Date:** 2026-07-16  
**Scope:** Design system page → Border Radius → Squircle callout  
**File:** `src/components/system/sections/RadiusSection.tsx`

## Problem

The Squircle callout explains `corner-shape: squircle` and ~1.7× radius compensation in prose only. Readers can’t see how a round corner differs from a squircle. The copy is also longer than it needs to be.

## Decision

Add a side-by-side zoomed corner diagram below the callout copy (still inside the zinc-50 card). Trim the explanatory text to one short paragraph. No new shared primitives; SVG inline in `RadiusSection`.

## Layout

1. Keep the existing zinc-50 callout card and “Squircle corner-shape” heading.
2. Shorten body copy (see Copy).
3. Below the copy: two equal cells in a horizontal row (`grid grid-cols-2 gap-4`). Stay two-up on mobile — the corner zooms are small enough.
4. Each cell:
   - Specimen: square tile (white fill, subtle zinc ring) containing an SVG that zooms the **top-left corner** curve.
   - Label under the tile: `Round` | `Squircle` (`text-sm`, muted zinc).

## Diagram

| Cell | Path |
|------|------|
| Round | Circular quarter-arc (standard `border-radius` corner) |
| Squircle | Superellipse / squircle-style corner path that stays fuller near the edges and rounds more gradually |

Constraints:

- Same viewBox and zoom framing for both so the difference is the curve, not scale or crop.
- Stroke-only (or stroke + light fill), zinc palette matching other system specimens.
- No guide marks, radius ticks, or “1.7×” annotation on the diagram.
- Decorative / illustrative: `aria-hidden` on SVGs; labels carry the meaning.

## Copy

Replace the long paragraph with a short version along these lines:

> Supporting browsers get `corner-shape: squircle` globally; radius is bumped ~1.7× so corners don’t look tighter. Circles and pills stay `round`.

Keep inline `<code>` styling consistent with the rest of the system page. Prefer fewer sentences over completeness.

## Out of scope

- Radius scale / Experiment radii cards
- Token data in `tokens.ts`
- Changes to `index.css` compensation values
- New design-system primitives
- Live CSS `corner-shape` demos (SVG paths only)

## Acceptance

- Callout shows Round vs Squircle zoomed corners under the copy
- Both diagrams share the same framing
- Copy is one short paragraph (materially shorter than today)
- Visual language matches the zinc-50 callout / token specimens
- No layout breakage on mobile
