# Info Modal — Extract, Consolidate, Document in DS

**Date:** 2026-07-16  
**Status:** Pending user review  
**Owner:** Michelle

## Purpose

Extract the experiment project info modal (title · year, description, View on X, tools grid, media preview) into a reusable `InfoModal` component. Consolidate the three near-duplicate implementations behind it, then document the modal as a live specimen in the Design System Components section.

## Success Criteria

- One canonical `InfoModal` owns overlay, panel chrome, tools grid, View on X, and media preview.
- `InfoButton`, Home `SimpleProjectModal`, and ExperimentModal’s info popover all consume it (no duplicated `PopupLine` / `ToolsSection` / View on X markup in those call sites).
- Visual parity with today’s modals (Film Diary / Personal Library screenshots for `default`).
- `/design-system` Components → Modals shows inline specimens for Film Diary and Personal Library.
- Existing fullscreen experiment embeds (`SundaysEmbed`, `GenericExperimentEmbed`, etc.) and Sanity `ProjectModal` are unchanged.

## Scope

**In:**
- New `src/components/InfoModal.tsx` (+ shared types `ToolCategory`, `ProjectInfo`)
- Refactor `InfoButton.tsx` to trigger + open `InfoModal` `default`
- Replace `HomePageClient` `SimpleProjectModal` with `InfoModal` `wide`
- Replace ExperimentModal info popover content with `InfoModal` `compact`
- DS: Modals subsection + TOC entry + specimens

**Out:**
- Sanity case-study `ProjectModal`
- Fullscreen experiment page layouts / embeds
- Animation redesign or new visual language
- Broader Button API extraction (View on X stays as modal-local markup matching SpecButton primary)

## Architecture

```
src/components/InfoModal.tsx     # InfoModal + ToolsSection + PopupLine + types
src/components/InfoButton.tsx    # fixed info trigger; owns open state; renders InfoModal
src/components/HomePageClient.tsx  # SimpleProjectModal → InfoModal wide
src/components/ExperimentModal.tsx # info popover → InfoModal compact
src/components/system/
  tokens.ts                      # tocSubsections.components += "Modals"
  sections/ComponentSection.tsx  # Modals specimens (inline)
```

### Component API

```tsx
export type ToolCategory = { label: string; tools: string[] };

export type ProjectInfo = {
  id: string;
  title: string;
  year: string;
  description: React.ReactNode;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref?: string;
  toolCategories?: ToolCategory[];
};

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
  project: ProjectInfo;
  variant?: "default" | "wide" | "compact";
  /** Extra header actions (Try It Out, sundays.rsvp, …) */
  actions?: React.ReactNode;
  /** Panel only — no portal, scrim, or open animation (DS specimens) */
  inline?: boolean;
  /**
   * Show project description under the title.
   * Defaults: false for `compact`, true for `default` / `wide`.
   */
  showDescription?: boolean;
};
```

`InfoButton` continues to export `ToolCategory` / `ProjectInfo` as re-exports from `InfoModal` for import compatibility.

### Variants

| Variant | Panel | Notes |
|---|---|---|
| `default` | ~6/12 width, `rounded-3xl`, padding matching InfoButton today | Screenshot source of truth |
| `wide` | ~10/12, max-height scroll, larger type where Home modal already differs | `actions` for Try It Out |
| `compact` | ~420px desktop / full-width mobile sheet, tighter padding | ExperimentModal popover. Description hidden by default (`showDescription` defaults to `false` for `compact`, `true` for `default` / `wide`). |

Shared behavior (when not `inline`):
- Portal to `document.body`
- Scrim `bg-zinc-900/20`
- Enter/exit opacity + translate (~300ms)
- ESC + scrim click → `onClose`
- `useScrollLock` while open
- Delayed video mount (~350ms) after open

### Data flow

Call sites own project data (static defaults + Sanity hydration where already present). `InfoModal` is presentational + chrome; it does not fetch.

### Error / edge cases

- Missing `imageSrc`: hide media block (match InfoButton).
- Missing `xLink`: hide View on X.
- Empty `toolCategories`: hide tools + divider.
- `inline` + `open={false}`: render nothing (or allow always-open specimens to pass `open`).

## Design System specimen

- New subsection **Modals** under Components (after Cards or before Loaders — prefer after Cards).
- Two full-width specimens:
  1. **Film Diary** — description + tools + still/preview placeholder
  2. **Personal Library** — tools + preview (description optional/empty to match screenshot)
- Specimens use `inline` + `open` so they sit in the bento without locking page scroll.
- Demo data is hard-coded in `ComponentSection` (no Sanity dependency).
- Update buttons footnote that currently lists “Modal close” / “View on X” as “in use (not shown)” once View on X appears in the modal specimen.

## Testing / verification

- Open info modal from Library / Film fullscreen pages — layout matches pre-refactor.
- Home side-project modal (if still reachable) uses `wide` without visual regression.
- Experiment modal info popover still opens/closes and matches compact density.
- `/design-system` Modals specimens render; TOC jumps to Modals.
- ESC / scrim close still work on live modals; specimens do not trap scroll.

## Implementation notes

- Prefer moving markup out of `InfoButton` first (source of truth for screenshots), then adapt `wide` / `compact` class maps.
- Do not unify Sundays fullscreen embeds into `InfoModal`.
- Keep Mux env key / ShimmerImage / ShimmerVideo usage identical.
