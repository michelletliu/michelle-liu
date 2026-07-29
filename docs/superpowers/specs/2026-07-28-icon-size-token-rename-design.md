# Icon Size Token Rename Design

**Date:** 2026-07-28
**Status:** Approved

## Goal

Replace context-specific icon size names with a familiar ordinal scale and make both icons in design-system input specimens use the 20px medium size.

## Size Scale

- `xs`: 12px
- `sm`: 16px
- `md`: 20px
- `lg`: 24px
- `xl`: 32px

The pixel values do not change; only token names and callers change.

## Scope

- Rename `meta / inline / toolbar / touch / hero` to `xs / sm / md / lg / xl` in `iconSizes.ts`.
- Update every `iconSize(...)` caller and the Iconography size-ramp labels.
- Use `iconSize("md")` for both the search icon and trailing arrow in the Inputs matrix.
- Keep the arrow's canonical 1.5px non-scaling stroke.
- Do not change input spacing, color, typography, editability, or state behavior.
- Do not keep compatibility aliases; TypeScript should expose stale callers.

## Verification

- Search for all old size-token names and confirm none remain in icon-size APIs.
- Run iconography, input-matrix, and full project tests.
- Run TypeScript verification.
- Visually confirm both input icons render at 20px and the arrow no longer appears overly dense.
