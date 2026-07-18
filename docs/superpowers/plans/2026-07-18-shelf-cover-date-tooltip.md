# Shelf Cover Date Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the About page shelf, show the site `Tooltip` above Book / Music / Movie covers with a short UTC date label (`Jun 14`) derived from Sanity dates.

**Architecture:** Extend `SHELF_ITEMS_QUERY` + `ShelfItem` with date fields. Resolve and format dates in a small pure helper used by `transformShelfItems`, producing `MediaCardData.coverDateLabel`. `MediaCard` wraps non-quote cover buttons in site `Tooltip` when that label exists. `Tooltip` gains an optional `className` so the shelf can pass `w-full`.

**Tech Stack:** React 18, TypeScript, Next.js, Sanity GROQ, existing site `Tooltip`, `clsx`, `node:test` for the pure date helper.

## Global Constraints

- About shelf only (Books / Music / Movies via `MediaCard`). Quotes and `/library` are out of scope.
- Books: `dateRead` → `dateStarted` → `_createdAt`. Music/Movies: `_createdAt` only.
- Format: `en-US` short month + day, no year, `timeZone: "UTC"` → e.g. `Jun 14`.
- Site `Tooltip` on cover, `position="top"`; remove native `title`; keep `aria-label`.
- Do not change `SHELF_ITEMS_BY_TYPE_QUERY` or `FEATURED_SHELF_ITEMS_QUERY`.
- Surgical edits only. Do **not** revert or rewrite unrelated uncommitted work that may exist in `MediaCard.tsx` (shimmer), `index.css` (shimmer), `ExperimentModal.tsx` / `HomePageClient.tsx` (Sundays padding), or `InfoButton.tsx` (self-end View on X).
- During implementation, commit only when the user asks (plan steps that say Commit are optional gates).

## File Structure

| File | Responsibility |
|---|---|
| `src/sanity/queries.ts` | Add `dateRead`, `dateStarted`, `_createdAt` to `SHELF_ITEMS_QUERY` only |
| `src/sanity/types.ts` | Optional date fields on About `ShelfItem` |
| `src/components/about/shelfCoverDate.ts` | Pure resolve + format helpers (testable; colocated with About transform) |
| `src/components/about/shelfCoverDate.test.ts` | `node:test` coverage for resolution + formatting |
| `src/components/about/AboutPage.tsx` | Call helper from `transformShelfItems` → `coverDateLabel` |
| `src/components/about/MediaCard.tsx` | `coverDateLabel` on `MediaCardData`; Tooltip wrap; drop `title` |
| `src/components/Tooltip.tsx` | Optional `className` merged onto outer wrapper |

---

### Task 1: Pure date resolve + format helper

**Files:**
- Create: `src/components/about/shelfCoverDate.ts`
- Create: `src/components/about/shelfCoverDate.test.ts`

**Interfaces:**
- Consumes: none (pure functions)
- Produces:
  - `export type ShelfCoverDateInput = { mediaType: "book" \| "music" \| "movie"; dateRead?: string; dateStarted?: string; _createdAt?: string }`
  - `export function resolveShelfCoverDateRaw(item: ShelfCoverDateInput): string | undefined`
  - `export function formatShelfCoverDateLabel(raw: string): string | undefined`
  - `export function getShelfCoverDateLabel(item: ShelfCoverDateInput): string | undefined`

- [ ] **Step 1: Write the failing test**

Create `src/components/about/shelfCoverDate.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  formatShelfCoverDateLabel,
  getShelfCoverDateLabel,
  resolveShelfCoverDateRaw,
} from "./shelfCoverDate.ts";

test("books prefer dateRead, then dateStarted, then _createdAt", () => {
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      dateRead: "2024-06-14",
      dateStarted: "2024-01-01",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2024-06-14",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      dateStarted: "2024-01-02",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2024-01-02",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2023-12-01T12:00:00Z",
  );
});

test("music and movies use only _createdAt", () => {
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "music",
      dateRead: "2024-06-14",
      _createdAt: "2024-03-05T08:00:00Z",
    }),
    "2024-03-05T08:00:00Z",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "movie",
      dateStarted: "2024-06-14",
      _createdAt: "2024-04-09T08:00:00Z",
    }),
    "2024-04-09T08:00:00Z",
  );
});

test("missing candidates return undefined (not empty string)", () => {
  assert.equal(resolveShelfCoverDateRaw({ mediaType: "book" }), undefined);
  assert.equal(resolveShelfCoverDateRaw({ mediaType: "music" }), undefined);
  assert.equal(getShelfCoverDateLabel({ mediaType: "movie" }), undefined);
});

test("formats as short month + day in UTC with no year", () => {
  assert.equal(formatShelfCoverDateLabel("2024-06-14"), "Jun 14");
  // Near UTC midnight in a negative-offset locale must not shift the day
  assert.equal(formatShelfCoverDateLabel("2024-06-14T00:30:00Z"), "Jun 14");
  assert.equal(formatShelfCoverDateLabel("not-a-date"), undefined);
});

test("getShelfCoverDateLabel composes resolve + format", () => {
  assert.equal(
    getShelfCoverDateLabel({
      mediaType: "book",
      dateRead: "2024-06-14",
    }),
    "Jun 14",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test --experimental-strip-types src/components/about/shelfCoverDate.test.ts
```

Expected: FAIL (module not found / export missing).

- [ ] **Step 3: Implement the helper**

Create `src/components/about/shelfCoverDate.ts`:

```ts
export type ShelfCoverDateInput = {
  mediaType: "book" | "music" | "movie";
  dateRead?: string;
  dateStarted?: string;
  _createdAt?: string;
};

export function resolveShelfCoverDateRaw(
  item: ShelfCoverDateInput,
): string | undefined {
  if (item.mediaType === "book") {
    return item.dateRead || item.dateStarted || item._createdAt || undefined;
  }
  return item._createdAt || undefined;
}

export function formatShelfCoverDateLabel(raw: string): string | undefined {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getShelfCoverDateLabel(
  item: ShelfCoverDateInput,
): string | undefined {
  const raw = resolveShelfCoverDateRaw(item);
  if (!raw) return undefined;
  return formatShelfCoverDateLabel(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --test --experimental-strip-types src/components/about/shelfCoverDate.test.ts
```

Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/components/about/shelfCoverDate.ts src/components/about/shelfCoverDate.test.ts
git commit -m "$(cat <<'EOF'
Add shelf cover date resolve/format helper.

EOF
)"
```

---

### Task 2: Query + types for About shelf dates

**Files:**
- Modify: `src/sanity/queries.ts` (`SHELF_ITEMS_QUERY` only, ~lines 268–283)
- Modify: `src/sanity/types.ts` (`ShelfItem` interface, ~lines 539–553)

**Interfaces:**
- Consumes: existing `SHELF_ITEMS_QUERY` / `ShelfItem`
- Produces: `ShelfItem` may include `dateRead?: string`, `dateStarted?: string`, `_createdAt?: string`; query returns those fields for About fetch/cache

- [ ] **Step 1: Extend `SHELF_ITEMS_QUERY`**

In `src/sanity/queries.ts`, change `SHELF_ITEMS_QUERY` to:

```ts
export const SHELF_ITEMS_QUERY = `
  *[_type == "shelfItem" && isPublished == true] | order(isFeatured desc, order asc) {
    _id,
    title,
    mediaType,
    cover,
    externalCoverUrl,
    author,
    year,
    rating,
    isFeatured,
    goodreadsUrl,
    letterboxdSlug,
    spotifyUrl,
    dateRead,
    dateStarted,
    _createdAt
  }
`;
```

Do **not** edit `SHELF_ITEMS_BY_TYPE_QUERY` or `FEATURED_SHELF_ITEMS_QUERY`.

- [ ] **Step 2: Extend About `ShelfItem` type**

In `src/sanity/types.ts`, add optional fields to the About-page `ShelfItem` interface (the one near `ShelfMediaType`, **not** `SanityBook`):

```ts
export interface ShelfItem {
  _id: string;
  title: string;
  mediaType: ShelfMediaType;
  cover?: SanityImage;
  externalCoverUrl?: string;
  author?: string;
  year?: string;
  rating?: number;
  isFeatured?: boolean;
  order?: number;
  goodreadsUrl?: string;
  letterboxdSlug?: string;
  spotifyUrl?: string;
  dateRead?: string;
  dateStarted?: string;
  _createdAt?: string;
}
```

- [ ] **Step 3: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no new errors from these fields. Do not opportunistically fix unrelated project errors.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/sanity/queries.ts src/sanity/types.ts
git commit -m "$(cat <<'EOF'
Fetch shelf date fields for About cover tooltips.

EOF
)"
```

---

### Task 3: Wire `coverDateLabel` in `transformShelfItems`

**Files:**
- Modify: `src/components/about/AboutPage.tsx` (`transformShelfItems`, ~lines 271–288)
- Modify: `src/components/about/MediaCard.tsx` (`MediaCardData` type only in this task)

**Interfaces:**
- Consumes: `getShelfCoverDateLabel` from `./shelfCoverDate`, `ShelfItem` date fields
- Produces: `MediaCardData.coverDateLabel?: string` set only when a label exists

- [ ] **Step 1: Add `coverDateLabel` to `MediaCardData`**

In `src/components/about/MediaCard.tsx`, add to `MediaCardData` (after `title` is fine):

```ts
  /** Preformatted short date for cover hover tooltip (About shelf) */
  coverDateLabel?: string;
```

Do not change cover rendering yet.

- [ ] **Step 2: Use helper in `transformShelfItems`**

In `src/components/about/AboutPage.tsx`:

1. Add import:

```ts
import { getShelfCoverDateLabel } from "./shelfCoverDate";
```

2. Replace `transformShelfItems` with:

```ts
function transformShelfItems(data: ShelfItem[]): MediaCardData[] {
  return data.map((item) => {
    const type =
      item.mediaType === "book"
        ? "Book"
        : item.mediaType === "music"
          ? "Music"
          : item.mediaType === "movie"
            ? "Movie"
            : "Book";

    const coverDateLabel = getShelfCoverDateLabel({
      mediaType: item.mediaType,
      dateRead: item.dateRead,
      dateStarted: item.dateStarted,
      _createdAt: item._createdAt,
    });

    return {
      id: item._id,
      imageSrc: item.cover
        ? urlFor(item.cover).width(300).url()
        : item.externalCoverUrl || undefined,
      title: item.title,
      type,
      year: item.year,
      isFeatured: item.isFeatured,
      goodreadsUrl: item.goodreadsUrl,
      letterboxdSlug: item.letterboxdSlug,
      spotifyUrl: item.spotifyUrl,
      ...(coverDateLabel ? { coverDateLabel } : {}),
    };
  });
}
```

Important: omit `coverDateLabel` entirely when undefined (do not set `""`).

- [ ] **Step 3: Run helper tests + typecheck**

Run:

```bash
node --test --experimental-strip-types src/components/about/shelfCoverDate.test.ts
npx tsc --noEmit
```

Expected: helper tests PASS; no new TS errors from the transform.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/about/AboutPage.tsx src/components/about/MediaCard.tsx
git commit -m "$(cat <<'EOF'
Pass preformatted cover date labels into About shelf cards.

EOF
)"
```

---

### Task 4: Optional `className` on site `Tooltip`

**Files:**
- Modify: `src/components/Tooltip.tsx`

**Interfaces:**
- Consumes: existing `TooltipProps`
- Produces: `className?: string` merged onto the outer `relative inline-flex` wrapper via `clsx`

- [ ] **Step 1: Add optional `className`**

At top of `src/components/Tooltip.tsx`, add:

```ts
import clsx from 'clsx';
```

Extend `TooltipProps`:

```ts
type TooltipProps = {
  label: string;
  children: React.ReactNode;
  /** Position of tooltip relative to children */
  position?: 'top' | 'bottom';
  /** Offset from the element in pixels */
  offset?: number;
  /** Force-hide and skip hover show (e.g. while a click popover is open) */
  disabled?: boolean;
  /** Keep tooltip permanently visible (e.g. design-system specimens) */
  forceOpen?: boolean;
  /** Extra classes on the outer wrapper (merged with base) */
  className?: string;
};
```

Destructure `className` in the component params and change the outer wrapper to:

```tsx
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
```

Do not replace base classes; omitting `className` must leave layout unchanged for existing call sites (e.g. `CommunityCard`).

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: clean for `Tooltip.tsx`.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add src/components/Tooltip.tsx
git commit -m "$(cat <<'EOF'
Allow optional className on site Tooltip wrapper.

EOF
)"
```

---

### Task 5: Wrap About shelf covers in `Tooltip`; remove native `title`

**Files:**
- Modify: `src/components/about/MediaCard.tsx` (cover return paths only; preserve existing shimmer / white-border logic)

**Interfaces:**
- Consumes: `data.coverDateLabel`, site `Tooltip` with `position="top"` and `className="w-full"`
- Produces: cover buttons without `title`; Tooltip wrap only when `coverDateLabel` is defined; Quote path unchanged

- [ ] **Step 1: Import Tooltip and wrap cover buttons**

In `src/components/about/MediaCard.tsx`:

1. Add import:

```ts
import Tooltip from "../Tooltip";
```

2. Replace the two cover return paths (external URL button and onClick button) with a single shared button + optional Tooltip wrap. Keep shimmer / image / white-border code above untouched.

Replace from `// Use button with window.open...` through the final return with:

```tsx
  const coverButton = (
    <button
      onClick={
        externalUrl
          ? () => window.open(externalUrl, "_blank")
          : onClick
      }
      className={sharedClasses}
      aria-label={data?.title || "Media item"}
    >
      {cardContent}
    </button>
  );

  if (data?.coverDateLabel) {
    return (
      <Tooltip
        label={data.coverDateLabel}
        position="top"
        className="w-full"
      >
        {coverButton}
      </Tooltip>
    );
  }

  return coverButton;
```

Requirements:
- Remove `title={data?.title}` from both former paths (covered by the shared button above).
- Keep `aria-label={data?.title || "Media item"}`.
- Do **not** wrap the Quote early-return path.
- Do **not** reformat dates in `MediaCard`.
- Preserve all existing shimmer / load / white-border behavior above this block.

- [ ] **Step 2: Run tests + typecheck + build**

Run:

```bash
node --test --experimental-strip-types src/components/about/shelfCoverDate.test.ts
npx tsc --noEmit
npm run build
```

Expected: helper tests PASS; build succeeds (or only pre-existing unrelated failures).

- [ ] **Step 3: Manual verification (About page)**

With `npm run dev` (reuse an existing server on port 3000 if already running):

1. About → Books: hover a cover with `dateRead` → tooltip above cover shows `Mon D` (e.g. `Jun 14`), no year.
2. Book with only `dateStarted` / only `_createdAt` → that calendar day in UTC.
3. About → Music / Movies: hover shows `_createdAt` calendar day, no year.
4. Item missing all dates: no tooltip wrapper; cover still clickable / focusable with `aria-label`.
5. Quote cards: unchanged; no date tooltip.
6. Click Goodreads / Spotify / Letterboxd cover: opens external link; tooltip hides on mousedown.
7. Confirm native browser `title` tooltip no longer appears on shelf covers.
8. Touch / coarse pointer: no tooltip (existing Tooltip behavior).
9. `/library` unchanged.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/about/MediaCard.tsx
git commit -m "$(cat <<'EOF'
Show shelf cover date tooltips on About MediaCards.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Extend `SHELF_ITEMS_QUERY` with dates | Task 2 |
| Optional fields on `ShelfItem` | Task 2 |
| Book / Music / Movie candidate order | Task 1 |
| Format `Jun 14` UTC, no year | Task 1 |
| `coverDateLabel` via `transformShelfItems` | Task 3 |
| Tooltip wrap when label present | Task 5 |
| `position="top"`, `className="w-full"` | Tasks 4–5 |
| Remove native `title`; keep `aria-label` | Task 5 |
| Quotes / Library untouched | Tasks 3–5 (no edits there) |
| Touch / mousedown hide (existing Tooltip) | Task 5 (reuse) |
| Optional Tooltip `className` | Task 4 |
