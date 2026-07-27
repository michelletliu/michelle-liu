# Filter Dropdown Panel Alignment

## Goal

Align every dropdown option label with the left edge of the text inside the trigger pill while placing the dropdown panel edge slightly to the left of the pill edge.

## Design

- Change the dropdown panel's inner wrapper from 6px horizontal and vertical padding to 4px on every side (`p-1`).
- Keep each option's existing 12px horizontal and 4px vertical padding (`px-3 py-1`).
- Position the panel 5px left of the trigger in both rendering modes:
  - Portal mode subtracts 5px from the trigger's measured left coordinate.
  - Inline mode uses a negative 5px left offset.
- Keep the trigger pill unchanged.

The panel's 1px border, 4px wrapper padding, and 12px option padding create a 17px text inset. Moving the panel 5px left places the option text at the trigger text's existing 12px inset while leaving the panel edge 5px farther left.

## Scope

Only `FilterDropdown` panel spacing and horizontal positioning change. Typography, option state styling, animation, trigger sizing, selection behavior, and responsive behavior remain unchanged.

## Testing

Add a source-level regression test that verifies:

- The wrapper uses `p-1`.
- Options retain `px-3 py-1`.
- Portal coordinates subtract 5px from the trigger's left edge.
- Inline positioning uses a negative 5px offset.

Run the targeted test, the complete test suite, and the production build. Visually verify the open dropdown at desktop and mobile widths.
