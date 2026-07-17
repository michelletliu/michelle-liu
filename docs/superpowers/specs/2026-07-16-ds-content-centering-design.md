# Design System — Center Content Column (Liveline-style)

**Date:** 2026-07-16  
**Status:** Pending user review  
**Owner:** Michelle

## Purpose

Center the Design System main content column in the full viewport the same way Liveline does: a capped reading measure with equal auto horizontal margins. Keep the desktop TOC in the left gutter so it does not push content off-center.

## Success Criteria

- On `lg+`, the DS `main` column is visually centered in the viewport (equal leftover space left and right of the column).
- Column measure stays `max-w-[720px]`.
- Desktop TOC remains usable: sticky, dock-to-footer near the bottom, logo doorway clearance (`top-28` / `top-0`) unchanged in behavior.
- Mobile layout unchanged (sticky section menu, full-width content, no desktop TOC).
- No changes to section internals, footer, or logo doorway.

## Scope

**In:**
- Layout wrapper + `main` + desktop `aside` positioning in `SystemPage.tsx` only.

**Out:**
- Mobile section menu
- Section content / specimens
- Footer, logo doorway, page chrome outside this layout row
- Changing the 720px measure

## Current Behavior

Desktop uses an in-flow flex row:

```
[aside w-44][gap][main flex-1 max-w-[720px]]
```

`main` caps at 720px but sits flush left of the remaining flex space, leaving a large empty band on the right.

## Target Behavior

Liveline pattern: content container centered via `margin-left/right: auto` within the viewport.

```
viewport
├── left gutter (TOC overlays / absolute within)
├── main (max-w-[720px] mx-auto)
└── right gutter (empty, matches left visually around main)
```

## Architecture

Single file change: `src/components/system/SystemPage.tsx`.

### Desktop (`lg+`)

1. Outer content row becomes a relative, full-width container (keep existing vertical padding / horizontal page padding for edge safety).
2. `main`: `mx-auto w-full max-w-[720px]` — remove `flex-1` so width does not stretch asymmetrically; centering comes from auto margins relative to the viewport-width row.
3. Desktop `aside`: take out of normal flow so it does not consume horizontal space that would unbalance centering. Position it in the left gutter (`absolute` left aligned within the padded row, or equivalent) with the existing sticky / dock-to-footer chrome (`desktopChromeRef`, `desktopDocked`, `logoHidden` top classes) preserved.
4. Ensure sticky runway still works: the absolute aside’s containing block must stretch with `main` height (e.g. aside remains `self-stretch` height via a full-height absolute inset or the zone already provides height from `main`). Prefer: outer `relative` wrapper; `aside` `absolute inset-y-0 left-*` with inner sticky chrome unchanged; `main` in normal flow providing document height.

### Mobile (`< lg`)

- No desktop aside (already `hidden lg:block`).
- `main` stays full width within page padding; `mx-auto max-w-[720px]` is harmless on narrow viewports.

### Collision / narrow desktop

If viewport is too narrow for 720px + TOC + padding, content may approach the TOC. Keep existing horizontal padding (`px-6` / `md:px-16`). Do not add breakpoint-specific reflow beyond current `lg` TOC visibility. Acceptable if TOC and content are close on the smallest `lg` widths; do not shrink the measure below 720px.

## Testing

- Desktop wide: measure left/right space from viewport edge to `main` — should be approximately equal (TOC sits inside the left band).
- Desktop scroll: TOC sticky + dock-to-footer still works; logo hide still collapses sticky top.
- Mobile: section menu and stacked content unchanged.
- Visual: color grid / intro still readable; no horizontal overflow.

## Decision Log

- **Center relative to:** full viewport (not the space after an in-flow TOC).
- **Approach:** absolute TOC in left gutter + `main` `mx-auto max-w-[720px]`.
- **Measure:** keep 720px.
