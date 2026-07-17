# Font Families Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the four typography font families as `TokenCard`s in a responsive grid on the design system page.

**Architecture:** Replace the Families divided list in `TypographySection` with the existing `Grid` + `TokenCard` primitives used by Borders, Radius, and Shadows. Specimen renders each family name in its own face; stack and usage sit below the zinc-50 tile. No token data or new components.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing system-page primitives (`Grid`, `TokenCard`, `TagChip`, `SubLabel`).

## Global Constraints

- Reuse `TokenCard` and `Grid` only — no custom font-card component
- Grid `min="220px"`
- Specimen uses `fontFamily: f.fontFamily ?? f.stack`
- Tag visibility follows existing `uniformTag(fontFamilies)` logic
- Out of scope: Scale, Weights, Tracking, Leading; `tokens.ts` data changes

---

## File Structure

| File | Role |
|------|------|
| `src/components/system/sections/TypographySection.tsx` | Only file to modify — Families subsection markup |
| `src/components/system/primitives.tsx` | Unchanged — provides `Grid`, `TokenCard` |
| `src/components/system/tokens.ts` | Unchanged — `fontFamilies` data source |

---

### Task 1: Families list → TokenCard grid

**Files:**
- Modify: `src/components/system/sections/TypographySection.tsx`
- Spec: `docs/superpowers/specs/2026-07-16-font-families-cards-design.md`

**Interfaces:**
- Consumes: `fontFamilies` from `../tokens`; `Grid`, `TokenCard` from `../primitives`; existing `familiesTag = uniformTag(fontFamilies)`
- Produces: Families subsection rendered as four `TokenCard`s in `<Grid min="220px">`

- [ ] **Step 1: Update imports**

In `TypographySection.tsx`, change the primitives import from:

```tsx
import { Section, SubLabel, RowList, TokenRow, TagChip } from "../primitives";
```

to:

```tsx
import {
  Section,
  SubLabel,
  RowList,
  TokenRow,
  TagChip,
  Grid,
  TokenCard,
} from "../primitives";
```

(`TagChip` stays — still used by Scale / Weights / Tracking.)

- [ ] **Step 2: Replace Families list with Grid + TokenCard**

Replace the block immediately after the Families `SubLabel` (the `divide-y` list) with:

```tsx
      <Grid min="220px">
        {fontFamilies.map((f) => (
          <TokenCard
            key={f.name}
            name={f.name}
            tag={familiesTag ? undefined : f.tag}
            value={f.stack}
            usage={f.usage}
            sample={
              <span
                className="text-3xl text-zinc-700"
                style={{ fontFamily: f.fontFamily ?? f.stack }}
              >
                {f.name}
              </span>
            }
          />
        ))}
      </Grid>
```

Leave the Families `SubLabel` (note + `tag={familiesTag}`) unchanged. Leave Scale / Weights / Tracking / Leading unchanged.

- [ ] **Step 3: Visual verify on design system page**

1. Ensure the app is running (or start with `npm run dev`).
2. Open `/design-system` and scroll to **Typography → Families**.
3. Confirm:
   - Four cards in a responsive grid (~2×2 on desktop)
   - Each specimen tile shows the family name in that typeface (Figtree/Michelle, SF Pro, Courier New, SF Mono)
   - CSS stack appears as mono `value` under the name
   - Usage notes are present
   - Per-card Canonical / Experiment tags show when tags are not uniform (today: mixed → tags on cards; section-level tag omitted)
   - Scale and below still look like before

- [ ] **Step 4: Commit**

```bash
git add src/components/system/sections/TypographySection.tsx
git commit -m "$(cat <<'EOF'
Show typography font families as TokenCards.

EOF
)"
```

Only commit if the user asked for a commit in this session; otherwise stop after Step 3 and report done.

---

## Self-Review

1. **Spec coverage:** Grid + TokenCard, specimen face, stack/value, usage, tag logic, Families-only scope — all in Task 1.
2. **Placeholders:** None.
3. **Type consistency:** Uses existing `fontFamilies` fields (`name`, `stack`, `usage`, `tag`, `fontFamily?`) and `TokenCard` props (`sample`, `name`, `tag`, `value`, `usage`).
