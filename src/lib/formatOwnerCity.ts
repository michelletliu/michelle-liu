/**
 * Footer location is stored as a city name from an iOS Shortcut
 * ("Get Details of Location" → City). That field has no state, so a refresh
 * would otherwise show "Saratoga" instead of "Saratoga, CA".
 */

const US_STATE_ABBREV: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const US_ABBREVS = new Set(Object.values(US_STATE_ABBREV));

export type GeocodeHit = {
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  timezone?: string;
};

const memoryCache = new Map<string, string>();
const CACHE_PREFIX = "owner-city:";

export function cityAlreadyHasRegion(city: string): boolean {
  return /,\s*\S+/.test(city.trim());
}

export function abbreviateRegion(region: string): string | null {
  const trimmed = region.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && US_ABBREVS.has(upper)) return upper;
  if (US_STATE_ABBREV[trimmed]) return US_STATE_ABBREV[trimmed];
  const titled = trimmed
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  if (US_STATE_ABBREV[titled]) return US_STATE_ABBREV[titled];
  return null;
}

export function cityNameOnly(city: string): string {
  return city.trim().replace(/,\s*[^,]+$/, "").trim();
}

export function normalizeOwnerCityLabel(city: string): string {
  const trimmed = city.trim().replace(/\s+/g, " ");
  const match = trimmed.match(/^(.*?),\s*(.+)$/);
  if (!match) return trimmed;
  const name = match[1].trim();
  const region = match[2].trim();
  const abbrev = abbreviateRegion(region);
  return abbrev ? `${name}, ${abbrev}` : `${name}, ${region}`;
}

export function regionFromHit(hit: GeocodeHit): string | null {
  if (hit.country_code === "US") {
    return abbreviateRegion(hit.admin1 ?? "") ?? null;
  }
  return hit.country?.trim() || null;
}

export function formatOwnerCity(city: string, region: string | null): string {
  const name = cityNameOnly(city);
  if (!name || !region) return normalizeOwnerCityLabel(city);
  return `${name}, ${region}`;
}

export function pickGeocodeHit(
  city: string,
  timezone: string,
  hits: GeocodeHit[],
): GeocodeHit | null {
  if (hits.length === 0) return null;
  const lower = cityNameOnly(city).toLowerCase();
  const sameName = hits.filter((hit) => hit.name.toLowerCase() === lower);
  const tzMatch = (hit: GeocodeHit) => hit.timezone === timezone;
  return (
    sameName.find(tzMatch) ??
    hits.find(tzMatch) ??
    sameName[0] ??
    hits[0]
  );
}

export function labelFromHit(city: string, hit: GeocodeHit | null): string {
  return formatOwnerCity(city, hit ? regionFromHit(hit) : null);
}

function cacheKey(city: string, timezone: string): string {
  return `${cityNameOnly(city).toLowerCase()}|${timezone}`;
}

function readStore(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readCache(key: string): string | null {
  const remembered = memoryCache.get(key);
  if (remembered) return remembered;
  const stored = readStore()?.getItem(`${CACHE_PREFIX}${key}`) ?? null;
  if (stored) memoryCache.set(key, stored);
  return stored;
}

function writeCache(key: string, label: string): void {
  memoryCache.set(key, label);
  try {
    readStore()?.setItem(`${CACHE_PREFIX}${key}`, label);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function resolveOwnerCityLabel(
  city: string,
  timezone: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
  state?: string | null,
): Promise<string> {
  const trimmed = city.trim();
  if (!trimmed) return trimmed;

  const fromState = abbreviateRegion(state ?? "") ?? state?.trim() ?? null;
  if (fromState) {
    const label = formatOwnerCity(trimmed, fromState);
    writeCache(cacheKey(trimmed, timezone), label);
    return label;
  }

  const normalized = normalizeOwnerCityLabel(trimmed);
  if (cityAlreadyHasRegion(trimmed)) {
    writeCache(cacheKey(trimmed, timezone), normalized);
    return normalized;
  }

  const key = cacheKey(trimmed, timezone);
  const cached = readCache(key);
  if (cached) return cached;

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(cityNameOnly(trimmed))}&count=10&language=en&format=json`;
  try {
    const res = await fetchImpl(url, { signal });
    if (!res.ok) return readCache(key) ?? normalized;
    const data = (await res.json()) as { results?: GeocodeHit[] };
    const label = labelFromHit(
      trimmed,
      pickGeocodeHit(trimmed, timezone, data.results ?? []),
    );
    writeCache(key, label);
    return label;
  } catch (error) {
    if (signal?.aborted) throw error;
    return readCache(key) ?? normalized;
  }
}
