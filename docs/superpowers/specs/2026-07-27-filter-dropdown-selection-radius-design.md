# Filter Dropdown Selection Radius

## Goal

Make the gray option highlight corners perfectly concentric with the dropdown panel shell.

## Design

- Change the panel shell from `rounded-xl` (12px) to `rounded-2xl` (16px).
- Keep panel wrapper padding at `p-1` (4px).
- Keep the 1px panel border.
- Change option buttons from `rounded-[10px]` to `rounded-[11px]`.
- Apply the same radius to both active (`bg-zinc-100`) and hover (`hover:bg-zinc-50`) states.
- Leave positioning, width expansion, gap, typography, animation, and trigger styling unchanged.

Concentric math: outer radius 16px − border 1px − padding 4px = inner radius 11px.

## Scope

Only the panel and option-button border radii in `FilterDropdown` change.

## Testing

Update the source-level regression test to assert `rounded-2xl` and `rounded-[11px]`. Run the targeted test, the full suite, and visually verify the open dropdown on the library page.
