# Filter Dropdown Panel Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align dropdown option text with the trigger pill while extending the dropdown panel 5px left of the pill and reducing the panel wrapper padding to 4px.

**Architecture:** Keep the existing `FilterDropdown` component and its portal/inline rendering paths. Apply the same 5px horizontal offset in both paths to account for the panel's 1px border, update only the panel wrapper padding, and protect the layout contract with the existing source-level Node test pattern.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Node test runner

## Global Constraints

- Keep trigger pill spacing and typography unchanged.
- Keep option padding at `px-3 py-1`.
- Use `p-1` for the panel's inner wrapper.
- Position the panel edge exactly 5px left of the trigger edge in portal and inline modes.
- Do not change selection, responsive, animation, or accessibility behavior.

---

### Task 1: Align the Filter Dropdown Panel

**Files:**
- Modify: `src/components/FilterDropdown.tsx:36-53,90-139`
- Create: `src/components/FilterDropdown.test.ts`

**Interfaces:**
- Consumes: `HTMLButtonElement.getBoundingClientRect()` and the existing `usePortal: boolean` prop.
- Produces: the existing `FilterDropdown` component with identical public props and behavior.

- [ ] **Step 1: Write the failing regression test**

Create `src/components/FilterDropdown.test.ts`:

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns option text while extending the panel left of the trigger", () => {
  assert.match(source, /const PANEL_LEFT_OFFSET = 5/);
  assert.equal(source.match(/rect\.left - PANEL_LEFT_OFFSET/g)?.length, 3);
  assert.match(source, /absolute -left-\[5px\] top-\[calc\(100%\+4px\)\]/);
  assert.match(source, /flex flex-col gap-1 p-1/);
  assert.match(source, /flex items-center px-3 py-1/);
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
```

Expected: FAIL because the component does not define `PANEL_LEFT_OFFSET` and still uses `rect.left`, `left-0`, and `px-1.5 py-1.5`.

- [ ] **Step 3: Implement the minimal layout change**

In `src/components/FilterDropdown.tsx`:

```typescript
const PANEL_LEFT_OFFSET = 5;
```

Use the offset for both portal measurements:

```typescript
panelRef.current.style.transform = `translate(${rect.left - PANEL_LEFT_OFFSET}px, ${rect.bottom + 4}px)`;
```

```typescript
snapRef.current = { top: rect.bottom + 4, left: rect.left - PANEL_LEFT_OFFSET };
```

Use the offset in the trigger click snapshot:

```typescript
snapRef.current = { top: rect.bottom + 4, left: rect.left - PANEL_LEFT_OFFSET };
```

Update inline positioning and wrapper padding:

```typescript
usePortal ? "fixed" : "absolute -left-[5px] top-[calc(100%+4px)]"
```

```typescript
<div className="flex flex-col gap-1 p-1">
```

Keep each option class unchanged:

```typescript
"flex items-center px-3 py-1 rounded-[10px] transition-colors text-left"
```

- [ ] **Step 4: Run the targeted test to verify it passes**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
```

Expected: 1 test passes, 0 tests fail.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 6: Verify the open dropdown visually**

At desktop and mobile widths, open the Library filter and confirm:

- Option text shares the trigger text's left edge.
- The panel edge is 5px left of the pill edge.
- The wrapper has even 4px padding.
- Selection and closing behavior still work.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/components/FilterDropdown.tsx src/components/FilterDropdown.test.ts docs/superpowers/plans/2026-07-27-filter-dropdown-panel-alignment.md
git commit -m "Fix filter dropdown panel alignment."
```
