import { NextRequest, NextResponse } from "next/server";
import {
  artistQueryTokens,
  isGenerationEligible,
  matchesArtist,
  type MetArtwork,
  type MetSearchResponse,
} from "@/components/gallery/metArtworks";
import {
  HYDRATE_CONCURRENCY,
  MetApiError,
  fetchMetObjects,
  searchMetObjectIds,
  takeMetStats,
} from "@/lib/met/metClient";

export const runtime = "nodejs";

/**
 * Twelve fills the grid about twice over, which is enough to browse without
 * paying for records nobody scrolls to. Met's `/search` hands back ids only, so
 * every extra result on a page is another upstream round trip.
 */
const DEFAULT_PAGE_SIZE = 12;
const MIN_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 24;
const MAX_QUERY_LENGTH = 100;
/**
 * A query can match thousands of ids and only a fraction are public domain, so
 * pages are filled by scanning forward through the id list. This caps how many
 * ids one request may hydrate before it gives up and hands back a cursor.
 */
const MAX_IDS_SCANNED_PER_REQUEST = 120;
/**
 * Hard wall-clock budget for hydration. A query where almost nothing is Open
 * Access would otherwise keep scanning to the cap; past this point the route
 * returns a short page plus a cursor rather than leaving the grid on skeletons.
 */
const HYDRATION_BUDGET_MS = 4000;
const MAX_OFFSET = 5000;

function clampInt(raw: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json(
      { error: "A search query is required" },
      { status: 400 },
    );
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: "Search query is too long" },
      { status: 400 },
    );
  }

  const pageSize = clampInt(
    params.get("pageSize"),
    DEFAULT_PAGE_SIZE,
    MIN_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const offset = clampInt(params.get("offset"), 0, 0, MAX_OFFSET);
  const departmentIdRaw = params.get("departmentId");
  const departmentId = departmentIdRaw
    ? clampInt(departmentIdRaw, Number.NaN, 1, 100)
    : undefined;
  const scopedDepartmentId = Number.isFinite(departmentId)
    ? departmentId
    : undefined;

  takeMetStats();
  const startedAt = Date.now();
  const tokens = artistQueryTokens(query);

  /*
   * One upstream search, on the plain full-text index.
   *
   * `artistOrCulture=true` looked like the right tool for artist queries and is
   * not: it answers "monet" with zero results and "van gogh" with eight, while
   * the plain index returns every Claude Monet in the collection, correctly
   * ranked, at the top of the list. Its sparseness was what pushed artist
   * queries onto a fallback path in the first place. The plain index already
   * ranks well, so relevance is Met's job and filtering is ours.
   */
  let objectIDs: number[];
  try {
    objectIDs = await searchMetObjectIds({
      query,
      departmentId: scopedDepartmentId,
    });
  } catch (err) {
    const status = err instanceof MetApiError ? err.status : 502;
    const message =
      err instanceof MetApiError
        ? err.message
        : "Could not search The Met Collection API";
    return NextResponse.json({ error: message }, { status });
  }

  const searchMs = Date.now() - startedAt;
  const hydrationStartedAt = Date.now();

  /*
   * Ids are walked front to back and never sorted, so Met's relevance ordering
   * survives; `fetchMetObjects` reassembles each parallel wave back into
   * request order for the same reason. Each wave is exactly the size of the
   * hydration pool, so a wave costs one round trip rather than several
   * serialised rounds, and the walk stops as soon as the page is full.
   */
  const byArtist: MetArtwork[] = [];
  const other: MetArtwork[] = [];
  let cursor = Math.min(offset, objectIDs.length);
  let scanned = 0;
  let skippedNotOpenAccess = 0;
  /** Query matches by this artist, Open Access or not. */
  let artistMatchesSeen = 0;

  while (
    byArtist.length < pageSize &&
    cursor < objectIDs.length &&
    scanned < MAX_IDS_SCANNED_PER_REQUEST &&
    Date.now() - hydrationStartedAt < HYDRATION_BUDGET_MS
  ) {
    const batchSize = Math.min(
      HYDRATE_CONCURRENCY,
      MAX_IDS_SCANNED_PER_REQUEST - scanned,
      objectIDs.length - cursor,
    );
    const batch = objectIDs.slice(cursor, cursor + batchSize);
    cursor += batchSize;
    scanned += batchSize;

    for (const artwork of await fetchMetObjects(batch)) {
      const onArtist = matchesArtist(artwork, tokens);
      if (onArtist) artistMatchesSeen++;

      // Only Open Access, public-domain records ever reach the client.
      if (!isGenerationEligible(artwork)) {
        skippedNotOpenAccess++;
        continue;
      }
      (onArtist ? byArtist : other).push(artwork);
      if (byArtist.length === pageSize) break;
    }
  }

  /*
   * If the collection holds work by the person named — whether or not any of it
   * is Open Access — the query is about that artist, and nobody else's work
   * belongs in the answer. An empty result is the honest response for someone
   * like Monet, whose Met holdings are all still in copyright; backfilling with
   * near-miss artists is what produced a grid of Roman columns.
   *
   * When nothing matched by artist the query was about a subject, and every
   * eligible record is fair game in Met's own order.
   */
  const isArtistQuery = artistMatchesSeen > 0;
  const artworks = isArtistQuery ? byArtist : other.slice(0, pageSize);

  const hydrateMs = Date.now() - hydrationStartedAt;
  const { objectFetches, objectCacheHits, objectDedupeHits } = takeMetStats();
  console.info(
    `[met/search] q=${JSON.stringify(query)} artistQuery=${isArtistQuery} ` +
      `search=${searchMs}ms hydrate=${hydrateMs}ms total=${Date.now() - startedAt}ms ` +
      `scanned=${scanned} kept=${artworks.length} artistMatches=${artistMatchesSeen} ` +
      `skipped=${skippedNotOpenAccess} upstream=${objectFetches} ` +
      `cacheHits=${objectCacheHits} dedupe=${objectDedupeHits}`,
  );

  const body: MetSearchResponse = {
    query,
    offset,
    nextOffset: cursor < objectIDs.length ? cursor : null,
    totalMatches: objectIDs.length,
    matchMode: isArtistQuery ? "artist" : "keyword",
    artistMatchesSeen,
    skippedNotOpenAccess,
    artworks,
  };

  return NextResponse.json(body, {
    headers: {
      // Met records are effectively immutable; a shared cache plus SWR keeps
      // repeated searches off the upstream API entirely.
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
