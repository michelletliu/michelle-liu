# Squircle Corner Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Round vs Squircle zoomed-corner diagram under shortened copy in the Border Radius Squircle callout.

**Architecture:** Keep everything in `RadiusSection.tsx`. Trim the callout paragraph, then render a two-column grid of SVG corner specimens (same viewBox, different paths) with `Round` / `Squircle` labels. No new files, tokens, or CSS changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, inline SVG.

## Global Constraints

- Diagram sits inside the existing zinc-50 Squircle callout, below the copy
- Two-up grid (`grid-cols-2 gap-4`) on all breakpoints
- Same SVG viewBox/framing for both cells; only the corner path differs
- No guide marks, radius ticks, or “1.7×” on the diagram
- SVGs are decorative (`aria-hidden`); labels carry meaning
- Out of scope: Radius scale cards, `tokens.ts`, `index.css`, new primitives, live `corner-shape` demos

---

## File Structure

| File | Role |
|------|------|
| `src/components/system/sections/RadiusSection.tsx` | Only file to modify — callout copy + diagram |
| `docs/superpowers/specs/2026-07-16-squircle-corner-diagram-design.md` | Spec (reference only) |

---

### Task 1: Shorten Squircle callout copy

**Files:**
- Modify: `src/components/system/sections/RadiusSection.tsx` (callout `<p>` only)
- Spec: `docs/superpowers/specs/2026-07-16-squircle-corner-diagram-design.md`

**Interfaces:**
- Consumes: existing callout markup (`rounded-2xl bg-zinc-50 p-6` + heading)
- Produces: one short paragraph with the same `<code>` styling conventions

- [ ] **Step 1: Replace the callout paragraph**

Replace the existing `<p className="mt-2 max-w-3xl ...">...</p>` with:

```tsx
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-zinc-500 text-pretty">
          Supporting browsers get{" "}
          <code className="font-mono text-zinc-400">corner-shape: squircle</code>{" "}
          globally; radius is bumped ~1.7× so corners don’t look tighter. Circles
          and pills stay <code className="font-mono text-zinc-400">round</code>.
        </p>
```

Keep the heading (`Squircle corner-shape`) unchanged.

- [ ] **Step 2: Visual verify copy**

1. Open `/design-system` → **Border Radius**.
2. Confirm the Squircle callout is one short paragraph and still readable.
3. Confirm Radius scale / Experiment radii are untouched.

- [ ] **Step 3: Commit**

```bash
git add src/components/system/sections/RadiusSection.tsx
git commit -m "$(cat <<'EOF'
Shorten Squircle callout copy on the design system page.

EOF
)"
```

---

### Task 2: Add Round vs Squircle corner diagram

**Files:**
- Modify: `src/components/system/sections/RadiusSection.tsx` (inside Squircle callout, after the `<p>`)
- Spec: `docs/superpowers/specs/2026-07-16-squircle-corner-diagram-design.md`

**Interfaces:**
- Consumes: callout container from Task 1
- Produces: two labeled SVG corner specimens in a `grid grid-cols-2 gap-4`

- [ ] **Step 1: Insert the diagram grid after the paragraph**

Add this block immediately after the callout `<p>`, still inside the zinc-50 `div`:

```tsx
        <div className="mt-6 grid grid-cols-2 gap-4">
          {(
            [
              {
                label: "Round",
                // Circular quarter: from left edge (0,48) to top edge (48,0)
                d: "M 0 48 A 48 48 0 0 1 48 0 H 80 V 80 H 0 Z",
              },
              {
                label: "Squircle",
                // Superellipse-ish cubic: stays fuller near the edges than a circle
                d: "M 0 48 C 0 14 14 0 48 0 H 80 V 80 H 0 Z",
              },
            ] as const
          ).map(({ label, d }) => (
            <div key={label}>
              <div className="aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-zinc-200">
                <svg
                  viewBox="0 0 56 56"
                  className="h-full w-full text-zinc-400"
                  aria-hidden
                >
                  <path d={d} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
```

Notes for the implementer:

- Both paths share the same geometry frame (`80×80` shape, `viewBox="0 0 56 56"` crops to the top-left corner zoom).
- Do not add guide marks, ticks, or multiplier labels.
- Do not use live CSS `corner-shape` for the specimens — SVG paths only (global squircle CSS would otherwise affect a CSS demo unevenly).

- [ ] **Step 2: Visual verify diagram**

1. Open `/design-system` → **Border Radius** → Squircle callout.
2. Confirm:
   - Diagram sits below the shortened copy, inside the zinc-50 card
   - Two equal columns: Round | Squircle
   - Round shows a true circular corner; Squircle looks fuller near the edges / less circular
   - Same zoom framing for both
   - Labels read `Round` and `Squircle`
   - Two-up layout still holds on a narrow viewport
   - Radius scale cards below are unchanged

- [ ] **Step 3: Commit**

```bash
git add src/components/system/sections/RadiusSection.tsx
git commit -m "$(cat <<'EOF'
Add Round vs Squircle corner diagram to Border Radius.

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Diagram below copy, inside zinc-50 callout | Task 2 |
| Two-up `grid-cols-2`, stay two-up on mobile | Task 2 |
| Zoomed top-left Round vs Squircle SVG | Task 2 |
| Same framing; no guide marks / 1.7× on diagram | Task 2 |
| `aria-hidden` SVGs + text labels | Task 2 |
| Shortened one-paragraph copy | Task 1 |
| Out of scope: tokens / index.css / primitives | Both tasks touch only `RadiusSection.tsx` |
