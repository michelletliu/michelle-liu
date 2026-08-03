# Filter Dropdown Vertical Spacing

## Goal

Restore production-like vertical density on the library filter dropdown without undoing the horizontal text-alignment fix.

## Design

Keep the PR's horizontal inset correction:

- Panel horizontal padding: `px-0.5` (2px)
- Option horizontal padding: `px-2.5` (10px)
- Combined left inset: 12px, matching the trigger

Restore production vertical values:

- Panel vertical padding: `py-1.5` (6px)
- Option vertical padding: `py-1` (4px)
- Option gap: `gap-1` (4px)

Do not change radius, ring/border treatment, positioning, typography, or trigger styles.

## Scope

Only the list wrapper and option button spacing classes in `FilterDropdown`.

## Testing

Update the source regression test to assert the restored vertical classes alongside the horizontal inset classes. Run the targeted test and full suite.
