# Button Variants Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered Buttons specimens on `/design-system` with a full-width matrix (variant × size × content) plus an interactive playground, and keep the glass callout separate.

**Architecture:** Keep `SpecButton` and its class maps as the canonical DS patterns. Add two local client specimens in `ComponentSection.tsx` — `ButtonMatrixSpecimen` (FilterPills content mode + table) and `ButtonPlaygroundSpecimen` (FilterPills for variant / size / content / surface + live preview). `LiquidGlassButton` stays a third full-width specimen. No shared Button API extraction.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, existing `FilterPills`, `SpecButton`, `LiquidGlassButton`, `Chevron` / `ArrowUpRight` / `SendIcon`.

## Global Constraints

- Specimens encode site class patterns (not a shared Button API) — keep SubLabel note.
- Do not extract a site-wide `Button` component.
- No disabled / loading / destructive state matrices.
- Glass is `LiquidGlassButton`, not a SpecButton prop.
- Commits only when the user asks (do not auto-commit unless instructed).
- DS route is `/design-system`.
- Reuse existing specimen chrome (`Specimen`, `SPECIMEN_GRID`, zinc-50 cards).

## File Structure

| File | Responsibility |
|---|---|
| `src/components/system/sections/ComponentSection.tsx` | `SpecButton` (keep), `ButtonMatrixSpecimen`, `ButtonPlaygroundSpecimen`, rewrite Buttons subsection |
| `docs/superpowers/specs/2026-07-16-button-variants-display-design.md` | Design source of truth (already written) |

No new files required. Optional tiny pure helper only if caption formatting gets non-trivial; prefer inline caption strings.

---

### Task 1: `ButtonMatrixSpecimen`

**Files:**
- Modify: `src/components/system/sections/ComponentSection.tsx` (add helper + component above the main export; wire later in Task 3)

**Interfaces:**
- Consumes: `SpecButton`, `FilterPills`, `ArrowUpRight`, `Chevron`, `SendIcon`, `iconSize`, existing `SpecButtonVariant` / `SpecButtonSize`
- Produces: `function ButtonMatrixSpecimen(): JSX.Element`

- [ ] **Step 1: Add axis constants and content renderer near `SpecButton`**

Place after `SpecButton` (before `SpecimenInfoIcon`):

```tsx
const SPEC_BUTTON_VARIANTS: SpecButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
];
const SPEC_BUTTON_SIZES: SpecButtonSize[] = ["sm", "md", "lg"];

type SpecButtonContent = "label" | "icon-label" | "icon";

const MATRIX_CONTENT_OPTIONS = [
  { value: "label", label: "Label" },
  { value: "icon-label", label: "Icon + label" },
  { value: "icon", label: "Icon" },
];

function SpecButtonSample({
  variant,
  size,
  content,
}: {
  variant: SpecButtonVariant;
  size: SpecButtonSize;
  content: SpecButtonContent;
}) {
  if (content === "icon") {
    return (
      <SpecButton variant={variant} size={size} icon aria-label="Send">
        <SendIcon className="-ml-0.5 w-5 pt-0.5" />
      </SpecButton>
    );
  }

  if (content === "icon-label") {
    return (
      <SpecButton
        variant={variant}
        size={size}
        className={size === "sm" ? "gap-1" : "gap-1.5"}
      >
        <span>Continue</span>
        {variant === "secondary" ? (
          <Chevron direction="right" size={iconSize("inline")} />
        ) : (
          <ArrowUpRight size="12px" />
        )}
      </SpecButton>
    );
  }

  return (
    <SpecButton variant={variant} size={size}>
      Label
    </SpecButton>
  );
}
```

- [ ] **Step 2: Implement `ButtonMatrixSpecimen`**

```tsx
function ButtonMatrixSpecimen() {
  const [content, setContent] = useState<SpecButtonContent>("label");

  return (
    <div className="flex w-full flex-col items-stretch gap-6">
      <FilterPills
        options={MATRIX_CONTENT_OPTIONS}
        value={content}
        onChange={(value) => setContent(value as SpecButtonContent)}
        className="justify-center"
      />
      <div className="w-full overflow-x-auto">
        <table className="mx-auto min-w-[520px] border-separate border-spacing-x-4 border-spacing-y-3">
          <thead>
            <tr>
              <th className="pb-1 text-left text-xs font-normal text-zinc-400" />
              {SPEC_BUTTON_SIZES.map((size) => (
                <th
                  key={size}
                  className="pb-1 text-center text-xs font-normal text-zinc-400"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPEC_BUTTON_VARIANTS.map((variant) => (
              <tr key={variant}>
                <th className="pr-2 text-left text-xs font-normal capitalize text-zinc-400">
                  {variant}
                </th>
                {SPEC_BUTTON_SIZES.map((size) => (
                  <td key={size} className="text-center align-middle">
                    <div className="flex justify-center">
                      <SpecButtonSample
                        variant={variant}
                        size={size}
                        content={content}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS (or only pre-existing errors unrelated to this file)

---

### Task 2: `ButtonPlaygroundSpecimen`

**Files:**
- Modify: `src/components/system/sections/ComponentSection.tsx`

**Interfaces:**
- Consumes: `SpecButton`, `SpecButtonSample` (or duplicate sample logic), `FilterPills`, `LiquidGlassButton`, `ChevronRightIcon`, `iconSize`
- Produces: `function ButtonPlaygroundSpecimen(): JSX.Element`

- [ ] **Step 1: Add playground option constants**

```tsx
const PLAYGROUND_VARIANT_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tertiary", label: "Tertiary" },
  { value: "ghost", label: "Ghost" },
];

const PLAYGROUND_SIZE_OPTIONS = [
  { value: "sm", label: "sm" },
  { value: "md", label: "md" },
  { value: "lg", label: "lg" },
];

const PLAYGROUND_CONTENT_OPTIONS = MATRIX_CONTENT_OPTIONS;

const PLAYGROUND_SURFACE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "glass", label: "Glass" },
];
```

- [ ] **Step 2: Implement `ButtonPlaygroundSpecimen`**

```tsx
function ButtonPlaygroundSpecimen() {
  const [variant, setVariant] = useState<SpecButtonVariant>("primary");
  const [size, setSize] = useState<SpecButtonSize>("md");
  const [content, setContent] = useState<SpecButtonContent>("label");
  const [surface, setSurface] = useState<"solid" | "glass">("solid");

  const isGlass = surface === "glass";
  const caption = isGlass
    ? "glass · icon"
    : `${variant} · ${size} · ${content === "icon-label" ? "icon+label" : content}`;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex min-h-16 items-center justify-center">
        {isGlass ? (
          <LiquidGlassButton
            className="text-zinc-500 hover:text-zinc-700"
            aria-label="Scroll right"
          >
            <ChevronRightIcon
              size={iconSize("toolbar")}
              className="translate-x-px"
            />
          </LiquidGlassButton>
        ) : (
          <SpecButtonSample variant={variant} size={size} content={content} />
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <FilterPills
          options={PLAYGROUND_SURFACE_OPTIONS}
          value={surface}
          onChange={(value) => setSurface(value as "solid" | "glass")}
          className="justify-center"
        />
        {!isGlass && (
          <>
            <FilterPills
              options={PLAYGROUND_VARIANT_OPTIONS}
              value={variant}
              onChange={(value) => setVariant(value as SpecButtonVariant)}
              className="justify-center"
            />
            <FilterPills
              options={PLAYGROUND_SIZE_OPTIONS}
              value={size}
              onChange={(value) => setSize(value as SpecButtonSize)}
              className="justify-center"
            />
            <FilterPills
              options={PLAYGROUND_CONTENT_OPTIONS}
              value={content}
              onChange={(value) => setContent(value as SpecButtonContent)}
              className="justify-center"
            />
          </>
        )}
      </div>

      <p className="text-sm text-zinc-400">{caption}</p>
    </div>
  );
}
```

Notes:
- When glass is selected, hide SpecButton axis pills (variant/size/content) so the UI doesn’t imply they apply.
- Defaults: primary · md · label · solid.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS for new symbols

---

### Task 3: Replace Buttons subsection markup

**Files:**
- Modify: `src/components/system/sections/ComponentSection.tsx` — the Buttons block (~lines 608–697)

**Interfaces:**
- Consumes: `ButtonMatrixSpecimen`, `ButtonPlaygroundSpecimen`, `LiquidGlassButton` specimen, `Specimen`, `SPAN` helpers
- Produces: updated Buttons section matching the spec layout

- [ ] **Step 1: Replace the Buttons grid**

Keep the SubLabel. Replace the inner `SPECIMEN_GRID` contents with:

```tsx
<SubLabel note="Axes: variant · size · icon · glass · color. Specimens encode site class patterns (not a shared Button API).">
  Buttons
</SubLabel>
<div className={SPECIMEN_GRID}>
  <Specimen label="Matrix · variant × size × content" span="col-span-1 lg:col-span-12">
    <ButtonMatrixSpecimen />
  </Specimen>

  <Specimen label="Playground · flip axes" span="col-span-1 lg:col-span-12">
    <ButtonPlaygroundSpecimen />
  </Specimen>

  <Specimen
    label="Glass · carousel arrow (in use)"
    span="col-span-1 lg:col-span-12"
    className="!bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
  >
    <LiquidGlassButton
      className="text-zinc-500 hover:text-zinc-700"
      aria-label="Scroll right"
    >
      <ChevronRightIcon
        size={iconSize("toolbar")}
        className="translate-x-px"
      />
    </LiquidGlassButton>
  </Specimen>
</div>
<p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 text-pretty">
  In use (not shown): Contact CTA · View on X · Skip link · Breadcrumb · Info · Modal close.
  Colors stay minimal (blue primary, zinc secondary); no destructive CTA on site.
</p>
```

Delete the old Primary / Secondary / Tertiary / Ghost / Sizes / Icon+text / Icon-only specimens.

- [ ] **Step 2: Relax Specimen min-height for dense matrix if needed**

If the matrix card feels too tall from `min-h-64`, pass an optional override only on the matrix/playground specimens by extending `Specimen`:

```tsx
function Specimen({
  label,
  children,
  className = "",
  span = "col-span-1 lg:col-span-4",
  cardClassName = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  span?: string;
  /** Extra classes on the zinc-50 card (e.g. min-height override) */
  cardClassName?: string;
}) {
  return (
    <div className={`flex h-full w-full min-w-0 flex-col gap-3 self-stretch ${span}`}>
      <div
        className={`flex min-h-64 w-full min-w-0 flex-1 items-center justify-center gap-4 overflow-visible rounded-2xl bg-zinc-50 px-6 py-8 md:min-h-[200px] ${className} ${cardClassName}`}
      >
        {children}
      </div>
      <div className="text-sm leading-snug text-zinc-400 text-pretty">{label}</div>
    </div>
  );
}
```

Use `cardClassName="!min-h-0 md:!min-h-0"` on matrix/playground only if visual QA shows excess empty padding. Prefer leaving defaults first.

- [ ] **Step 3: Visual QA on `/design-system`**

Run: `npm run dev` (or use existing server). Open `/design-system` → Components → Buttons.

Checklist:
- [ ] Matrix shows 4 rows × 3 columns with size headers
- [ ] Content pills switch Label / Icon+label / Icon across all cells
- [ ] Playground defaults to primary · md · label · solid; caption matches
- [ ] Changing each solid axis updates preview + caption
- [ ] Glass hides SpecButton pills; preview is LiquidGlassButton; caption `glass · icon`
- [ ] Glass callout specimen still on gradient
- [ ] Mobile: matrix scrolls horizontally; playground pills wrap
- [ ] Icon-only buttons have aria-labels; pills/buttons are keyboard focusable
- [ ] Old scattered button cards are gone
- [ ] Footer note still present

- [ ] **Step 4: Typecheck final**

Run: `npx tsc --noEmit`  
Expected: PASS (no new errors from ComponentSection)

- [ ] **Step 5: Commit (only if user asks)**

```bash
git add src/components/system/sections/ComponentSection.tsx \
  docs/superpowers/specs/2026-07-16-button-variants-display-design.md \
  docs/superpowers/plans/2026-07-16-button-variants-display.md
git commit -m "$(cat <<'EOF'
Show button variants as a matrix and playground on the design system.

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| Matrix 4×3 × content modes | Task 1 |
| Playground variant/size/content/surface + caption | Task 2 |
| Glass callout separate; not SpecButton prop | Task 2 + 3 |
| Remove old bento cards; keep SubLabel + footer | Task 3 |
| Mobile horizontal scroll | Task 1 (`overflow-x-auto`) |
| No Button API extraction / no disabled matrix | Global constraints |
| FilterPills reuse | Tasks 1–2 |

## Placeholder scan

No TBD / “similar to Task N” / empty test stubs. Verification is typecheck + visual QA (no component test harness in repo).
