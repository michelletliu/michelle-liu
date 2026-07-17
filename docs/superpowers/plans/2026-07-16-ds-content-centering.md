# DS Content Centering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the Design System `main` column in the full viewport (Liveline-style `max-width` + auto margins) while keeping the desktop TOC in the left gutter.

**Architecture:** Change only the desktop layout row in `SystemPage.tsx`. Take the TOC `aside` out of normal flow (`absolute` in the left gutter of a `relative` full-width row) so it no longer pushes `main` off-center. Give `main` `mx-auto w-full max-w-[720px]`. Preserve sticky / dock-to-footer / logo-clearance behavior on the existing `desktopChromeRef` chrome.

**Tech Stack:** React, TypeScript, Tailwind CSS, Next.js App Router (`/design-system`).

## Global Constraints

- Center relative to the **full viewport**, not the space after an in-flow TOC
- Content measure stays **`max-w-[720px]`**
- Desktop TOC sticky + dock-to-footer + `logoHidden` top collapse must keep working
- Mobile (`< lg`) layout unchanged
- Out of scope: section internals, footer, logo doorway, changing the 720px measure
- Spec: `docs/superpowers/specs/2026-07-16-ds-content-centering-design.md`

---

## File Structure

| File | Role |
|------|------|
| `src/components/system/SystemPage.tsx` | Only file to modify — desktop layout row (`aside` + `main`) |
| `docs/superpowers/specs/2026-07-16-ds-content-centering-design.md` | Spec (reference only) |

---

### Task 1: Absolute TOC gutter + centered main

**Files:**
- Modify: `src/components/system/SystemPage.tsx` (layout row around the comment starting `Desktop: TOC as left rail`, ~lines 849–878)
- Spec: `docs/superpowers/specs/2026-07-16-ds-content-centering-design.md`

**Interfaces:**
- Consumes: existing `desktopChromeRef`, `desktopDocked`, `logoHidden`, `Sidebar`, `navNodes`, `activeId`, `scrollTo`
- Produces: same DOM IDs / scroll targets; only positioning classes change

- [ ] **Step 1: Update the layout comment**

Replace the comment block above the flex row so it matches the new model:

```tsx
        {/*
          Desktop: main is centered in the viewport (max-w-[720px] mx-auto),
          matching Liveline-style equal gutters. TOC is absolute in the left
          gutter so it does not push main off-center. Inner chrome stays sticky
          (top-28 clears fixed logo; top-0 when logo hides) and docks to the
          zone bottom when the footer would collide.
        */}
```

- [ ] **Step 2: Restructure the desktop layout row**

Replace the current row:

```tsx
        <div className="flex items-start gap-12 px-6 pt-24 pb-16 md:px-16 lg:gap-16 lg:pt-28 xl:gap-24">
          {/* self-stretch: tall containing block so sticky has a runway matching main */}
          <aside className="relative hidden w-44 shrink-0 self-stretch lg:block">
            <div
              ref={desktopChromeRef}
              className={`z-50 w-44 transition-[top] duration-200 ease-out ${
                desktopDocked
                  ? "absolute bottom-0 left-0"
                  : logoHidden
                    ? "sticky top-0"
                    : "sticky top-28"
              }`}
            >
              <div className="animate-fade-up">
                <Sidebar nodes={navNodes} activeId={activeId} onSelect={scrollTo} />
              </div>
            </div>
          </aside>

          <main className="min-w-0 w-full flex-1 max-w-[720px]">
```

with:

```tsx
        <div className="relative px-6 pt-24 pb-16 md:px-16 lg:pt-28">
          {/*
            Absolute left gutter: height comes from main (in-flow). Sticky
            chrome needs a tall containing block — inset-y-0 matches main.
          */}
          <aside className="pointer-events-none absolute inset-y-0 left-6 hidden w-44 lg:block md:left-16">
            <div
              ref={desktopChromeRef}
              className={`pointer-events-auto z-50 w-44 transition-[top] duration-200 ease-out ${
                desktopDocked
                  ? "absolute bottom-0 left-0"
                  : logoHidden
                    ? "sticky top-0"
                    : "sticky top-28"
              }`}
            >
              <div className="animate-fade-up">
                <Sidebar nodes={navNodes} activeId={activeId} onSelect={scrollTo} />
              </div>
            </div>
          </aside>

          <main className="relative mx-auto min-w-0 w-full max-w-[720px]">
```

Notes for the implementer:
- Keep `desktopChromeRef` on the inner chrome div — dock math depends on it.
- `pointer-events-none` on the aside + `pointer-events-auto` on chrome prevents an invisible full-height hit strip from blocking content clicks in the left gutter.
- Do not change `main` children, section list, or footer.

- [ ] **Step 3: Visual verify desktop centering**

1. Run the app and open `/design-system` at a wide desktop width (≥1280px).
2. In DevTools, select `main` — confirm computed left/right margins are approximately equal (TOC sits inside the left margin band).
3. Scroll the full page: TOC sticks under the logo, collapses to `top-0` when the logo hides near the footer, and docks above the footer without overlapping it.
4. Click TOC links — scroll spy / navigation still works.
5. Confirm intro + Color grid sit in the centered column with no horizontal overflow.

- [ ] **Step 4: Visual verify mobile unchanged**

1. Resize to a mobile width (`< lg`, e.g. 390px).
2. Confirm desktop TOC is not visible.
3. Confirm sticky mobile section menu still works.
4. Confirm content uses full width within page padding (no odd side gutter from the absolute aside).

- [ ] **Step 5: Commit**

```bash
git add src/components/system/SystemPage.tsx
git commit -m "$(cat <<'EOF'
Center design system content column in the viewport.

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Full-viewport centering via auto margins | Task 1 Step 2 (`main` `mx-auto max-w-[720px]`) |
| TOC in left gutter, not in-flow | Task 1 Step 2 (`aside` absolute) |
| Keep 720px measure | Task 1 Step 2 |
| Sticky / dock / logo clearance | Task 1 Step 2 (classes preserved) + Step 3 verify |
| Mobile unchanged | Task 1 Step 4 |
| Single-file scope | File Structure |
