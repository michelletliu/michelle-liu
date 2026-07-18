# Design System Section URL Slugs

## Goal

Make each top-level Design System section addressable and reflected in the URL, so the address bar matches the active sidebar section and deep links can open that section.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Depth | **Top-level sections only** — no subsection paths (`/size`, `/stroke-icons`, …) |
| Slug text | **Slugified nav labels** — e.g. `Iconography` → `iconography` |
| When URL updates | **Sidebar click and scroll-spy** keep the path in sync |
| History | **`replaceState` / `router.replace`** — no back-stack spam while scrolling |
| Overview | Bare `/design-system` (no `/overview` segment) |

## URL map

| Sidebar label | Path | Existing DOM / nav id |
|---------------|------|------------------------|
| Overview | `/design-system` | `intro` |
| Color | `/design-system/color` | `color` |
| Components | `/design-system/components` | `components` |
| Typography | `/design-system/typography` | `typography` |
| Shadows | `/design-system/shadows` | `shadows` |
| Spacing | `/design-system/spacing` | `spacing` |
| Borders | `/design-system/borders` | `borders` |
| Motion | `/design-system/motion` | `motion` |
| Iconography | `/design-system/iconography` | `icons` |
| Materials | `/design-system/materials` | `materials` |

Slugs are `slugify(label)` from `tokens.ts`. The one non-identity mapping today is **Iconography → path `iconography`, DOM id `icons`**.

Subsections (Size, Stroke icons, …) stay scroll-spy highlights only; they do **not** get path segments.

## Approach

Optional catch-all App Router segment that still renders the same single-page `SystemPage`:

- Move / reshape `app/design-system/page.tsx` to `app/design-system/[[...slug]]/page.tsx` (or equivalent) so `/design-system` and `/design-system/:section` hit one page.
- Pass the optional slug into `SystemPage` (via `params` or by reading `pathname` on the client).
- Keep `/system` and `/ds` redirects pointing at `/design-system`.

### Label ↔ id helpers

Add small helpers next to `tocSections` / `slugify` (e.g. in `tokens.ts`):

- `sectionPathSlug(section)` → path segment from label (`iconography`), or `null` for Overview
- `sectionIdFromPathSlug(slug)` → DOM id (`icons`), or `null` if unknown
- `pathForSectionId(id)` → `/design-system` or `/design-system/<slug>`

Derived from `tocSections` so new sections stay in sync.

### Sync behavior

**On mount / navigation into a deep link**

1. If path is `/design-system` or Overview — do not force-scroll away from top (current mount `scrollTo(0,0)` is fine).
2. If path has a known section slug — after the target section is in the DOM, scroll it into view (same `block: "start"` as sidebar clicks). Gate or skip the blanket mount `window.scrollTo(0, 0)` when a deep link is present.
3. Unknown slug → treat as Overview: `replace` to `/design-system` (or stay and show Overview); do not 404 the whole DS page.

**On sidebar click (top-level section)**

1. Smooth-scroll to the section DOM id (unchanged).
2. `replace` URL to `pathForSectionId(id)`.

**On sidebar click (subsection)**

1. Smooth-scroll to the sub id (unchanged).
2. `replace` URL to the **parent section** path only (not a sub path). Example: clicking Size under Iconography → `/design-system/iconography`.

**On scroll-spy**

When `activeSection` changes, `replace` to that section’s path. Skip if the path already matches. Prefer `history.replaceState` (or Next `router.replace` with scroll disabled) so the browser back stack is not flooded — same idea as Library’s path sync.

**Doorway / logo entry**

Logo and doorway entry can keep pushing bare `/design-system` (Overview). Deep links remain shareable when copied from the address bar.

## Out of scope

- Subsection path segments
- Hash-based URLs (`#iconography`)
- Separate multi-page routes that remount content per section
- Changing existing DOM ids (`icons`, `sub-size`, …)
- Updating external bookmarks that used only `/design-system` (no migration needed)

## Risks / edge cases

- **Dynamic sections:** Iconography and other heavy sections load via `dynamic()`. Deep-link scroll must wait until the target element exists (retry / layout effect), not only on first paint.
- **Scroll-spy churn:** Guard replaces so identical paths don’t rewrite history repeatedly.
- **Overview vs empty slug:** Only Overview uses the bare path; never emit `/design-system/overview` unless product later asks for it.
- **SSR / client:** Path sync and scroll-into-view are client concerns; the catch-all page can still SSR the same shell.

## Success criteria

1. Clicking a top-level TOC item updates the URL to `/design-system/<slugified-label>` (Overview → `/design-system`).
2. Scrolling between sections updates the URL the same way.
3. Opening `/design-system/iconography` (or any valid section slug) lands scrolled to that section after content mounts.
4. Subsection clicks do not add a second path segment; URL stays on the parent section.
5. Invalid slugs do not break the page; user ends on Overview / bare `/design-system`.
6. Existing `/design-system`, `/ds`, and `/system` entry points still work.
