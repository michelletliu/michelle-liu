# Contact Badge Base Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Work homepage green contact CTA `text-base` and fade intro copy to 20% opacity when the badge expands.

**Architecture:** Keep the existing `ContactBadge` size API. On the Work homepage only, pass `size="md"` and lower the expanded intro-copy opacity from `opacity-40` to `opacity-20`. Protect the pairing with a source-level Node regression test.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Node test runner

## Global Constraints

- Only change the Work homepage header pairing in `HomePageClient.tsx`.
- Do not change About-page / scroll-expand badge defaults.
- Expanded intro-copy opacity must be exactly `opacity-20`.
- Work-page `ContactBadge` must receive `size="md"`.

---

### Task 1: Work Header Badge Size And Fade

**Files:**
- Modify: `src/components/HomePageClient.tsx`
- Create: `src/components/HomePageClient.contact-badge.test.ts`

**Interfaces:**
- Consumes: existing `ContactBadge` props `size?: "sm" | "md"`, `hoverMode`, `onExpandedChange`.
- Produces: Work homepage header with base-size badge text and deeper intro fade.

- [ ] **Step 1: Write the failing regression test**

Create `src/components/HomePageClient.contact-badge.test.ts`:

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");

test("uses base-size contact badge and deeper intro fade on Work", () => {
  assert.match(source, /isContactBadgeExpanded \? "opacity-20" : "opacity-100"/);
  assert.match(
    source,
    /<ContactBadge[\s\S]*?size="md"[\s\S]*?onExpandedChange=\{setIsContactBadgeExpanded\}/,
  );
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
node --test --experimental-strip-types src/components/HomePageClient.contact-badge.test.ts
```

Expected: FAIL because the source still uses `opacity-40` and does not pass `size="md"`.

- [ ] **Step 3: Implement the minimal Work-header change**

In `src/components/HomePageClient.tsx`, update the intro-copy opacity class:

```tsx
isContactBadgeExpanded ? "opacity-20" : "opacity-100",
```

And pass medium size to the badge:

```tsx
<ContactBadge
  hoverMode
  size="md"
  className="max-md:hidden"
  onExpandedChange={setIsContactBadgeExpanded}
/>
```

- [ ] **Step 4: Run the targeted test to verify it passes**

Run:

```bash
node --test --experimental-strip-types src/components/HomePageClient.contact-badge.test.ts
```

Expected: 1 test passes, 0 tests fail.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the implementation**

```bash
git add \
  src/components/HomePageClient.tsx \
  src/components/HomePageClient.contact-badge.test.ts \
  docs/superpowers/specs/2026-07-27-contact-badge-base-size-design.md \
  docs/superpowers/plans/2026-07-27-contact-badge-base-size.md
git commit -m "$(cat <<'EOF'
Make Work contact badge base size and deepen intro fade.

EOF
)"
```
