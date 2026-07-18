# Case Study Sidebar Navigation

**Date:** 2026-07-18  
**Status:** Pending user review

## Goal

Add a sticky left sidebar of chapter titles to every fullscreen case study on desktop, so readers can jump between chapters without relying on the top TOC card row. Visual pattern matches the shared site `Sidebar` (About / Art); spacing stays the existing case study layout.

## Success Criteria

- Fullscreen desktop case studies show a left sidebar listing chapter titles.
- Active chapter highlights while scrolling (`text-blue-500`); inactive uses zinc + hover (shared `Sidebar`).
- Clicking a chapter smooth-scrolls to that section.
- Content column padding / alignment does not change — sidebar sits in the existing left margin.
- Hidden on mobile and in popup (non-fullscreen) mode.
- TOC card titles preferred; if none, fall back to `sectionTitleSection` titles.
- Projects with neither source show no sidebar.
- Dormant hidden mini-TOC in `ProjectModal` is removed.

## Scope

**In:**
- Fullscreen `ProjectModal` case studies (Apple, Adobe, Roblox, NASA, any future Sanity projects)
- Desktop (`md+`) only
- Shared `Sidebar` component reuse
- Scroll-spy + click-to-scroll against existing section anchors
- Derive nav items from `project.content` (TOC items → section titles fallback)

**Out:**
- Popup modal mode
- Mobile
- CMS schema changes
- “Back” link in the sidebar (breadcrumb already covers return)
- Changing top TOC card row behavior or layout
- Nested parent/child groups in the sidebar (flat list only)
- Number prefixes (“01”) in sidebar labels

## Inspiration vs constraints

**Inspiration (nataliealmosa.ca/skiff):** sticky top-left chapter list with active/inactive type contrast.

**Constraint:** follow this site’s spacing (`px-8 md:px-[8%] xl:px-[175px]`), not the Skiff gutter. Do not pull content right or add a new content column offset.

## Placement & visibility

| Condition | Sidebar |
|-----------|---------|
| Fullscreen + desktop (`md+`) + has nav items | Visible, fixed top-left in left margin |
| Popup mode | Hidden |
| Mobile | Hidden |
| No TOC items and no usable section titles | Hidden |

Approximate position: fixed near `top` below the sticky case study header, `left` aligned with the start of the existing page padding (not Skiff’s inset). Content stays at current `xl:px-[175px]` / `md:px-[8%]` — no layout reflow.

## Nav items & data

**Primary source:** `tableOfContentsSection.items`

- `id`: `targetSectionId` (section number) when present, else item `_key`
- `label`: item `title` (no number prefix)

**Fallback:** `sectionTitleSection` blocks when no TOC items exist

- Prefer chapters with a real title
- Skip TOC-only placeholders such as number `"00"` titled “Table of Contents” when that would duplicate the card TOC concept
- `id`: section `number` when present, else section `_key`
- `label`: section `title`

**Empty:** if both sources yield zero items, render nothing.

## Interaction & highlight

- Render via shared `src/components/Sidebar.tsx` as flat `kind: "item"` nodes.
- Active leaf: `text-blue-500`; inactive: `text-zinc-400 hover:text-zinc-500`.
- Scroll-spy on the modal scroll container updates `activeId` as chapters enter view (same conceptual model as About sidebar).
- Click → smooth scroll to `[data-section-number="{id}"]` or equivalent key/heading anchor already used by TOC cards.
- Remove the dormant block currently at `className="fixed left-6 top-28 z-30 hidden"` and related `isPastTOC`-only show gate for that UI.

## Technical plan

1. **Branch:** `feat/case-study-sidebar-nav` from `main`.
2. **Helper:** pure function to build nav items from `project.content` (TOC first, else section titles) — unit tested.
3. **UI:** thin wrapper (e.g. `ProjectCaseStudySidebar`) or inline wiring in `ProjectModal` that maps items → `Sidebar` nodes and wires `onSelect` + `activeId`.
4. **Scroll-spy:** observe section anchors inside the modal scroll container; update active chapter.
5. **Cleanup:** delete dormant mini-TOC markup and unused `isPastTOC` path if nothing else depends on it.
6. **No Sanity / schema / query changes** — data already on the project payload.

### Files (expected)

| File | Role |
|------|------|
| `src/components/project/caseStudyNavItems.ts` (or similar) | Pure nav-item derivation |
| `src/components/project/caseStudyNavItems.test.ts` | Unit tests for TOC / fallback / empty |
| `src/components/project/ProjectCaseStudySidebar.tsx` (optional) | Thin presentational wrapper |
| `src/components/project/ProjectModal.tsx` | Mount sidebar, scroll-spy, remove dormant TOC |
| `src/components/Sidebar.tsx` | Reuse as-is |

## Out-of-scope edge notes

- Apple may have few or no section titles today → sidebar may hide until content exists; that is correct.
- Nested holiday subsections under a chapter are not separate sidebar entries unless they appear as TOC cards or top-level `sectionTitleSection`s in the fallback path.
- Unlock/visibility filtering: nav items should only target sections currently rendered (respect the same visibility rules as content).

## Non-goals

- Matching Skiff’s exact type size, serif headings, or horizontal gutters
- Sticky sidebar that only appears after scrolling past the TOC cards
- Floating pill indicator (NavigationTabs style) — use `Sidebar` leaf colors only
