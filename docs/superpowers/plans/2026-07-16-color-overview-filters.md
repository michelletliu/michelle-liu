# Color Overview Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add group highlight filters above the Color overview swatch grid that preview on hover and pin on click, dimming non-matching swatches to 50% opacity.

**Architecture:** Keep everything in `ColorSection.tsx`. Tag each overview swatch with its source `groupId` during flatten/de-dupe. Local `hoveredGroupId` + `pinnedGroupId` drive filter text color and swatch opacity. No shared component; do not change `FilterPills`.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing `colorGroups` from `tokens.ts`.

## Global Constraints

- Filters use existing `colorGroups` labels/ids only — no hue taxonomy, no `tokens.ts` changes
- Effective highlight = `hoveredGroupId ?? pinnedGroupId`
- Non-matching swatches: 50% opacity; matches: 100%; never hide or reorder
- Hover previews; click pins; click same label again clears pin
- Focus mirrors hover for keyboard
- Out of scope: `FilterPills`, detailed lists below the overview

---

## File Structure

| File | Role |
|------|------|
| `src/components/system/sections/ColorSection.tsx` | Only file to modify — overview flatten, filter row, opacity |
| `src/components/system/tokens.ts` | Unchanged — `colorGroups` data source |
| `src/components/FilterPills.tsx` | Unchanged |

---

### Task 1: Tag overview colors with groupId

**Files:**
- Modify: `src/components/system/sections/ColorSection.tsx`
- Spec: `docs/superpowers/specs/2026-07-16-color-overview-filters-design.md`

**Interfaces:**
- Consumes: `colorGroups`, `ColorToken` from `../tokens`
- Produces: `allUniqueColors(): Array<ColorToken & { groupId: string }>` — de-duped by hex, first group wins; includes base + tab colors

- [ ] **Step 1: Replace `allUniqueColors` to attach `groupId`**

Replace the existing `allUniqueColors` helper with:

```tsx
type OverviewColor = ColorToken & { groupId: string };

/** Flatten every group (including case-study tabs), de-dupe by hex. First group wins. */
function allUniqueColors(): OverviewColor[] {
  const seen = new Set<string>();
  const result: OverviewColor[] = [];

  for (const group of colorGroups) {
    const colors = [
      ...group.colors,
      ...(group.tabs?.flatMap((tab) => tab.colors) ?? []),
    ];
    for (const c of colors) {
      const key = c.value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ ...c, groupId: group.id });
    }
  }

  return result;
}
```

- [ ] **Step 2: Smoke-check membership mentally / in console**

Expected group membership after de-dupe:
- `zinc` → zinc scale + white
- `accent` → blue-*
- `cms` → pink defaults + Adobe / NASA / Roblox tab colors
- `status` → emerald / green / red
- `gradients-color` → header + text gradient stops

No commit yet — Task 2 wires the UI that uses this.

---

### Task 2: Filter row + hover/pin highlight

**Files:**
- Modify: `src/components/system/sections/ColorSection.tsx`

**Interfaces:**
- Consumes: `OverviewColor[]` from `allUniqueColors()`; `colorGroups` for filter labels
- Produces: Filter row + dimmed overview grid in `ColorSection`

- [ ] **Step 1: Add highlight state and filter handlers in `ColorSection`**

Replace the `ColorSection` body with state-driven overview rendering:

```tsx
export default function ColorSection() {
  const overviewColors = allUniqueColors();
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [pinnedGroupId, setPinnedGroupId] = useState<string | null>(null);
  const activeGroupId = hoveredGroupId ?? pinnedGroupId;

  const togglePin = (groupId: string) => {
    setPinnedGroupId((current) => (current === groupId ? null : groupId));
  };

  return (
    <Section id="color" title="Color">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {colorGroups.map((group) => {
          const isActive = activeGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => togglePin(group.id)}
              onMouseEnter={() => setHoveredGroupId(group.id)}
              onMouseLeave={() => setHoveredGroupId(null)}
              onFocus={() => setHoveredGroupId(group.id)}
              onBlur={() => setHoveredGroupId(null)}
              className={`font-['Michelle',sans-serif] text-base font-medium tracking-wide transition-colors duration-200 ease-out ${
                isActive ? "text-zinc-700" : "text-zinc-400"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      <div
        className="mb-16 grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}
      >
        {overviewColors.map((c) => {
          const dimmed = activeGroupId !== null && c.groupId !== activeGroupId;
          return (
            <ColorSwatch
              key={c.name + c.value}
              name={c.name}
              value={c.value}
              className={`aspect-square w-full transition-opacity duration-200 ease-out ${
                dimmed ? "opacity-50" : "opacity-100"
              }`}
            />
          );
        })}
      </div>

      <div className="space-y-24">
        {colorGroups.map((group) =>
          group.tabs ? (
            <CaseStudyColorGroup key={group.id} group={group} />
          ) : (
            <div key={group.id}>
              <SubLabel note={group.note} tag={uniformTag(group.colors)}>
                {group.label}
              </SubLabel>

              <RowList>
                {group.colors.map((c) => (
                  <ColorRow
                    key={c.name + c.value}
                    color={c}
                    groupTag={uniformTag(group.colors)}
                  />
                ))}
              </RowList>
            </div>
          ),
        )}
      </div>
    </Section>
  );
}
```

Note: `ColorSwatch` already merges `className` onto the button. Ensure the default `h-10 w-10` is overridden by `aspect-square w-full` as today. Opacity classes on the button are correct for dimming.

- [ ] **Step 2: Verify visually on `/design-system` (or `/system`)**

Run the existing dev server (or `npm run dev` if none is running). Open the Color section.

Checklist:
1. Five filters: Zinc, Blue, Case studies, Status, Gradient stops
2. Default: muted labels, all swatches full opacity
3. Hover Zinc → Zinc label darkens; non-zinc swatches at ~50%
4. Leave hover with nothing pinned → all full opacity again
5. Click Blue → pin sticks after mouse leaves; non-blue at 50%
6. Click Blue again → pin clears
7. Click Case studies, then Status → pin switches
8. Tab to a filter → focus previews like hover
9. Click a swatch → still copies hex
10. Detailed lists below unchanged

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/components/system/sections/ColorSection.tsx docs/superpowers/specs/2026-07-16-color-overview-filters-design.md docs/superpowers/plans/2026-07-16-color-overview-filters.md
git commit -m "$(cat <<'EOF'
Add Color overview group highlight filters.

Preview on hover and pin on click so matching swatches stay full opacity while others dim.
EOF
)"
```
