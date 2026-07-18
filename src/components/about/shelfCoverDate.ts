export type ShelfCoverDateInput = {
  mediaType: "book" | "music" | "movie";
  dateRead?: string;
  dateStarted?: string;
  dateWatched?: string;
  _createdAt?: string;
};

export function resolveShelfCoverDateRaw(
  item: ShelfCoverDateInput,
): string | undefined {
  if (item.mediaType === "book") {
    return item.dateRead || item.dateStarted || item._createdAt || undefined;
  }
  if (item.mediaType === "movie") {
    return item.dateWatched || item._createdAt || undefined;
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

/** Milliseconds for sorting; missing/invalid dates sort as oldest (0). */
export function shelfCoverDateMs(raw?: string): number {
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Newest → oldest. Missing/invalid dates go last (oldest side). Stable for ties. */
export function sortByShelfCoverDateDesc<T extends { coverDateRaw?: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => shelfCoverDateMs(b.coverDateRaw) - shelfCoverDateMs(a.coverDateRaw),
  );
}

export type ShelfDisplayItem = {
  year?: string;
  isFeatured?: boolean;
  coverDateRaw?: string;
};

/**
 * Featured (no year): keep input order, limit to itemCount.
 * Year filter: all items for that year, newest → oldest by coverDateRaw.
 */
export function getShelfDisplayItems<T extends ShelfDisplayItem>(
  items: T[],
  activeYear: string | undefined,
  itemCount: number,
): T[] {
  if (activeYear) {
    return sortByShelfCoverDateDesc(
      items.filter((item) => item.year === activeYear),
    );
  }

  return items.filter((item) => item.isFeatured).slice(0, itemCount);
}
