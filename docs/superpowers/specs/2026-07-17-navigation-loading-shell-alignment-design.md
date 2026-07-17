# Navigation Loading Shell Alignment

## Goal

Make the loading states shown while navigating between Work, Art, and About occupy the same geometry as the destination page, without a round spinner or loading label.

## Design

- Keep route-level loading shells for Art and About so navigation responds immediately.
- Match the real `PageHeader` desktop and mobile height, padding, logo position, title, and description structure.
- Match the real `NavigationTabs` padding, tab dimensions, active-pill position, and divider.
- Below navigation, render quiet structural skeleton blocks aligned to each page's main-content gutters and columns.
- Remove `LoadingSpinner` and the “Loading…” label from both route shells.
- Keep the loading UI non-interactive and hidden from assistive technology because it does not communicate actionable content.

## Implementation

Extract a shared server-compatible loading shell used by the Art and About `loading.tsx` files. Pass the active tab and page-specific hero/content skeleton configuration as props. Do not render the interactive production header or navigation components in the fallback.

## Verification

- Compare loading and loaded states at desktop and mobile widths; the header, tabs, divider, and content start must not jump vertically or horizontally.
- Confirm Art and About select the correct loading pill.
- Confirm no round spinner or loading text appears.
- Run the relevant tests, type checking, and linting available in the project.
