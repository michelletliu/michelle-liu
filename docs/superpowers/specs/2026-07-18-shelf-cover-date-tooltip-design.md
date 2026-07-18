# Shelf Cover Date Tooltip

**Date:** 2026-07-18  
**Status:** Pending user review

## Goal

On the About page shelf, show a hover tooltip with the item’s relevant date (`Jun 14`) when hovering a Book, Music, or Movie cover. Library page and quote cards stay unchanged.

## Success Criteria

- Hovering a shelf cover (Books / Music / Movies) shows the site `Tooltip` above the cover with a short date label.
- Date resolution matches media type: books prefer read/started dates; music and movies use creation date.
- Missing all candidate dates → no tooltip wrapper (cover behaves as today, minus native `title`).
- Quote cards and Library remain untouched.
- Touch sessions do not show tooltips (existing `Tooltip` behavior).
- External cover links still open on click; tooltip hides on mousedown as today.

## Scope

**In:**
- About page shelf covers only (Books / Music / Movies via `MediaCard`)
- Data plumbing: query → type → transform → `MediaCardData.coverDateLabel`
- Wrap cover control in site `Tooltip` when a label exists
- Optional `className` on `Tooltip` so the wrapper can be `w-full`

**Out:**
- Library page (`/library`) and its date formatting UI
- Quote cards (`type === "Quote"`)
- Lore cards, featured-only alternate queries, DS specimens
- Native browser `title` tooltips (removed from cover controls)
- New tooltip positioning variants beyond existing `top` / `bottom`

## Data Flow

```
SHELF_ITEMS_QUERY
  + dateRead, dateStarted, _createdAt
        ↓
ShelfItem (optional fields)
        ↓
transformShelfItems → coverDateLabel?: string
        ↓
MediaCard → Tooltip label={coverDateLabel} when present
```

### Query & types

1. Extend `SHELF_ITEMS_QUERY` in `src/sanity/queries.ts` to also fetch:
   - `dateRead`
   - `dateStarted`
   - `_createdAt`

2. Add those three fields as optional on `ShelfItem` in `src/sanity/types.ts`:
   - `dateRead?: string`
   - `dateStarted?: string`
   - `_createdAt?: string`

Do not change `SHELF_ITEMS_BY_TYPE_QUERY` or `FEATURED_SHELF_ITEMS_QUERY` — About uses `SHELF_ITEMS_QUERY` only.

### Date resolution (`transformShelfItems`)

Resolve a raw date string, then format it:

| Media type | Candidate order (first present wins) |
|---|---|
| Book | `dateRead` → `dateStarted` → `_createdAt` |
| Music | `_createdAt` |
| Movie | `_createdAt` |

If no candidate is present, omit `coverDateLabel` (do not set empty string).

### Formatting

Preformat in `transformShelfItems` (or a small helper colocated there) and pass `coverDateLabel?: string` on `MediaCardData`.

- Locale: `en-US`
- Shape: short month + day, **no year** → e.g. `Jun 14`
- Options: `{ month: "short", day: "numeric", timeZone: "UTC" }`
- Timezone: force `timeZone: "UTC"` for both `YYYY-MM-DD` date fields and `_createdAt`, so the calendar day matches Library’s UTC treatment and does not shift in negative-offset timezones.

`MediaCard` must not re-parse or reformat dates; it only displays the preformatted label.

## UI

### Tooltip wrapper

In `src/components/about/MediaCard.tsx`, for non-quote cover controls (both return paths: external-URL `<button>` and onClick `<button>`):

- When `data.coverDateLabel` is defined, wrap that cover `<button>` in site `Tooltip` from `src/components/Tooltip.tsx` with:
  - `label={data.coverDateLabel}`
  - `position="top"`
  - `className="w-full"` (after Tooltip gains optional `className`)
- When `coverDateLabel` is missing, render the cover `<button>` without a `Tooltip` wrapper.

### Accessibility & title

- Remove native `title={data?.title}` from both cover `<button>` return paths (whether or not a Tooltip wraps them).
- Keep `aria-label={data?.title || "Media item"}` as today.

### Quotes

Quote early-return path stays unchanged — no date tooltip, no `Tooltip` wrap.

### Tooltip API tweak

Add optional `className?: string` to `Tooltip` props. Merge it onto the existing outer wrapper (`relative inline-flex`) via `clsx` / equivalent — do not replace the base classes. Shelf covers pass `w-full` so the wrapper matches the cover width. Omitting `className` leaves current layout unchanged.

### Interaction

- Existing Tooltip mousedown hide remains; clicks that open external links (Goodreads / Spotify / Letterboxd) continue to work.
- Touch: Tooltip already no-ops for touch sessions — no MediaCard-specific touch handling.

## Files

1. `src/sanity/queries.ts` — extend `SHELF_ITEMS_QUERY`
2. `src/sanity/types.ts` — optional date fields on `ShelfItem`
3. `src/components/about/AboutPage.tsx` — resolve + format in `transformShelfItems`
4. `src/components/about/MediaCard.tsx` — `coverDateLabel` on type; Tooltip wrap; drop native `title`
5. `src/components/Tooltip.tsx` — optional `className`

## Edge Cases

| Case | Behavior |
|---|---|
| Touch session | Tooltip does not show (existing) |
| Book with no `dateRead` / `dateStarted` / `_createdAt` | No Tooltip wrapper |
| Music/Movie with no `_createdAt` | No Tooltip wrapper (should be rare; `_createdAt` is system) |
| Quote card | Unchanged; no tooltip |
| Cover click / external link | Works; tooltip hides on mousedown |
| Library page | Out of scope; unchanged |

## Verification

- About → Books: hover a cover with `dateRead` → tooltip shows `Mon D` above cover.
- About → Books: item with only `dateStarted` → that date; only `_createdAt` → that calendar day in UTC.
- About → Music / Movies: hover shows `_createdAt` calendar day; no year.
- Item missing all dates: no tooltip; cover still clickable / keyboard-focusable with `aria-label`.
- Quote cards: no date tooltip.
- Touch device / coarse pointer: no tooltip on hover/tap.
- Library page unchanged.
- Confirm native browser title tooltip no longer appears on shelf covers.
