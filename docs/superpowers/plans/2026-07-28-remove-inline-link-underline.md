# Remove Inline Link Underlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the persistent underline from every link that uses `INLINE_LINK_CLASS` while keeping inherited color and blue hover/focus feedback.

**Architecture:** Update the shared Tailwind class string in `inlineLink.ts` and lock the new contract in `inlineLink.test.ts`. All three consumers inherit the change automatically.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner

## Global Constraints

- Touch only `src/components/inlineLink.ts` and `src/components/inlineLink.test.ts` for the behavior change.
- Do not change component-specific links, icons, layout, or copy.
- Preserve `text-inherit`, blue hover/focus, `rounded-sm`, and the 200ms ease-out color transition.

---

### Task 1: Remove underline from shared inline link class

**Files:**
- Modify: `src/components/inlineLink.test.ts`
- Modify: `src/components/inlineLink.ts`
- Test: `src/components/inlineLink.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `INLINE_LINK_CLASS` string without `underline` or `underline-offset-2`

- [ ] **Step 1: Update the test to require an underline-free class**

Replace the underline assertions in `src/components/inlineLink.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { INLINE_LINK_CLASS } from "./inlineLink.ts";

test("inline editorial links inherit color and use the blue interaction accent", () => {
  assert.match(INLINE_LINK_CLASS, /\btext-inherit\b/);
  assert.match(INLINE_LINK_CLASS, /\bhover:text-blue-500\b/);
  assert.match(INLINE_LINK_CLASS, /\bfocus-visible:text-blue-500\b/);
  assert.match(INLINE_LINK_CLASS, /\btransition-colors\b/);
  assert.match(INLINE_LINK_CLASS, /\bduration-200\b/);
  assert.match(INLINE_LINK_CLASS, /\bease-out\b/);
  assert.doesNotMatch(INLINE_LINK_CLASS, /\bunderline\b/);
  assert.doesNotMatch(INLINE_LINK_CLASS, /\bunderline-offset-/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test --experimental-strip-types src/components/inlineLink.test.ts`

Expected: FAIL because the class still contains `underline` / `underline-offset-2`

- [ ] **Step 3: Remove underline utilities from the shared class**

Update `src/components/inlineLink.ts` to:

```ts
/** Editorial text link: inherits its context and uses the site's blue accent. */
export const INLINE_LINK_CLASS =
  "rounded-sm text-inherit transition-colors duration-200 ease-out hover:text-blue-500 focus-visible:text-blue-500";
```

- [ ] **Step 4: Re-run the focused test and confirm it passes**

Run: `node --test --experimental-strip-types src/components/inlineLink.test.ts`

Expected: PASS

- [ ] **Step 5: Run the full suite and production build**

Run: `npm test && npm run build`

Expected: tests pass; build completes successfully

- [ ] **Step 6: Commit**

```bash
git add src/components/inlineLink.ts src/components/inlineLink.test.ts docs/superpowers/plans/2026-07-28-remove-inline-link-underline.md
git commit -m "$(cat <<'EOF'
Remove underline from shared inline links.

EOF
)"
```
