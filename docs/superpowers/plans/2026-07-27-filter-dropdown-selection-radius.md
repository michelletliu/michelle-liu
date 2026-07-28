# Filter Dropdown Selection Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the filter dropdown's gray option highlight concentric with the panel corners.

**Architecture:** Keep the existing `FilterDropdown` structure. Extend the source-level regression test first, then set the panel to `rounded-2xl` (16px) and option buttons to `rounded-[11px]` so outer − border − padding equals the inner radius.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Node test runner

## Global Constraints

- Panel shell must use `rounded-2xl`.
- Option buttons must use `rounded-[11px]` for active and hover states.
- Keep panel padding, option padding, width, positioning, typography, and animation unchanged.
- Add no dependencies.

---

### Task 1: Make Selection Corners Concentric

**Files:**
- Modify: `src/components/FilterDropdown.test.ts`
- Modify: `src/components/FilterDropdown.tsx`

**Interfaces:**
- Preserves the existing `FilterDropdown` public props and behavior.
- Changes only the panel and option-button border radii.

- [x] **Step 1: Add the failing regression assertions**

In `src/components/FilterDropdown.test.ts`, add:

```typescript
assert.match(source, /rounded-2xl/);
assert.match(source, /rounded-\[11px\]/);
```

- [x] **Step 2: Run the targeted test and verify failure**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
```

Expected: FAIL because the component still contains `rounded-xl` and `rounded-[10px]`.

- [x] **Step 3: Implement the radius changes**

In `src/components/FilterDropdown.tsx`:

1. Change the panel class from `rounded-xl` to `rounded-2xl`.
2. Change the option button class from `rounded-[10px]` to `rounded-[11px]`.

- [x] **Step 4: Run focused and full verification**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
npm test
npm run build
```

Expected: all commands exit successfully.

- [x] **Step 5: Visually verify the open dropdown**

Open the library filter dropdown and confirm:

- The panel shell uses the larger outer radius.
- The gray selected row corners look concentric with the panel.
- Panel spacing, width, and placement are unchanged.

- [x] **Step 6: Commit and push**

Commit the implementation and push the existing `fix/dropdown-panel-alignment` branch so PR #256 updates.
