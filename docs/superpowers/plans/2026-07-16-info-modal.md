# Info Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract a reusable `InfoModal`, wire `InfoButton` / ExperimentModal popover / dead Home `SimpleProjectModal` through it, and document Film Diary + Personal Library specimens in the Design System Modals section.

**Architecture:** `InfoModal` owns the white panel (title · year, description, View on X, tools grid, media) plus optional portal/scrim chrome. Call sites own open state and project data. `compact` is rendered `inline` inside ExperimentModal’s anchored dropdown (no centered portal). `wide` preserves the unused Home modal density for completeness; dead Home markup is deleted after extraction.

**Tech Stack:** React 18, TypeScript, Next.js App Router, Tailwind CSS, existing `ShimmerImage` / `ShimmerVideo` / `useScrollLock` / `ArrowUpRight`, node:test for a tiny pure helper.

## Global Constraints

- Visual source of truth for `default`: Film Diary / Personal Library screenshots + current `InfoButton` markup.
- Do not change Sanity `ProjectModal` or fullscreen experiment embeds (`SundaysEmbed`, `GenericExperimentEmbed`, etc.).
- Mux env key stays `e4cc19a78gcf0tbtfmu4m7ruf`.
- `InfoButton` must keep exporting `ToolCategory` / `ProjectInfo` (re-export from `InfoModal`) so existing imports keep working.
- Commits only when the user asks (do not auto-commit unless instructed).
- DS route is `/design-system`.

## File Structure

| File | Responsibility |
|---|---|
| `src/components/InfoModal.tsx` | Types, `resolveShowDescription`, `ToolsSection`, `PopupLine`, View on X, media block, portal chrome, `InfoModal` |
| `src/components/infoModalUtils.ts` | Pure `resolveShowDescription` helper (testable) |
| `src/components/infoModalUtils.test.ts` | node:test coverage for description defaulting |
| `src/components/InfoButton.tsx` | Fixed info trigger + open state; renders `<InfoModal variant="default" />` |
| `src/components/ExperimentModal.tsx` | Replace `InfoPopover` panel with `<InfoModal variant="compact" inline />`; keep anchor + click-outside |
| `src/components/HomePageClient.tsx` | Delete dead `SimpleProjectModal` / local `PopupLine` / `ToolsSection` |
| `src/hooks/useExperimentProject.ts` | Import `ToolCategory` / `ProjectInfo` from `InfoModal` (or keep via `InfoButton` re-export) |
| `src/components/system/tokens.ts` | Add `"Modals"` to `tocSubsections.components` |
| `src/components/system/sections/ComponentSection.tsx` | Modals specimens (Film Diary, Personal Library) |

---

### Task 1: Pure helper + `InfoModal` shell (default panel)

**Files:**
- Create: `src/components/infoModalUtils.ts`
- Create: `src/components/infoModalUtils.test.ts`
- Create: `src/components/InfoModal.tsx`

**Interfaces:**
- Consumes: `ShimmerImage`, `ShimmerVideo`, `ArrowUpRight`, `useScrollLock`, `clsx`
- Produces:
  - `export type ToolCategory = { label: string; tools: string[] }`
  - `export type ProjectInfo = { id: string; title: string; year: string; description: React.ReactNode; imageSrc: string; videoSrc?: string; xLink?: string; tryItOutHref?: string; toolCategories?: ToolCategory[] }`
  - `export type InfoModalVariant = "default" | "wide" | "compact"`
  - `export function resolveShowDescription(variant: InfoModalVariant, showDescription?: boolean): boolean`
  - `export default function InfoModal(props: InfoModalProps): JSX.Element | null`

- [ ] **Step 1: Write the failing test**

Create `src/components/infoModalUtils.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { resolveShowDescription } from "./infoModalUtils.ts";

test("default and wide show description unless overridden", () => {
  assert.equal(resolveShowDescription("default"), true);
  assert.equal(resolveShowDescription("wide"), true);
  assert.equal(resolveShowDescription("default", false), false);
});

test("compact hides description unless overridden", () => {
  assert.equal(resolveShowDescription("compact"), false);
  assert.equal(resolveShowDescription("compact", true), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/components/infoModalUtils.test.ts`  
Expected: FAIL (module not found / export missing)

- [ ] **Step 3: Implement helper + `InfoModal`**

Create `src/components/infoModalUtils.ts`:

```ts
export type InfoModalVariant = "default" | "wide" | "compact";

export function resolveShowDescription(
  variant: InfoModalVariant,
  showDescription?: boolean,
): boolean {
  if (showDescription !== undefined) return showDescription;
  return variant !== "compact";
}
```

Create `src/components/InfoModal.tsx` by lifting the modal body from `InfoButton.tsx` (lines ~17–310): types, `xLogoPath`, `PopupLine`, `ToolsSection`, media block, portal + scrim + enter/exit.

Public props:

```tsx
export type InfoModalProps = {
  open: boolean;
  onClose: () => void;
  project: ProjectInfo;
  variant?: InfoModalVariant;
  actions?: React.ReactNode;
  inline?: boolean;
  showDescription?: boolean;
  /** Optional class on the white panel (ExperimentModal shadow, etc.) */
  className?: string;
};
```

Behavior requirements:
- If `!open`, return `null`.
- `showDescription` resolved via `resolveShowDescription(variant, showDescription)`.
- When `inline`: render only the white panel (no portal, no scrim, no enter animation, no scroll lock). Always “visible”.
- When `!inline`: portal to `document.body`, scrim `bg-zinc-900/20`, opacity/translate enter-exit ~300ms, ESC + scrim → `onClose`, `useScrollLock(open)`, delay video 350ms after open.
- Variant panel classes:
  - `default`: `rounded-3xl w-[calc(100%*6/12)] max-md:w-[95%]` + InfoButton padding (`px-8 max-md:px-6 pt-6 pb-8`, gaps `gap-4 max-md:gap-3`)
  - `wide`: `rounded-[26px] w-[calc(100%*10/12)] max-md:w-full max-h-[90vh] overflow-hidden` with scrollable inner; title `text-xl`; View on X `px-4 py-1.5 text-base` icons 14px (from Home `SimpleProjectModal`)
  - `compact`: `rounded-2xl w-[420px] max-h-[70vh] overflow-auto` desktop; mobile full-width sheet classes from current `InfoPopover`; padding `gap-3 px-5 pt-4 pb-5`; media `rounded-[12px]`; add `shadow-elevated border border-zinc-100` when compact
- Header: title · year; optional description; desktop View on X top-right; mobile View on X under description (default/wide). Compact: View on X always in header row (match InfoPopover — single button, not desktop/mobile split).
- Render `actions` next to View on X on desktop (wide Try It Out pattern); on mobile stack under description when provided.
- Tools: reuse InfoButton `ToolsSection` grid for `default`/`wide`. For `compact`, use tighter InfoPopover/`ToolsSectionCompact` styles (labels zinc-400, values zinc-500/600, `gap-3`, smaller padding). Implement as `ToolsSection` prop `density: "default" | "compact"` rather than a second component.
- Media: only if `project.imageSrc`; same ShimmerImage/ShimmerVideo pattern; compact uses `rounded-[12px]` + `mt-1`, default/wide `rounded-[16px]` + `mt-3`.

Keep the file focused — copy concrete class strings from the three sources; do not invent new radii/colors.

- [ ] **Step 4: Run helper tests + typecheck**

Run:

```bash
node --test --experimental-strip-types src/components/infoModalUtils.test.ts
npx tsc --noEmit
```

Expected: tests PASS; `tsc` clean for new files (existing project errors unrelated to this work should be noted, not “fixed” opportunistically).

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/components/infoModalUtils.ts src/components/infoModalUtils.test.ts src/components/InfoModal.tsx
git commit -m "$(cat <<'EOF'
Extract InfoModal with default/wide/compact panel variants.

EOF
)"
```

---

### Task 2: Wire `InfoButton` through `InfoModal`

**Files:**
- Modify: `src/components/InfoButton.tsx`
- Modify: `src/hooks/useExperimentProject.ts` (import path only if needed)

**Interfaces:**
- Consumes: `InfoModal`, `ProjectInfo`, `ToolCategory` from `./InfoModal`
- Produces: default export `InfoButton`; re-exports `ToolCategory`, `ProjectInfo`

- [ ] **Step 1: Slim `InfoButton` to trigger + state**

Replace modal JSX with:

```tsx
import InfoModal, { type ProjectInfo, type ToolCategory } from "./InfoModal";

export type { ProjectInfo, ToolCategory };

export default function InfoButton({ project }: { project: ProjectInfo }) {
  const [open, setOpen] = useState(false);
  // keep video preload effect from current InfoButton

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-8 right-8 md:right-16 z-50 cursor-pointer transition-colors duration-200 hover:bg-zinc-200/50 rounded-full p-2 -m-1 text-zinc-400"
        aria-label="Project info"
      >
        <InfoIcon />
      </button>
      <InfoModal
        open={open}
        onClose={() => setOpen(false)}
        project={project}
        variant="default"
      />
    </>
  );
}
```

Delete local `PopupLine`, `ToolsSection`, portal modal markup, and duplicate close/animation state that `InfoModal` now owns. Keep preload `useEffect` for video/image on the button component.

- [ ] **Step 2: Verify imports still resolve**

Grep for `from './InfoButton'` / `from "../InfoButton"` / `from '../components/InfoButton'` — ensure `ToolCategory` / `ProjectInfo` still typecheck via re-exports.

Run: `npx tsc --noEmit`

- [ ] **Step 3: Manual verify**

With `npm run dev` (if not already running): open `/library/full` or `/film/full`, click info (i), confirm Film Diary / Personal Library modal matches prior layout (title · year, description, View on X, tools, media). ESC + scrim close work.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/InfoButton.tsx src/hooks/useExperimentProject.ts
git commit -m "$(cat <<'EOF'
Route InfoButton through shared InfoModal.

EOF
)"
```

---

### Task 3: ExperimentModal compact popover → `InfoModal`

**Files:**
- Modify: `src/components/ExperimentModal.tsx`

**Interfaces:**
- Consumes: `InfoModal` with `variant="compact"`, `inline`, `open={true}` while mounted
- Produces: same popover UX (anchored under info button, click-outside, ESC handled by parent)

- [ ] **Step 1: Replace `InfoPopover` body**

Where today:

```tsx
{showInfoModal && (
  <div className="absolute top-full right-0 z-[70] mt-1.5">
    <InfoPopover project={project} onClose={() => setShowInfoModal(false)} isFullscreen={false} />
  </div>
)}
```

Use:

```tsx
{showInfoModal && (
  <div className="absolute top-full right-0 z-[70] mt-1.5" ref={infoPopoverWrapRef}>
    <InfoModal
      open
      inline
      variant="compact"
      project={project}
      onClose={() => setShowInfoModal(false)}
    />
  </div>
)}
```

Move click-outside listener from `InfoPopover` onto this wrapper (ignore clicks on `[data-info-button]`). Keep ESC handling in the parent that already closes `showInfoModal` first.

Delete `InfoPopover`, `ToolsSectionCompact`, and any now-unused local `PopupLine` / `ToolsSection` **only if** nothing else in the file uses them. **Do not delete** `ToolsSection` / `PopupLine` still used by `SundaysEmbed`, `SundaysMobileEmbed`, or `GenericExperimentEmbed`.

Update import: `import type { ToolCategory } from './InfoModal'` (or keep `InfoButton` re-export).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Manual verify**

Open a side project popup (e.g. Film from home → modal, not fullscreen). Click info (i). Confirm anchored compact card (not centered scrim), tools + media, click-outside and toggle close. Fullscreen `/film/full` info button still uses Task 2 `InfoButton` path.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/ExperimentModal.tsx
git commit -m "$(cat <<'EOF'
Use InfoModal compact inline for experiment info popover.

EOF
)"
```

---

### Task 4: Remove dead Home `SimpleProjectModal` duplicates

**Files:**
- Modify: `src/components/HomePageClient.tsx`

**Interfaces:**
- Consumes: none new (side projects already use `ExperimentModal`)
- Produces: smaller HomePageClient; `wide` variant remains available on `InfoModal` for future/DS

- [ ] **Step 1: Confirm dead code**

Confirm `SimpleProjectModal` has no JSX usages (only the function definition). Safe to delete:
- `function PopupLine` (Home-local)
- `function ToolsSection` (Home-local)
- `function SimpleProjectModal`
- `type ProjectModalProps` if only used by SimpleProjectModal

Do **not** remove live experiment project data, `ExperimentModal` mount, or Sanity hydration.

- [ ] **Step 2: Delete the dead block**

Remove the unused functions/types. Fix any imports that become unused (`TryItOutButton` only if it became unused — check other usages in the file first).

- [ ] **Step 3: Typecheck + smoke**

Run: `npx tsc --noEmit`  
Manual: home page still opens side-project `ExperimentModal`.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/HomePageClient.tsx
git commit -m "$(cat <<'EOF'
Remove unused SimpleProjectModal duplicate from HomePageClient.

EOF
)"
```

---

### Task 5: Design System Modals specimens

**Files:**
- Modify: `src/components/system/tokens.ts` (`tocSubsections.components`)
- Modify: `src/components/system/sections/ComponentSection.tsx`

**Interfaces:**
- Consumes: `InfoModal` with `inline` + `open`
- Produces: TOC label `Modals`; two full-width specimens

- [ ] **Step 1: Add TOC entry**

In `tokens.ts`, append `"Modals"` to `tocSubsections.components` (after `"Cards"`):

```ts
components: [
  "Navigation & pills",
  "Inputs",
  "Buttons",
  "Loaders",
  "Cards",
  "Modals",
],
```

- [ ] **Step 2: Add specimens**

In `ComponentSection.tsx`:

1. Import `InfoModal` and demo project shapes.
2. After the Cards block, add:

```tsx
<SubLabel>Modals</SubLabel>
<div className={SPECIMEN_GRID}>
  <Specimen
    label="Info modal · Film Diary"
    span={SPAN_FULL}
    className="!items-start !justify-start !bg-zinc-100 !min-h-0"
  >
    <InfoModal
      open
      inline
      variant="default"
      onClose={() => {}}
      project={FILM_DIARY_SPECIMEN}
    />
  </Specimen>

  <Specimen
    label="Info modal · Personal Library"
    span={SPAN_FULL}
    className="!items-start !justify-start !bg-zinc-100 !min-h-0"
  >
    <InfoModal
      open
      inline
      variant="default"
      onClose={() => {}}
      project={LIBRARY_SPECIMEN}
    />
  </Specimen>
</div>
```

Demo data (hard-coded; no Sanity):

```ts
const FILM_DIARY_SPECIMEN = {
  id: "film",
  title: "Film Diary",
  year: "2026",
  description: "A digital photo timeline, featuring scenes from sundays in la.",
  imageSrc:
    "https://image.mux.com/p66bkVMzjdu5wUtVpCZX41TwUzNOwWEfbSdtVefW9Vw/thumbnail.png?width=1920",
  xLink: "https://x.com/michelletliu",
  toolCategories: [
    { label: "Design", tools: ["Figma"] },
    { label: "Frontend", tools: ["TypeScript", "React", "Framer Motion", "Tailwind CSS"] },
    { label: "Data", tools: ["Notion API"] },
    { label: "AI", tools: ["Cursor", "Opus 4.6"] },
  ],
};

const LIBRARY_SPECIMEN = {
  id: "library",
  title: "Personal Library",
  year: "2025",
  description: "",
  imageSrc:
    "https://image.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo/thumbnail.png?width=1920",
  xLink: "https://x.com/michelletliu",
  toolCategories: [
    { label: "Design", tools: ["Figma"] },
    { label: "Frontend", tools: ["TypeScript", "React", "Vite"] },
    { label: "Styling", tools: ["Tailwind CSS"] },
    { label: "AI", tools: ["Figma Make", "Cursor", "Opus 4.5"] },
  ],
};
```

For Personal Library, pass `showDescription={false}` so an empty description does not leave a blank gap (matches screenshot without subtitle).

3. Update the Buttons footnote to remove “View on X” / “Modal close” from “In use (not shown)” if those are now represented (or leave Modal close if still undocumentated).

Ensure inline panel is `w-full max-w-*` inside the specimen so it does not force `6/12` of the viewport — when `inline`, override width to `w-full` (implement in Task 1: `inline` ⇒ `w-full` instead of `w-[calc(100%*6/12)]`).

- [ ] **Step 3: Verify DS page**

Open `/design-system`, jump to Components → Modals. Confirm both cards render, no body scroll lock, TOC highlight works.

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/system/tokens.ts src/components/system/sections/ComponentSection.tsx src/components/InfoModal.tsx
git commit -m "$(cat <<'EOF'
Document InfoModal Film Diary and Library specimens in the DS.

EOF
)"
```

---

### Task 6: Final verification pass

**Files:** none (QA only)

- [ ] **Step 1: Run automated checks**

```bash
node --test --experimental-strip-types src/components/infoModalUtils.test.ts
npm test
npx tsc --noEmit
```

Expected: helper tests + existing protected-project tests pass.

- [ ] **Step 2: Manual checklist**

| Surface | Check |
|---|---|
| `/film/full` InfoButton | default modal matches screenshot structure |
| `/library/full` InfoButton | default modal; tools + media |
| Home → Film popup → info (i) | compact anchored popover, no full-page scrim |
| `/design-system` → Modals | two inline specimens; TOC “Modals” |
| ESC / scrim | works on InfoButton modal; popover click-outside still works |
| Fullscreen embeds | Sundays / Generic embeds unchanged |

- [ ] **Step 3: Done**

Report any visual deltas vs screenshots; fix only regressions introduced by this work.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| Extract `InfoModal` + types | Task 1 |
| `showDescription` defaults | Task 1 (`resolveShowDescription`) |
| Variants default / wide / compact | Task 1 |
| `inline` for DS | Task 1 + 5 |
| InfoButton uses InfoModal | Task 2 |
| ExperimentModal popover uses compact | Task 3 |
| Home SimpleProjectModal consolidated | Task 4 (delete dead; wide lives on InfoModal) |
| DS Modals TOC + specimens | Task 5 |
| Out of scope: ProjectModal / embeds | Explicitly untouched |
| Re-export types from InfoButton | Task 2 |
