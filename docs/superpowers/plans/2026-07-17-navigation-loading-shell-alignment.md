# Navigation Loading Shell Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Art and About route-loading shells with the loaded page geometry and remove their round spinner and loading label.

**Architecture:** Add one server-compatible `NavigationLoadingShell` that mirrors the shared `PageHeader` and `NavigationTabs` layout without mounting their interactive client behavior. Art and About route fallbacks provide only the active tab and destination-specific hero/content skeleton variant.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Node test runner.

## Global Constraints

- Match loaded desktop and mobile header, navigation, divider, gutter, and content-start geometry.
- Render no round spinner or loading label.
- Keep skeleton UI non-interactive and `aria-hidden`.
- Preserve immediate route-level loading fallbacks for `/art` and `/about`.
- Do not alter production `PageHeader` or `NavigationTabs` behavior.
- Spec: `docs/superpowers/specs/2026-07-17-navigation-loading-shell-alignment-design.md`

---

## File Structure

- `src/components/NavigationLoadingShell.tsx`: shared static fallback geometry and destination-specific skeletons.
- `src/components/NavigationLoadingShell.test.ts`: source-level regression checks for geometry, active pills, and spinner removal.
- `app/art/loading.tsx`: thin Art fallback wrapper.
- `app/about/loading.tsx`: thin About fallback wrapper.

### Task 1: Shared aligned route-loading shell

**Files:**
- Create: `src/components/NavigationLoadingShell.test.ts`
- Create: `src/components/NavigationLoadingShell.tsx`
- Modify: `app/art/loading.tsx`
- Modify: `app/about/loading.tsx`

**Interfaces:**
- Consumes: `activeTab: "art" | "about"`.
- Produces: `NavigationLoadingShell({ activeTab }: NavigationLoadingShellProps): JSX.Element`.

- [ ] **Step 1: Write the failing source regression test**

Create a Node test that reads the shared shell and both route fallbacks. Assert that:

```ts
assert.doesNotMatch(combinedSource, /LoadingSpinner|animate-spin|Loading\.\.\./);
assert.match(shellSource, /max-md:h-\[210px\] md:h-\[176px\]/);
assert.match(shellSource, /px-16 max-md:px-6/);
assert.match(shellSource, /pb-4 max-md:pb-1\.75/);
assert.match(artSource, /activeTab="art"/);
assert.match(aboutSource, /activeTab="about"/);
```

Also assert that the shell contains three tabs, destination-specific active-pill logic, a divider, desktop sidebar skeleton, and mobile content skeleton.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test --experimental-strip-types src/components/NavigationLoadingShell.test.ts
```

Expected: FAIL because `NavigationLoadingShell.tsx` does not exist and the route fallbacks still import `LoadingSpinner`.

- [ ] **Step 3: Implement the shared static shell**

Create `NavigationLoadingShell.tsx` with:

```tsx
type NavigationLoadingShellProps = {
  activeTab: "art" | "about";
};

const tabs = [
  { id: "work", label: "Work" },
  { id: "art", label: "Art" },
  { id: "about", label: "About" },
] as const;

export default function NavigationLoadingShell({
  activeTab,
}: NavigationLoadingShellProps) {
  // Static, aria-hidden header → nav → destination-shaped content skeleton.
}
```

Mirror the production geometry:

- Header logo band: `px-16 pt-8 pb-8 max-md:px-6 max-md:pt-8 max-md:pb-4`, with `size-8 md:size-11`.
- Hero band: `pb-6 pt-14 px-16 max-md:px-6 max-md:pt-20 max-md:pb-2 max-md:h-[210px] md:h-[176px]`.
- Navigation band: outer `pb-4 max-md:pb-1.75`; tabs inside `pb-0 pt-4 px-16 max-md:px-6`; divider inside `px-16 max-md:px-6 pt-3`.
- Main content: `px-16 max-md:px-6 pt-2`, with a desktop `w-[202px]` sidebar skeleton and destination-shaped content cards.

Use `animate-pulse` on quiet rectangular skeletons only. Do not render text that claims loading progress, a circular shape, or `animate-spin`.

- [ ] **Step 4: Replace route fallbacks with thin wrappers**

`app/art/loading.tsx`:

```tsx
import NavigationLoadingShell from "@/components/NavigationLoadingShell";

export default function ArtLoading() {
  return <NavigationLoadingShell activeTab="art" />;
}
```

`app/about/loading.tsx`:

```tsx
import NavigationLoadingShell from "@/components/NavigationLoadingShell";

export default function AboutLoading() {
  return <NavigationLoadingShell activeTab="about" />;
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test --experimental-strip-types src/components/NavigationLoadingShell.test.ts
```

Expected: PASS with no warnings.

- [ ] **Step 6: Run type and build verification**

Run:

```bash
npx tsc --noEmit
npm run build
```

Expected: both commands exit successfully.

- [ ] **Step 7: Visually verify geometry**

At desktop and mobile widths, navigate Work → Art, Art → About, and About → Work. Confirm the logo, hero, tabs, divider, and content start do not shift between fallback and loaded state; the active loading pill matches the destination; and no spinner or “Loading…” label appears.

Do not create a commit unless the user explicitly requests one.
