# Filter Dropdown Selection Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the filter dropdown's gray option highlight subtly rounder without changing the panel radius or geometry.

**Architecture:** Keep the existing `FilterDropdown` structure and styling contract. Extend the source-level regression test first, then change the shared option-button radius from 10px to 11px so active and hover states retain identical geometry.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Node test runner

## Global Constraints

- Keep the panel shell at `rounded-xl`.
- Keep panel padding, option padding, width, positioning, typography, and animation unchanged.
- Apply `rounded-[11px]` to every option button, including active and hover states.
- Add no dependencies.

---

### Task 1: Round the Dropdown Selection Highlight

**Files:**
- Modify: `src/components/FilterDropdown.test.ts`
- Modify: `src/components/FilterDropdown.tsx`

**Interfaces:**
- Preserves the existing `FilterDropdown` public props and behavior.
- Changes only the visual border radius of option buttons.

- [ ] **Step 1: Add the failing regression assertion**

In `src/components/FilterDropdown.test.ts`, add:

```typescript
assert.match(source, /rounded-\[11px\]/);
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
```

Expected: FAIL because the component still contains `rounded-[10px]`.

- [ ] **Step 3: Implement the radius change**

In `src/components/FilterDropdown.tsx`, change the option button class:

```typescript
"flex items-center px-3 py-1 rounded-[11px] transition-colors text-left"
```

Do not change the panel's `rounded-xl` class.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test --experimental-strip-types src/components/FilterDropdown.test.ts
npm test
npm run build
```

Expected: all commands exit successfully.

- [ ] **Step 5: Visually verify the open dropdown**

Open the library filter dropdown and confirm:

- The panel shell retains its existing corner radius.
- The gray selected row appears subtly rounder.
- Panel spacing, width, and placement are unchanged.

- [ ] **Step 6: Commit and push**

Commit the implementation and push the existing `fix/dropdown-panel-alignment` branch so PR #256 updates.
