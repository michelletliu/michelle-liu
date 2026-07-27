// Relative and extension-qualified rather than the `@/` alias, so `node --test`
// can resolve it: the repo's unit tests run on bare Node with no bundler path
// mapping, and its ESM resolver will not infer the extension. This is the same
// import shape the existing `.test.ts` files use; `allowImportingTsExtensions`
// in tsconfig is what keeps it legal for `next build`.
import {
  MET_API_BASE,
  normalizeMetObject,
  type MetArtwork,
} from "../../components/gallery/metArtworks.ts";

/**
 * Server-side client for The Met Collection API.
 *
 * The Met needs no API key but asks callers to stay under 80 req/s, and search
 * routinely returns thousands of object ids for one query. So: hydrate only a
 * bounded page of ids, do it through a small worker pool, and memoize records.
 *
 * Caching is a plain in-process Map with a TTL. This is a single-instance
 * personal site, so a shared cache store would be more moving parts than the
 * problem warrants; the tradeoff is that the cache is per-server-instance and
 * is dropped on restart, which is fine for immutable public museum records.
 */

const OBJECT_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_TTL_MS = 10 * 60 * 1000;
/** Bounds worst-case memory; ~2k records of trimmed metadata is a few MB. */
const MAX_CACHE_ENTRIES = 2000;
/**
 * Met asks callers to stay under 80 req/s. 12 in flight is the point where
 * added parallelism stopped buying wall-clock time in local measurement, and it
 * leaves ample headroom under that ceiling for concurrent visitors.
 */
export const HYDRATE_CONCURRENCY = 6;
/**
 * Met asks callers to identify themselves, and answers bursts from an anonymous
 * client with 403 rather than 429. Sending a real UA and backing off on the
 * throttle response is what keeps a page of results from failing outright.
 */
const USER_AGENT = "michelle-liu-gallery/1.0 (personal site; Met Open Access)";
const THROTTLE_RETRY_DELAYS_MS = [300, 900];
/** Search is one request the page cannot proceed without, so it waits longer. */
const SEARCH_TIMEOUT_MS = 8000;
/**
 * A single object is disposable — dropping a straggler costs one thumbnail,
 * while waiting on it stalls the whole page.
 */
const OBJECT_TIMEOUT_MS = 4000;

/** Per-request counters, read and reset by the route for timing logs. */
const stats = { objectFetches: 0, objectCacheHits: 0, objectDedupeHits: 0 };

export function takeMetStats() {
  const snapshot = { ...stats };
  stats.objectFetches = 0;
  stats.objectCacheHits = 0;
  stats.objectDedupeHits = 0;
  return snapshot;
}

export class MetApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "MetApiError";
    this.status = status;
  }
}

type CacheEntry<T> = { value: T; expiresAt: number };

class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  // Written out rather than a constructor parameter property, which Node's
  // type-stripping test runner cannot parse.
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh insertion order so the eviction below stays roughly LRU.
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit.value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.entries.size > MAX_CACHE_ENTRIES) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
  }
}

/** `null` marks an id The Met returned but which yields no usable record. */
const objectCache = new TtlCache<MetArtwork | null>(OBJECT_TTL_MS);
const searchCache = new TtlCache<number[]>(SEARCH_TTL_MS);

async function getJson(
  url: string,
  timeoutMs: number,
  attempt = 0,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new MetApiError("Could not reach The Met Collection API", 502);
  }

  if (res.status === 404) throw new MetApiError("Not found in The Met's collection", 404);

  // 403 is how Met throttles, not a permissions failure — there is no key to
  // get wrong. Backing off clears it.
  const throttled = res.status === 403 || res.status === 429;
  if (throttled && attempt < THROTTLE_RETRY_DELAYS_MS.length) {
    const delay = THROTTLE_RETRY_DELAYS_MS[attempt]!;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return getJson(url, timeoutMs, attempt + 1);
  }
  if (throttled) {
    throw new MetApiError(
      "The Met Collection API is rate limiting requests right now. Try again in a moment.",
      503,
    );
  }

  if (!res.ok) {
    throw new MetApiError(`The Met Collection API returned ${res.status}`, 502);
  }

  try {
    return (await res.json()) as unknown;
  } catch {
    throw new MetApiError("The Met Collection API returned invalid JSON", 502);
  }
}

export type MetSearchParams = {
  query: string;
  /** Restrict to a curatorial department id from `/departments`. */
  departmentId?: number;
  /** Match against the artist/culture fields instead of the whole record. */
  artistOrCulture?: boolean;
};

/** Object ids matching a query. Met returns `objectIDs: null` for no results. */
export async function searchMetObjectIds({
  query,
  departmentId,
  artistOrCulture = false,
}: MetSearchParams): Promise<number[]> {
  /*
   * Deliberately no `hasImages=true`. It reads like a narrowing filter and
   * behaves like a widening one: `q=monet` returns 325 ids that are all Claude
   * Monet, while `q=monet&hasImages=true` returns 170 whose fourth entry onward
   * is a Book of the Dead, a Byzantine reliquary and a Roman portrait head.
   * That pollution was the visible "search is broken" symptom. Records without
   * images are dropped by the eligibility filter anyway, so the only cost of
   * leaving it off is hydrating a few more misses.
   */
  const params = new URLSearchParams({ q: query });
  if (artistOrCulture) params.set("artistOrCulture", "true");
  if (departmentId !== undefined) {
    params.set("departmentId", String(departmentId));
  }
  // The URL is the cache key, so every parameter is part of it by construction.
  const url = `${MET_API_BASE}/search?${params.toString()}`;

  const cached = searchCache.get(url);
  if (cached) return cached;

  const data = (await getJson(url, SEARCH_TIMEOUT_MS)) as {
    objectIDs?: unknown;
  };
  // Met answers a miss with `objectIDs: null`, not an empty array.
  const ids = Array.isArray(data.objectIDs)
    ? data.objectIDs.filter((id): id is number => typeof id === "number")
    : [];

  searchCache.set(url, ids);
  return ids;
}

/**
 * Requests already on the wire, so two searches whose id lists overlap — or two
 * visitors typing the same artist — share one upstream call instead of racing.
 * Entries live only for the duration of the request; the TTL cache takes over
 * once it settles.
 */
const inFlightObjects = new Map<string, Promise<MetArtwork | null>>();

export async function fetchMetObject(
  objectID: number,
): Promise<MetArtwork | null> {
  const key = String(objectID);
  const cached = objectCache.get(key);
  if (cached !== undefined) {
    stats.objectCacheHits++;
    return cached;
  }

  const pending = inFlightObjects.get(key);
  if (pending) {
    stats.objectDedupeHits++;
    return pending;
  }

  const request = (async () => {
    stats.objectFetches++;
    try {
      const artwork = normalizeMetObject(
        await getJson(`${MET_API_BASE}/objects/${objectID}`, OBJECT_TIMEOUT_MS),
      );
      objectCache.set(key, artwork);
      return artwork;
    } catch (err) {
      // A 404 is a stable fact about the id and worth caching; transient
      // upstream failures are not, so they propagate and stay retryable.
      if (err instanceof MetApiError && err.status === 404) {
        objectCache.set(key, null);
        return null;
      }
      throw err;
    } finally {
      inFlightObjects.delete(key);
    }
  })();

  inFlightObjects.set(key, request);
  return request;
}

/**
 * Hydrate ids through a fixed-size worker pool, preserving input order.
 * One id failing drops that record rather than failing the whole page.
 */
export async function fetchMetObjects(
  objectIDs: number[],
  concurrency = HYDRATE_CONCURRENCY,
): Promise<MetArtwork[]> {
  const results = new Array<MetArtwork | null>(objectIDs.length).fill(null);
  let cursor = 0;

  const worker = async () => {
    while (cursor < objectIDs.length) {
      const index = cursor++;
      const id = objectIDs[index]!;
      try {
        results[index] = await fetchMetObject(id);
      } catch {
        results[index] = null;
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, objectIDs.length) },
    worker,
  );
  await Promise.all(workers);

  return results.filter((a): a is MetArtwork => a !== null);
}
