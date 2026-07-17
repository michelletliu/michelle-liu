# Page Description Fade-Up Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the existing description fade-up whenever the Work, Art, or About page header mounts.

**Architecture:** `PageHeader` is the shared owner of all three descriptions, so the fix stays in that component. A focused source regression test follows the repository's existing zero-dependency `node:test` pattern and guards against reintroducing session-based animation suppression.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Node.js test runner

## Global Constraints

- Preserve the existing `projectCardEnter 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both` animation exactly.
- Animate only the existing opacity and transform keyframes.
- Do not change page copy, layout, navigation behavior, dependencies, or broader hero-animation state.
- Do not create a git commit unless the user explicitly requests one.

---

### Task 1: Restore the shared page-description entrance

**Files:**
- Create: `src/components/PageHeader.test.ts`
- Modify: `src/components/PageHeader.tsx:70-85`

**Interfaces:**
- Consumes: `PageHeaderProps.variant` for the keyed Work, Art, and About description wrapper.
- Produces: A description wrapper that always receives the existing `projectCardEnter` animation when mounted.

- [ ] **Step 1: Write the failing regression test**

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./PageHeader.tsx", import.meta.url),
  "utf8",
);

test("replays the description fade-up whenever a page header mounts", () => {
  assert.match(
    source,
    /style=\{\{\s*animation:\s*"projectCardEnter 360ms cubic-bezier\(0\.25, 0\.46, 0\.45, 0\.94\) both",?\s*\}\}/,
  );
  assert.doesNotMatch(
    source,
    /heroAnimationPlayed\s*\?\s*undefined\s*:/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
node --test --experimental-strip-types src/components/PageHeader.test.ts
```

Expected: FAIL because `PageHeader` conditionally omits the animation when `heroAnimationPlayed` is true.

- [ ] **Step 3: Apply the minimal shared-component fix**

Replace the conditional `style` expression on the description wrapper with:

```tsx
style={{
  animation:
    "projectCardEnter 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
}}
```

Leave the keyed wrapper, description content, and all other props unchanged.

- [ ] **Step 4: Run focused and related tests**

Run:

```bash
node --test --experimental-strip-types \
  src/components/PageHeader.test.ts \
  src/components/NavigationTabs.test.ts \
  src/components/about/AboutPage.test.ts
```

Expected: 0 failures.

- [ ] **Step 5: Verify the production build**

Run:

```bash
npm run build
```

Expected: Next.js build exits with code 0 and reports no TypeScript or compilation errors.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git diff --check
git diff -- src/components/PageHeader.tsx src/components/PageHeader.test.ts
```

Expected: No whitespace errors; the production change is limited to restoring the unconditional animation, plus its regression test.
