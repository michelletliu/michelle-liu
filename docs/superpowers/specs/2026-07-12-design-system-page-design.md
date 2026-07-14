# Design System Showcase — `/system`

**Date:** 2026-07-12
**Status:** Approved pending review
**Owner:** Michelle

## Purpose

A public, hidden-URL page at `/system` that catalogs the site's entire visual
language: every distinct color, type size, weight, tracking, line-height,
shadow, radius, spacing pattern, border, material/effect, and motion token — plus
the shared components and each experiment "island" that diverges from the core
style.

It is a **public showcase** (polished, browsable) but built from an **exhaustive
audit** (nothing omitted, including one-off values). It is **not linked** from
site nav; it's reached only by typing the URL.

## Success Criteria

- Navigating to `/system` renders a self-contained page in the Michelle font.
- A sticky left sidebar TOC lets you jump to any section (desktop); a top chip
  strip / stacked jump links on mobile.
- Every value from the audit appears as a labeled entry (visual sample + name +
  value/class + "where used" note + tag).
- Each entry is tagged **canonical** / **one-off** / **experiment**.
- Experiments (Polaroid, Screentime, Sketchbook, Film, Fading, Art,
  ExperimentModal) each have their own island showing signature divergences.
- Page is responsive and builds without errors. No existing pages change
  behavior (only additive route + a self-contained component tree).

## Scope

**In:** New route `app/system/page.tsx` + a new component tree under
`src/components/system/`. Data (the token lists) lives in a
`src/components/system/tokens.ts` data module so the page stays declarative.

**Out:** No refactor of existing styles into shared tokens. No nav link. No CMS
integration (this is hand-curated from the audit, static). NUX and Short-Film do
not exist on disk and are excluded.

## Architecture

```
app/system/page.tsx            # route: metadata (noindex) + <SystemPage/>
src/components/system/
  SystemPage.tsx               # "use client"; layout shell, sidebar TOC, scroll spy
  tokens.ts                    # all audited data (colors, type, shadows, ... , experiments)
  primitives.tsx               # Swatch, TokenCard, Tag, SectionHeader, Grid, Row helpers
  sections/
    ColorSection.tsx
    TypographySection.tsx
    ShadowSection.tsx
    RadiusSection.tsx           # incl. squircle explanation
    SpacingSection.tsx
    BorderSection.tsx
    MaterialSection.tsx         # glass, shimmer, gradients, focus rings, grain, fades
    MotionSection.tsx           # keyframes list + live duration/easing demos
    ComponentSection.tsx        # live shared components: nav pill, tooltip, pills, cards, spinner, badge
    ExperimentSection.tsx       # islands, one block per experiment
```

Each section is a pure presentational component fed by `tokens.ts`. The shell
owns: font wrapper, max-width, sidebar TOC, active-section highlight
(IntersectionObserver scroll spy), mobile chip strip, and a small logo/back
affordance (reusing the site's fixed logo pattern, linking to `/`).

## Component / data design

- **`tokens.ts`** exports typed arrays, e.g.
  `ColorToken { name; value; className?; usage; tag }`,
  `TypeToken`, `ShadowToken`, `RadiusToken`, `MotionToken`, `ExperimentIsland`.
  Tags: `'canonical' | 'one-off' | 'experiment'`.
- **`primitives.tsx`** provides the reusable entry card (matches the format the
  user approved in the companion): visual sample on top, name + tag row, mono
  value line, muted usage note. Plus a `<Tag>` chip with three color variants.
- **Sections** map their token array to cards in a responsive grid. Foundational
  sections (color/type/shadow/radius) are exhaustive; spacing lists the
  recurring scale + notable arbitrary values; motion renders a small live
  animated square per keyframe using the real duration/easing.
- **Components section** renders *live* instances of shared UI where they can be
  isolated safely (nav pill visual, tooltip trigger, filter pill, project title
  pill, CTA buttons, loading spinner, contact/availability dot, shimmer block,
  cards with `shadow-default`). Where a component can't be safely mounted
  standalone (full modals), show a static visual + note instead.
- **Experiment islands** show each experiment's signature colors, fonts,
  radii, shadows, and effects as a compact themed block (e.g. Polaroid frame
  mockup, Screentime receipt snippet, Film hashmark timeline, Art glass button),
  each with a short caption of what makes it distinct.

## Data flow

Static, top-down. `tokens.ts` → sections → primitives. No fetching, no state
except the scroll-spy active-section id and mobile TOC open/close in
`SystemPage`.

## Error handling / edge cases

- Route is additive; `noindex` metadata so it stays out of search despite being
  public.
- `"use client"` only on `SystemPage` (needs IntersectionObserver); sections can
  be server-safe but will render inside the client tree.
- Squircle: index.css applies `corner-shape: squircle` globally, so radius
  samples on this page will also be squircled — the radius section explains this
  and shows the compensated values from index.css.
- Fonts: Michelle is global; Manrope/DM Sans/SF Pro references are shown as
  labeled samples (SF Pro/DM Sans may fall back on non-Apple/non-loaded
  environments — noted inline).

## Testing

- `next build` / typecheck passes.
- Manual: load `/system`, confirm sidebar jumps work, scroll spy highlights,
  mobile layout collapses to chips, all sections render, no console errors.

## Not doing (YAGNI)

- No search/filter over tokens.
- No copy-to-clipboard on swatches (could add later).
- No dark mode (site is light-only in practice).
- No auto-generation from source; data is curated from the audit.
