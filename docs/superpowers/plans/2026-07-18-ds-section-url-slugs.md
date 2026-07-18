# Design System Section URL Slugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync each top-level Design System section to a path slug (`/design-system/iconography`) on click and scroll-spy, and deep-link into that section on load.

**Architecture:** Keep the single-page `SystemPage` scroll model. Serve it from an optional catch-all App Router segment `app/design-system/[[...slug]]`. Pure helpers in `tokens.ts` map slugified nav labels ↔ existing DOM ids. Client code uses `history.replaceState` (Library pattern) so scroll-spy does not flood the back stack. Overview stays bare `/design-system`.

**Tech Stack:** Next.js App Router, React client components, `history.replaceState`, existing `slugify` / `tocSections`, `node:test` for pure helpers.

## Global Constraints

- Top-level sections only — no subsection path segments.
- Slugs = `slugify(label)` from sidebar labels (`Iconography` → `iconography`).
- Overview → `/design-system` (never `/design-system/overview`).
- URL updates on sidebar click **and** scroll-spy via **replace** (not push).
- Subsection clicks update URL to the **parent** section path only.
- Unknown slug → treat as Overview; do not 404 the whole DS page.
- Do not change existing DOM ids (`icons`, `sub-size`, …).
- `/system` and `/ds` redirects stay pointed at `/design-system`.
- Doorway / logo entry may keep pushing bare `/design-system`.
- Surgical edits only. During implementation, commit only when the user asks (plan Commit steps are optional gates).

## File Structure

| File | Responsibility |
|---|---|
| `src/components/system/tokens.ts` | Path slug helpers derived from `tocSections` |
| `src/components/system/sectionPath.test.ts` | `node:test` coverage for slug ↔ id ↔ path |
| `app/design-system/page.tsx` | **Delete** after move to catch-all |
| `app/design-system/[[...slug]]/page.tsx` | Same metadata + `<SystemPage />`; accepts optional slug segment |
| `app/design-system/loading.tsx` | Unchanged (still covers the `design-system` segment) |
| `src/components/system/SystemPage.tsx` | Deep-link scroll on mount; `replaceState` on click + scroll-spy |

---

### Task 1: Section path helpers

**Files:**
- Modify: `src/components/system/tokens.ts` (after `tocSections` / `slugify`)
- Create: `src/components/system/sectionPath.test.ts`

**Interfaces:**
- Consumes: `tocSections`, `slugify`
- Produces:
  - `export const DESIGN_SYSTEM_BASE_PATH = "/design-system"`
  - `export function sectionPathSlug(sectionId: string): string | null` — path segment for a DOM/nav id; `null` for Overview (`intro`) or unknown
  - `export function sectionIdFromPathSlug(slug: string): string | null` — DOM id for a path segment; `null` if unknown
  - `export function pathForSectionId(sectionId: string): string` — `/design-system` or `/design-system/<slug>`

- [ ] **Step 1: Write the failing test**

Create `src/components/system/sectionPath.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  DESIGN_SYSTEM_BASE_PATH,
  pathForSectionId,
  sectionIdFromPathSlug,
  sectionPathSlug,
  tocSections,
} from "./tokens.ts";

test("Overview has no path slug and maps to the bare base path", () => {
  assert.equal(sectionPathSlug("intro"), null);
  assert.equal(pathForSectionId("intro"), DESIGN_SYSTEM_BASE_PATH);
  assert.equal(sectionIdFromPathSlug("overview"), null);
});

test("Iconography slugifies the label, not the DOM id", () => {
  assert.equal(sectionPathSlug("icons"), "iconography");
  assert.equal(sectionIdFromPathSlug("iconography"), "icons");
  assert.equal(pathForSectionId("icons"), "/design-system/iconography");
});

test("every toc section round-trips label slug ↔ id (Overview excluded from slug)", () => {
  for (const { id, label } of tocSections) {
    if (id === "intro") {
      assert.equal(sectionPathSlug(id), null);
      continue;
    }
    const slug = sectionPathSlug(id);
    assert.ok(slug);
    assert.equal(slug, label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    assert.equal(sectionIdFromPathSlug(slug!), id);
    assert.equal(pathForSectionId(id), `${DESIGN_SYSTEM_BASE_PATH}/${slug}`);
  }
});

test("unknown slug and unknown id are safe", () => {
  assert.equal(sectionIdFromPathSlug("not-a-section"), null);
  assert.equal(sectionPathSlug("not-a-section"), null);
  assert.equal(pathForSectionId("not-a-section"), DESIGN_SYSTEM_BASE_PATH);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/components/system/sectionPath.test.ts`

Expected: FAIL (helpers not exported / not defined).

- [ ] **Step 3: Implement helpers**

In `src/components/system/tokens.ts`, after `slugify` / near `tocSections`, add:

```ts
export const DESIGN_SYSTEM_BASE_PATH = "/design-system";

/** Path segment for a section DOM id. Overview (`intro`) → null. */
export function sectionPathSlug(sectionId: string): string | null {
  const section = tocSections.find((s) => s.id === sectionId);
  if (!section || section.id === "intro") return null;
  return slugify(section.label);
}

/** DOM id for a path slug, or null if unknown / Overview-like. */
export function sectionIdFromPathSlug(slug: string): string | null {
  if (!slug) return null;
  const section = tocSections.find(
    (s) => s.id !== "intro" && slugify(s.label) === slug,
  );
  return section?.id ?? null;
}

/** Full pathname for a section DOM id. Unknown / Overview → bare base. */
export function pathForSectionId(sectionId: string): string {
  const slug = sectionPathSlug(sectionId);
  return slug ? `${DESIGN_SYSTEM_BASE_PATH}/${slug}` : DESIGN_SYSTEM_BASE_PATH;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/components/system/sectionPath.test.ts`

Expected: PASS (all tests).

- [ ] **Step 5: Commit (optional — only if user asked)**

```bash
git add src/components/system/tokens.ts src/components/system/sectionPath.test.ts
git commit -m "$(cat <<'EOF'
Add design-system section path slug helpers.

EOF
)"
```

---

### Task 2: Optional catch-all route

**Files:**
- Create: `app/design-system/[[...slug]]/page.tsx`
- Delete: `app/design-system/page.tsx`
- Leave: `app/design-system/loading.tsx` (no move required)

**Interfaces:**
- Consumes: `SystemPage` default export
- Produces: App Router handles `/design-system` and `/design-system/*` with the same page shell. Client reads `window.location.pathname` for the slug (no required prop on `SystemPage`).

- [ ] **Step 1: Add catch-all page**

Create `app/design-system/[[...slug]]/page.tsx` with the same contents as today’s `app/design-system/page.tsx`:

```tsx
import type { Metadata } from "next";
import SystemPage from "@/components/system/SystemPage";

export const metadata: Metadata = {
  title: "Design System | michelle liu",
  description:
    "The complete visual language of liumichelle.com — colors, typography, shadows, radii, spacing, materials, motion, components, and experiments.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SystemPage />;
}
```

- [ ] **Step 2: Remove the old flat page**

Delete `app/design-system/page.tsx` so Next does not conflict with the catch-all.

- [ ] **Step 3: Smoke-check routes resolve**

With the dev server running:

1. Open `/design-system` — page loads (Overview).
2. Open `/design-system/iconography` — page loads (same shell; scroll wire-up is Task 3).
3. Open `/ds` and `/system` — still redirect to `/design-system`.

Expected: no 404 for valid catch-all paths; loading shell still appears when navigating into DS.

- [ ] **Step 4: Commit (optional — only if user asked)**

```bash
git add app/design-system/[[...slug]]/page.tsx
git rm app/design-system/page.tsx
git commit -m "$(cat <<'EOF'
Serve design-system from an optional catch-all route.

EOF
)"
```

---

### Task 3: Sync URL + deep-link scroll in SystemPage

**Files:**
- Modify: `src/components/system/SystemPage.tsx`

**Interfaces:**
- Consumes: `pathForSectionId`, `sectionIdFromPathSlug`, `DESIGN_SYSTEM_BASE_PATH` from `./tokens`
- Produces: client URL sync + deep-link scroll behavior (no new exports)

- [ ] **Step 1: Import helpers and add a path replace utility**

Near the top of `SystemPage.tsx`, extend the tokens import:

```ts
import {
  tocSections,
  tocSubsections,
  subSlug,
  pathForSectionId,
  sectionIdFromPathSlug,
  DESIGN_SYSTEM_BASE_PATH,
} from "./tokens";
```

Inside `SystemPage` (before `scrollTo`), add:

```ts
const replaceDesignSystemPath = (sectionId: string) => {
  const nextPath = pathForSectionId(sectionId);
  if (typeof window === "undefined") return;
  if (window.location.pathname === nextPath) return;
  window.history.replaceState(null, "", nextPath);
};
```

- [ ] **Step 2: Deep-link on mount (skip forced top scroll when slug present)**

Replace the existing mount effect that always does `window.scrollTo(0, 0)` with logic that:

1. Still sets `returnHref`, `router.prefetch`, `warmDoorwayReturn`.
2. Reads the first path segment after `/design-system`.
3. If there is **no** slug (bare `/design-system`) → `window.scrollTo(0, 0)` as today.
4. If slug is **unknown** → `history.replaceState` to `DESIGN_SYSTEM_BASE_PATH` and scroll top.
5. If slug is **known** → resolve `sectionId`, set `activeSection` / clear `activeSub`, then poll/`requestAnimationFrame` until `document.getElementById(sectionId)` exists (dynamic sections), then `el.scrollIntoView({ behavior: "instant" as ScrollBehavior /* or "auto" */, block: "start" })`. Cap retries (~2s) so a missing id cannot loop forever.

Sketch:

```ts
useEffect(() => {
  const href = getDoorwayReturnPath();
  setReturnHref(href);
  router.prefetch(href);
  warmDoorwayReturn(href);

  const parts = window.location.pathname
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);
  // ["design-system"] or ["design-system", "iconography", ...]
  const slug = parts[0] === "design-system" ? parts[1] : undefined;

  if (!slug) {
    window.scrollTo(0, 0);
    return;
  }

  const sectionId = sectionIdFromPathSlug(slug);
  if (!sectionId) {
    window.history.replaceState(null, "", DESIGN_SYSTEM_BASE_PATH);
    window.scrollTo(0, 0);
    return;
  }

  setActiveSection(sectionId);
  setActiveSub(null);

  let cancelled = false;
  const started = performance.now();
  const tryScroll = () => {
    if (cancelled) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    if (performance.now() - started > 2000) return;
    requestAnimationFrame(tryScroll);
  };
  tryScroll();

  return () => {
    cancelled = true;
  };
}, [router]);
```

Use `behavior: "auto"` (not smooth) for deep links so the landing position is immediate.

- [ ] **Step 3: Update `scrollTo` to replace the parent section path**

```ts
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (subToSection[id]) {
    const parent = subToSection[id];
    setActiveSection(parent);
    setActiveSub(id);
    replaceDesignSystemPath(parent);
  } else {
    setActiveSection(id);
    setActiveSub(null);
    replaceDesignSystemPath(id);
  }
};
```

- [ ] **Step 4: Sync path when scroll-spy changes `activeSection`**

Add an effect that runs when `activeSection` changes:

```ts
useEffect(() => {
  replaceDesignSystemPath(activeSection);
}, [activeSection]);
```

Do **not** also rewrite on `activeSub` alone — subsection highlight must not add a second path segment. The `replaceDesignSystemPath` guard already no-ops when the path matches.

Note: the deep-link mount effect sets `activeSection` before/around first paint; the spy effect will `replaceState` to the same path (no-op). After unknown-slug reset to Overview, `activeSection` should already be `intro` or get set via spy — ensure unknown slug path leaves `activeSection` as Overview (`intro`).

- [ ] **Step 5: Manual verification**

With the dev server:

1. Click **Iconography** → URL becomes `/design-system/iconography`; page scrolls to icons.
2. Click **Size** (subsection) → URL stays `/design-system/iconography` (no `/size`).
3. Scroll through Color → Components → URL updates via replace; Back button does **not** step through every section.
4. Paste `/design-system/iconography` in a new tab → lands on Iconography (after dynamic chunk if needed).
5. Visit `/design-system/not-real` → ends on `/design-system` at Overview.
6. Doorway / logo into DS → `/design-system` at top.
7. `/ds` and `/system` still redirect correctly.

- [ ] **Step 6: Commit (optional — only if user asked)**

```bash
git add src/components/system/SystemPage.tsx
git commit -m "$(cat <<'EOF'
Sync design-system section slugs in the URL on scroll and click.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Top-level slugs from nav labels | Task 1 |
| Overview bare path | Task 1 + Task 3 |
| Catch-all single page | Task 2 |
| Click updates URL | Task 3 Step 3 |
| Scroll-spy updates URL via replace | Task 3 Step 4 |
| Subsection → parent path only | Task 3 Step 3 |
| Deep link scrolls after mount / dynamic | Task 3 Step 2 |
| Unknown slug → Overview | Task 3 Step 2 |
| `/ds`, `/system` unchanged | Task 2 smoke + existing `next.config.ts` |
| Doorway stays bare `/design-system` | No change to `DesignSystemLogoLink` |

## Self-review notes

- No subsection routing tasks (explicitly out of scope).
- Helpers use `slugify(label)` so Iconography ≠ `icons` in the path.
- `replaceState` mirrors Library; avoids Next scroll-reset quirks from `router.replace`.
- Deep-link wait loop covers `dynamic()` Icon/Component/Motion/Material sections.
