# Leading Icon Input Background

**Date:** 2026-07-28
**Status:** Approved

## Goal

Make every Leading icon input specimen in the design-system Inputs matrix use
the same white surface background as the Text and Trailing icon specimens.

## Scope

- Update the local `SpecInputSample` tone selection in
  `src/components/system/sections/ComponentSection.tsx`.
- Apply the white surface to Default, Focus, Filled, Disabled, and Error states.
- Keep the Muted row on its existing muted background.
- Do not change the shared `FieldShell` primitive or input behavior.

## Implementation

Map only the `muted` composition to `FieldShell`'s muted tone. All other
compositions, including `leading`, use the surface tone. This keeps the change
semantic and local instead of overriding the background with an extra utility.

## Verification

- Run the focused design-system tests.
- Run the project lint and build checks.
- Visually confirm the Leading icon row is white in all five states and the
  Muted row remains gray.
