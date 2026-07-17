# Color Overview Filters — Design Spec

**Date:** 2026-07-16  
**Scope:** Design system page → Color → overview swatch grid  
**File:** `src/components/system/sections/ColorSection.tsx`

## Problem

The Color section opens with a dense grid of every unique swatch. There is no way to visually isolate Zinc, Blue, Case studies, Status, or Gradient stops without scrolling into the detailed lists below.

## Decision

Add plain text highlight filters above the overview grid. Interaction is preview/pin (not hide/show). Implementation stays local to `ColorSection` — do not extend `FilterPills`.

## Filters

Labels match existing `colorGroups` labels, in order:

| Label | `groupId` |
|-------|-----------|
| Zinc | `zinc` |
| Blue | `accent` |
| Case studies | `cms` |
| Status | `status` |
| Gradient stops | `gradients-color` |

No new token data in `tokens.ts`.

## Interaction

- **Default:** all filter text muted (`text-zinc-400`); all swatches at 100% opacity.
- **Hover** a filter: that label darkens (`text-zinc-700`); non-matching swatches go to **50%** opacity.
- **Click** a filter: pin that highlight. Click the same label again to clear the pin. Click another label to switch the pin.
- **Effective highlight** = hovered group ?? pinned group.
- Focus on a filter label mirrors hover (keyboard preview).
- Swatches are never removed or reordered. Copy-on-click behavior is unchanged.
- Short opacity transition on swatches when highlight changes.

## Membership

- Flatten overview colors with a `groupId` from their source group.
- De-dupe by hex as today; first occurrence wins.
- Case-study tab colors and shared pink defaults both belong to **Case studies**.

## Layout

- Filter row sits below the **Color** title and above the overview grid.
- Horizontal row of text buttons (no pill background, no sliding indicator).
- Existing detailed group lists below the overview are unchanged.

## Out of scope

- Hue-based filters (Neutrals / Pink / Orange, etc.)
- Changes to `FilterPills`
- Filtering or dimming the detailed color lists below
- Token data changes in `tokens.ts`

## Acceptance

- Five filters appear above the overview grid with correct group labels
- Hover previews; click pins; second click on the same filter clears
- Non-matching swatches render at 50% opacity while a highlight is active
- Matching swatches stay at full opacity
- Keyboard focus previews the same way as hover
- Detailed sections below the overview are unaffected
