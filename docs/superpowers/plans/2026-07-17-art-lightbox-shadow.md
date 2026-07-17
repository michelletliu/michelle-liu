# Art Lightbox Shadow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing light elevated shadow to every image shown in the `/art` lightbox without adding a border or photo frame.

**Architecture:** Keep the change inside the shared `ArtLightbox` component. Apply `shadow-elevated` to the single wrapper that contains the preview, loading state, and full-resolution image so every art category receives one stable shadow.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner

## Global Constraints

- Reuse the existing `shadow-elevated` utility.
- Do not add a border, white frame, padding, or extra background layer.
- Preserve current image sizing, rounded corners, clipping, loading, and transitions.

---

### Task 1: Add the shared art lightbox shadow

**Files:**
- Create: `src/components/art/ArtLightbox.test.ts`
- Modify: `src/components/art/ArtLightbox.tsx:135`

**Interfaces:**
- Consumes: the existing `shadow-elevated` Tailwind utility and shared lightbox image wrapper.
- Produces: a single shadow around artwork, sketchbook, and mural images rendered by `ArtLightbox`.

- [ ] **Step 1: Write the failing source regression test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ArtLightbox.tsx", import.meta.url), "utf8");

test("uses the elevated shadow without adding a lightbox photo frame", () => {
  assert.match(
    source,
    /max-h-\[min\(75vh,820px\)\][^"]*shadow-elevated/,
  );
  assert.doesNotMatch(
    source,
    /max-h-\[min\(75vh,820px\)\][^"]*\b(border|p-[0-9])/,
  );
});
```

- [ ] **Step 2: Run the test and verify the missing shadow fails**

Run:

```bash
node --test --experimental-strip-types src/components/art/ArtLightbox.test.ts
```

Expected: FAIL because the shared image wrapper does not contain `shadow-elevated`.

- [ ] **Step 3: Apply the existing shadow to the shared image wrapper**

Change the wrapper class in `src/components/art/ArtLightbox.tsx` to:

```tsx
<div className="relative max-h-[min(75vh,820px)] max-w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-elevated">
```

Do not modify the preview or full-resolution `<img>` classes. Keeping the shadow on their shared wrapper prevents duplicate shadows during the image-loading transition.

- [ ] **Step 4: Run focused and project verification**

Run:

```bash
node --test --experimental-strip-types src/components/art/ArtLightbox.test.ts
npx tsc --noEmit
```

Expected: the focused test passes and TypeScript reports no errors.

- [ ] **Step 5: Verify the visual result**

Open artwork, sketchbook, and mural entries on `/art` and confirm:

- Each expanded image has one light drop shadow.
- No border, white frame, or extra padding appears.
- The shadow remains stable while the cached preview changes to the full-resolution image.
