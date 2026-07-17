# Button Variants Display — Matrix + Playground

**Date:** 2026-07-16  
**Status:** Approved  
**Owner:** Michelle

## Purpose

Replace the scattered Buttons specimens on `/design-system` Components with a compact **matrix** (every SpecButton combo at a glance) plus a small **playground** (interactive exploration), so variant · size · icon · glass read as axes instead of disconnected cards.

## Success Criteria

- Buttons section shows matrix + playground + glass callout (no old per-variant bento cards).
- Matrix covers all SpecButton combos: 4 variants × 3 sizes × 3 content modes.
- Playground can flip variant / size / content / surface and shows a live caption of the active combo.
- Glass remains documented as `LiquidGlassButton` (not a SpecButton prop).
- Existing `SpecButton` class patterns and SubLabel note (site patterns, not a shared Button API) stay true.
- Layout fits the existing specimen grid language and works on mobile (matrix scrolls horizontally if needed).

## Scope

**In:**
- Refactor Buttons subsection in `src/components/system/sections/ComponentSection.tsx`
- Matrix specimen (full width) with content-mode FilterPills
- Playground specimen (full width) with FilterPills for variant / size / content / surface
- Keep glass carousel-arrow specimen on gradient
- Keep footer note about in-use CTAs not shown

**Out:**
- Extracting a site-wide `Button` component / API
- Disabled, loading, destructive, or focus-ring state matrices
- New color tokens or variants beyond primary blue / secondary zinc
- Changing live site CTA markup outside the DS page

## Architecture

```
ComponentSection.tsx
  SpecButton (+ existing variant/size/icon class maps)  # unchanged contract
  ButtonMatrixSpecimen                                  # new local
  ButtonPlaygroundSpecimen                              # new local
  LiquidGlassButton specimen                            # keep, full-width callout
```

No new shared package. FilterPills reused for axis controls (same interaction as elsewhere on Components).

## Layout

Under existing SubLabel:

> Axes: variant · size · icon · glass · color. Specimens encode site class patterns (not a shared Button API).

1. **Matrix** — `Specimen` span full 12 cols  
2. **Playground** — `Specimen` span full 12 cols  
3. **Glass** — existing gradient specimen, full width  
4. Footer paragraph (unchanged meaning)

Remove: Primary / Secondary / Tertiary / Ghost cards, separate sizes card, icon+text cards, icon-only narrow cards.

## Matrix

| | sm | md | lg |
|---|----|----|-----|
| primary | … | … | … |
| secondary | … | … | … |
| tertiary | … | … | … |
| ghost | … | … | … |

- Content-mode FilterPills above table: **Label** | **Icon + label** | **Icon** (default: Label).
- Cell samples:
  - Label → short word (`Label` or size-agnostic “Action”)
  - Icon + label → `Continue` + `ArrowUpRight` / chevron (match current specimens)
  - Icon → icon-only with `aria-label`
- Headers: zinc-400 caption style consistent with specimen labels.
- Mobile: horizontal scroll on the table region; do not squash columns into unreadability.

## Playground

- Large centered live control.
- Controls (wrapping FilterPills rows):
  - **Variant:** primary · secondary · tertiary · ghost  
  - **Size:** sm · md · lg  
  - **Content:** label · icon+label · icon  
  - **Surface:** solid · glass  
- When **Surface = glass**: render `LiquidGlassButton` (icon content); SpecButton variant pills disabled or ignored with caption noting glass.
- Caption under preview: `primary · md · label` (or `glass · icon`).
- Defaults: primary · md · label · solid.

## Visual / interaction notes

- Stay inside existing DS specimen chrome (`Specimen`, zinc-50 cards, FilterPills).
- No new card styles, purple accents, or dashboard chrome.
- Hover styles on SpecButton / LiquidGlassButton remain as today (interactive specimens).

## Testing

- Desktop: matrix readable; playground updates preview + caption for every axis.
- Mobile: matrix scrolls; playground controls wrap without overlapping preview.
- Keyboard: FilterPills and rendered buttons remain focusable; icon-only buttons have aria-labels.
- Glass path: solid ↔ glass toggles correctly; glass preview matches carousel arrow specimen affordance.
