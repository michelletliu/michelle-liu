# Filter Dropdown Selection Radius

## Goal

Keep the dropdown panel corner radius unchanged and make the gray selection highlight a tad more rounded so the inner corners read more concentric with the panel.

## Design

- Keep the panel shell at `rounded-xl` (12px).
- Keep panel wrapper padding at `p-1` (4px).
- Change option buttons from `rounded-[10px]` to `rounded-[11px]`.
- Apply the same radius to both active (`bg-zinc-100`) and hover (`hover:bg-zinc-50`) states.
- Leave positioning, width expansion, gap, typography, animation, and trigger styling unchanged.

With 4px inset padding, an 11px inner radius sits one pixel under the panel's 12px outer radius, which keeps the corner rings visually concentric while satisfying the "a tad more rounded" request.

## Scope

Only the option button border-radius in `FilterDropdown` changes.

## Testing

Update the source-level regression test to assert `rounded-[11px]`. Run the targeted test, the full suite, and visually verify the open dropdown on the library page.
