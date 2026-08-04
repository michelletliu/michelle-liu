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
 * fixed list once, behind a day-long cache. Asking The Met for six at a time
 * is what tripped its throttle from a cold cache, and a throttled burst here
 * is uniquely expensive: every visitor's first sight of the strip is whatever
 * survived it.
 */
const CURATED_CONCURRENCY = 2;
const CURATED_RETRY_CONCURRENCY = 2;
const CURATED_RETRY_DELAY_MS = 450;

/**
 * The last set assembled with every curated id present.
 *
 * The curated list is fixed and its records are immutable museum metadata, so
 * a set assembled ten minutes ago is worth strictly more than a thinner one
 * assembled now. Without this, a single throttled moment decides what every
 * subsequent visitor sees until the process restarts — and because it only
 * happens from a cold cache, it is invisible to anyone testing a warm one.
 */
let lastCompleteSet: MetArtwork[] = [];
/** Coalesce overlapping GETs so a retry storm shares one upstream wave. */
let hydrateInFlight: Promise<{
  complete: boolean;
  eligible: MetArtwork[];
}> | null = null;

function indexByObjectId(artworks: MetArtwork[]): Map<number, MetArtwork> {
  return new Map(artworks.map((artwork) => [artwork.objectID, artwork]));
}

/**
 * Reassemble in curated order from whatever records we have. Fresh answers
 * overwrite the fallback so an Open Access revocation can leave the set, but
 * a throttled hole is filled from the last complete hand instead of shifting
 * every neighbour — which is what made Monet Family vanish from Hokusai's left.
 */
function assembleCurated(
  fresh: MetArtwork[],
  fallback: MetArtwork[],
): MetArtwork[] {
  const byId = indexByObjectId(fallback);
  for (const artwork of fresh) byId.set(artwork.objectID, artwork);
  return CURATED_MET_OBJECT_IDS.map((id) => byId.get(id)).filter(
    (artwork): artwork is MetArtwork =>
      artwork != null && isGenerationEligible(artwork),
  );
}

async function hydrateCurated() {
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    let hydrated = await fetchMetObjects(
      [...CURATED_MET_OBJECT_IDS],
      CURATED_CONCURRENCY,
    );
    const got = new Set(hydrated.map((artwork) => artwork.objectID));
    const missing = CURATED_MET_OBJECT_IDS.filter((id) => !got.has(id));
    if (missing.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, CURATED_RETRY_DELAY_MS));
      const retried = await fetchMetObjects(missing, CURATED_RETRY_CONCURRENCY);
      if (retried.length > 0) {
        const byId = indexByObjectId(hydrated);
        for (const artwork of retried) byId.set(artwork.objectID, artwork);
        hydrated = CURATED_MET_OBJECT_IDS.map((id) => byId.get(id)).filter(
          (artwork): artwork is MetArtwork => artwork != null,
        );
      }
    }

    const eligible = hydrated.filter(isGenerationEligible);
    const complete = CURATED_MET_OBJECT_IDS.every((id) =>
      eligible.some((artwork) => artwork.objectID === id),
    );
    return { complete, eligible };
  })();

  try {
    return await hydrateInFlight;
  } finally {
    hydrateInFlight = null;
  }
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
    artworks = assembleCurated(eligible, lastCompleteSet);
    trusted =
      complete ||
      CURATED_MET_OBJECT_IDS.every((id) =>
        artworks.some((artwork) => artwork.objectID === id),
      );
    // A complete hydration is the authority on the set even when it is
    // smaller, because then the shrinking is Open Access and not the network.
    if (complete) lastCompleteSet = eligible;
    else if (trusted) lastCompleteSet = artworks;
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
