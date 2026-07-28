# Button Radius Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent circular/rectangular radius toggle to the Solid, Glass, and Playground button specimen cards.

**Architecture:** Card-level `circular | rectangular` state drives a shared radius class on every specimen button. A ghost icon control in each card’s top-right shows the alternate shape (squircle when circular, circle when rectangular). Production button APIs stay unchanged.

**Tech Stack:** React, Tailwind, existing `ghostIconButtonClass`, shared icon library.

## Global Constraints

- Default every card to circular (`rounded-full`).
- Rectangular mode uses `rounded-xl` for all variants.
- No selected-fill chrome on the toggle; icon shape is the only state cue.
- Independent state per card (Solid / Glass / Playground).
- Specimen-only — do not change site-wide button components.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/components/library/icons.tsx` | `CircleIcon` + `SquircleIcon` |
| `src/components/system/sections/IconSection.tsx` | Catalog both glyphs |
| `src/components/art/LiquidGlassButton.tsx` | Optional radius for glass icon samples |
| `src/components/system/sections/ComponentSection.tsx` | Radius mode, toggle UI, wire all 3 cards |

---

### Task 1: Circle + Squircle icons

**Files:** `library/icons.tsx`, `IconSection.tsx`

- [ ] Add stroke `CircleIcon` and `SquircleIcon` (1.5 stroke, non-scaling).
- [ ] Catalog both under Stroke icons in Iconography.
- [ ] Commit.

### Task 2: Card radius mode + toggle

**Files:** `ComponentSection.tsx`, `LiquidGlassButton.tsx`

- [ ] Replace per-variant `SPEC_BUTTON_RADIUS` with mode → class map (`circular` → `rounded-full`, `rectangular` → `rounded-xl`).
- [ ] Pass `radiusMode` through `SpecButton` / samples / glass samples.
- [ ] Allow `LiquidGlassButton` to render `xl` radius when rectangular.
- [ ] Add `ButtonRadiusToggle` (ghost icon button, top-right of each stage).
- [ ] Wire independent state into Solid, Glass, and Playground.
- [ ] Verify in browser; commit; push to PR 261.
