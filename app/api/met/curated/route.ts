import { NextResponse } from "next/server";
import {
  isGenerationEligible,
  type MetArtwork,
} from "@/components/gallery/metArtworks";
import { CURATED_MET_OBJECT_IDS } from "@/components/gallery/metCurated";
import { MetApiError, fetchMetObjects, takeMetStats } from "@/lib/met/metClient";

export const runtime = "nodejs";

export type MetCuratedResponse = { artworks: MetArtwork[] };

/**
 * Gentler than the search path's pool, because this route is not racing
 * anyone. Search hydrates a page a visitor is waiting on; this hydrates a
 * fixed list of thirteen, once, behind a day-long cache. Asking The Met for
 * six at a time is what tripped its throttle from a cold cache, and a
 * throttled burst here is uniquely expensive: every visitor's first sight of
 * the strip is whatever survived it.
 */
const CURATED_CONCURRENCY = 3;

/**
 * The last set assembled from a complete hydration.
 *
 * The curated list is fixed and its records are immutable museum metadata, so
 * a set assembled ten minutes ago is worth strictly more than a thinner one
 * assembled now. Without this, a single throttled moment decides what every
 * subsequent visitor sees until the process restarts — and because it only
 * happens from a cold cache, it is invisible to anyone testing a warm one.
 */
let lastCompleteSet: MetArtwork[] = [];

/**
 * Coming up short has two causes that look identical in the result and must
 * not be treated alike. An id The Met never answered for is a transient
 * failure, and yesterday's record is the better answer. A work that answered
 * but is no longer Open Access has genuinely left the set, and replaying a
 * cached record claiming otherwise would put an unusable work in front of
 * someone and block generation when they picked it. So the two are counted
 * separately: `hydrated` decides whether the fetch can be trusted, and
 * `eligible` is what that fetch actually says the strip should hold.
 */
async function hydrateCurated() {
  const hydrated = await fetchMetObjects(
    [...CURATED_MET_OBJECT_IDS],
    CURATED_CONCURRENCY,
  );
  return {
    complete: hydrated.length === CURATED_MET_OBJECT_IDS.length,
    eligible: hydrated.filter(isGenerationEligible),
  };
}

/**
 * The strip's default contents.
 *
 * Three ways to come up short, handled differently. Ids that fail one at a
 * time are dropped by `fetchMetObjects`; works that have left Open Access are
 * dropped by the eligibility filter; and a total upstream failure throws,
 * reaching the client as an error so the picker falls back to search alone
 * rather than painting broken tiles. Only the last is worth telling anyone
 * about — and only when there is no snapshot left to serve instead.
 */
export async function GET() {
  takeMetStats();
  const startedAt = Date.now();

  let artworks: MetArtwork[];
  let trusted: boolean;
  try {
    const { complete, eligible } = await hydrateCurated();
    trusted = complete;
    // A complete hydration is the authority on the set even when it is
    // smaller, because then the shrinking is Open Access and not the network.
    if (complete) lastCompleteSet = eligible;
    artworks = complete || eligible.length > lastCompleteSet.length
      ? eligible
      : lastCompleteSet;
  } catch (err) {
    // Held works outrank an error: the visitor wanted the pictures, not a
    // report on The Met's availability.
    if (lastCompleteSet.length === 0) {
      const status = err instanceof MetApiError ? err.status : 502;
      const message =
        err instanceof MetApiError
          ? err.message
          : "Could not reach The Met Collection API";
      return NextResponse.json({ error: message }, { status });
    }
    artworks = lastCompleteSet;
    trusted = false;
  }

  const { objectFetches, objectCacheHits, objectDedupeHits } = takeMetStats();
  console.info(
    `[met/curated] kept=${artworks.length}/${CURATED_MET_OBJECT_IDS.length} ` +
      `trusted=${trusted} total=${Date.now() - startedAt}ms upstream=${objectFetches} ` +
      `cacheHits=${objectCacheHits} dedupe=${objectDedupeHits}`,
  );

  const body: MetCuratedResponse = { artworks };
  return NextResponse.json(body, {
    headers: {
      // A set every id answered for is a fixed list of immutable records, so
      // it caches hard. Anything else is a symptom, and pinning a symptom to
      // the edge for a day would turn one throttled second into a day of thin
      // strips — so it gets a minute, enough to blunt a retry storm and no
      // more.
      "Cache-Control": trusted
        ? "public, s-maxage=86400, stale-while-revalidate=604800"
        : "public, s-maxage=60, stale-while-revalidate=600",
    },
  });
}
