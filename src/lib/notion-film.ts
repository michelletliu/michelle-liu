import type { FilmPhoto } from '@/components/film/film-data';

const NOTION_VERSION = '2022-06-28';
const DEFAULT_ASPECT_RATIO = 1.5;
const PROBE_BYTE_LIMIT = 262_144;
const ASPECT_PROBE_CONCURRENCY = 6;
const FILM_PHOTOS_CACHE_TTL_MS = process.env.NODE_ENV === 'development' ? 30_000 : 5 * 60_000;
const NOTION_FETCH_TIMEOUT_MS = 14_000;
const NOTION_FETCH_RETRIES = 2;

/** In-memory cache (warm serverless instance) so repeat API calls skip re-fetching image heads. */
const aspectByPageId = new Map<string, number>();
let filmPhotosCache:
  | {
      photos: FilmPhoto[];
      fetchedAt: number;
    }
  | null = null;
let filmPhotosInFlight: Promise<FilmPhoto[]> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= NOTION_FETCH_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), NOTION_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ac.signal,
      });
      if (
        res.status !== 429 &&
        res.status !== 500 &&
        res.status !== 502 &&
        res.status !== 503 &&
        res.status !== 504
      ) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
      if (attempt >= NOTION_FETCH_RETRIES) {
        return res;
      }
    } catch (error) {
      lastError = error;
      if (attempt >= NOTION_FETCH_RETRIES) {
        throw error;
      }
    } finally {
      clearTimeout(timer);
    }
    await sleep(300 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error('Fetch failed');
}

function jpegAspectFromBuffer(buf: Uint8Array): number | null {
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = (buf[offset + 5] << 8) | buf[offset + 6];
      const width = (buf[offset + 7] << 8) | buf[offset + 8];
      if (width > 0 && height > 0) return width / height;
      return null;
    }
    const len = (buf[offset + 2] << 8) | buf[offset + 3];
    offset += 2 + len;
  }
  return null;
}

function pngAspectFromBuffer(buf: Uint8Array): number | null {
  if (buf.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== sig[i]) return null;
  }
  const width =
    (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const height =
    (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  if (width > 0 && height > 0) return width / height;
  return null;
}

function readLE32(buf: Uint8Array, i: number): number {
  const v =
    buf[i] |
    (buf[i + 1] << 8) |
    (buf[i + 2] << 16) |
    (buf[i + 3] << 24);
  return v >>> 0;
}

/** WebP (RIFF): VP8X canvas, or VP8 / VP8L bitstream — matches image-size / Google container spec. */
function webpAspectFromBuffer(buf: Uint8Array): number | null {
  if (buf.length < 30) return null;
  if (
    buf[0] !== 0x52 ||
    buf[1] !== 0x49 ||
    buf[2] !== 0x46 ||
    buf[3] !== 0x46 ||
    buf[8] !== 0x57 ||
    buf[9] !== 0x45 ||
    buf[10] !== 0x42 ||
    buf[11] !== 0x50
  ) {
    return null;
  }

  let off = 12;
  while (off + 8 <= buf.length) {
    const tag = String.fromCharCode(
      buf[off],
      buf[off + 1],
      buf[off + 2],
      buf[off + 3],
    );
    const size = readLE32(buf, off + 4);
    const start = off + 8;
    if (start > buf.length) break;
    const end = Math.min(buf.length, start + size);
    const payload = buf.subarray(start, end);
    const nextOff = end + (size & 1);
    if (nextOff <= off) break;
    off = nextOff;

    if (tag === 'VP8X' && payload.length >= 10) {
      const flags = payload[0];
      if ((flags & 0xc0) === 0 && (flags & 0x01) === 0) {
        const w =
          1 +
          (payload[4] | (payload[5] << 8) | (payload[6] << 16));
        const h =
          1 +
          (payload[7] | (payload[8] << 8) | (payload[9] << 16));
        if (w > 0 && h > 0) return w / h;
      }
    }
    if (tag === 'VP8 ' && payload.length >= 10 && payload[0] !== 0x2f) {
      const w = (payload[6] | (payload[7] << 8)) & 0x3fff;
      const h = (payload[8] | (payload[9] << 8)) & 0x3fff;
      if (w > 0 && h > 0) return w / h;
    }
    if (tag === 'VP8L' && payload.length >= 5 && payload[0] === 0x2f) {
      const w = 1 + (((payload[2] & 0x3f) << 8) | payload[1]);
      const h =
        1 +
        (((payload[4] & 0xf) << 10) |
          (payload[3] << 2) |
          ((payload[2] & 0xc0) >> 6));
      if (w > 0 && h > 0) return w / h;
    }
  }
  return null;
}

function gifAspectFromBuffer(buf: Uint8Array): number | null {
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  if (buf[3] !== 0x38 || (buf[4] !== 0x37 && buf[4] !== 0x39) || buf[5] !== 0x61) {
    return null;
  }
  const width = buf[6] | (buf[7] << 8);
  const height = buf[8] | (buf[9] << 8);
  if (width > 0 && height > 0) return width / height;
  return null;
}

async function fetchImagePrefix(url: string): Promise<Uint8Array> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 14_000);
  try {
    let res = await fetch(url, {
      headers: { Range: `bytes=0-${PROBE_BYTE_LIMIT - 1}` },
      signal: ac.signal,
    });
    if (res.status === 416 || !res.ok) {
      res = await fetch(url, { signal: ac.signal });
    }
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab.slice(0, PROBE_BYTE_LIMIT));
  } finally {
    clearTimeout(timer);
  }
}

async function probeAspectFromUrl(url: string): Promise<number> {
  try {
    const buf = await fetchImagePrefix(url);
    const ar =
      jpegAspectFromBuffer(buf) ??
      pngAspectFromBuffer(buf) ??
      webpAspectFromBuffer(buf) ??
      gifAspectFromBuffer(buf) ??
      null;
    if (ar && Number.isFinite(ar) && ar > 0.2 && ar < 5) {
      return Math.round(ar * 10_000) / 10_000;
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_ASPECT_RATIO;
}

async function aspectForPage(pageId: string, url: string): Promise<number> {
  const hit = aspectByPageId.get(pageId);
  if (hit) return hit;
  const ar = await probeAspectFromUrl(url);
  aspectByPageId.set(pageId, ar);
  return ar;
}
/** Sundays Film DB id (no hyphens). Used in `next dev` when `NOTION_FILM_DATABASE_ID` is unset. Production must set the env var. */
const DEFAULT_FILM_DATABASE_ID_DEV = '34020ae54e9a805783f9fd6c3abf79b0';

function resolveFilmDatabaseId(): string {
  const raw = process.env.NOTION_FILM_DATABASE_ID?.trim();
  if (raw) return raw.replace(/-/g, '');
  if (process.env.NODE_ENV === 'development') return DEFAULT_FILM_DATABASE_ID_DEV;
  throw new Error(
    'NOTION_FILM_DATABASE_ID is not set (required in production; add to Vercel/host env).',
  );
}
const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

async function notionFetch(path: string, init?: RequestInit): Promise<unknown> {
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'NOTION_TOKEN is not set — create an internal integration at notion.so/my-integrations, share the film database with it, and add NOTION_TOKEN to .env.local',
    );
  }
  const res = await fetchWithRetry(`https://api.notion.com${path}`, {
    ...init,
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

type NotionPage = {
  id: string;
  properties: Record<string, unknown>;
};

type NotionBlockChildren = {
  results?: Array<{
    type: string;
    image?: {
      type?: string;
      file?: { url?: string };
      external?: { url?: string };
    };
  }>;
};

/** Block children for a page; `null` on 404 (page not shared with integration, removed, or invalid id). */
async function notionFetchBlockChildrenOrNull(
  pageId: string,
): Promise<NotionBlockChildren | null> {
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'NOTION_TOKEN is not set — create an internal integration at notion.so/my-integrations, share the film database with it, and add NOTION_TOKEN to .env.local',
    );
  }
  const res = await fetchWithRetry(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );
  if (res.status === 404) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[notion-film] Skipping page (no access or missing): ${pageId}`,
      );
    }
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json() as Promise<NotionBlockChildren>;
}

function pageTitle(props: Record<string, unknown>): string {
  const title = props.Title as { title?: Array<{ plain_text?: string }> } | undefined;
  return title?.title?.[0]?.plain_text ?? 'untitled';
}

function pageMonth(props: Record<string, unknown>): string {
  const m = props.Month as { select?: { name?: string } } | undefined;
  return m?.select?.name ?? 'Unknown';
}

function pageYear(props: Record<string, unknown>): number {
  const y = props.Year as { multi_select?: Array<{ name?: string }> } | undefined;
  const first = y?.multi_select?.[0]?.name;
  if (first) {
    const n = parseInt(first, 10);
    if (!Number.isNaN(n)) return n;
  }
  return new Date().getFullYear();
}

function pageNote(props: Record<string, unknown>): string | undefined {
  const n = props.Note as
    | { select?: { name?: string } | null; multi_select?: Array<{ name?: string }> }
    | { rich_text?: Array<{ plain_text?: string }> }
    | undefined;
  if (!n) return undefined;
  const fromSelect =
    (n as { select?: { name?: string } | null }).select?.name?.trim() ?? '';
  if (fromSelect.length > 0) return fromSelect;
  const ms = (n as { multi_select?: Array<{ name?: string }> }).multi_select;
  const fromMulti = ms?.map((x) => x.name ?? '').filter(Boolean).join(', ').trim() ?? '';
  if (fromMulti.length > 0) return fromMulti;
  const parts =
    (n as { rich_text?: Array<{ plain_text?: string }> }).rich_text?.map(
      (x) => x.plain_text ?? '',
    ) ?? [];
  const t = parts.join('').trim();
  return t.length > 0 ? t : undefined;
}

function imageUrlFromBlock(block: {
  type?: string;
  image?: {
    type?: string;
    file?: { url?: string };
    external?: { url?: string };
  };
}): string | null {
  if (!block || block.type !== 'image') return null;
  const img = block.image;
  if (!img) return null;
  if (img.type === 'file' && img.file?.url) return img.file.url;
  if (img.type === 'external' && img.external?.url) return img.external.url;
  return img.file?.url ?? img.external?.url ?? null;
}

type SortedPage = {
  page: NotionPage;
  title: string;
  month: string;
  year: number;
  note?: string;
};

let sortedPagesCache: { pages: SortedPage[]; fetchedAt: number } | null = null;
let sortedPagesInFlight: Promise<SortedPage[]> | null = null;

async function fetchSortedPages(): Promise<SortedPage[]> {
  const now = Date.now();
  if (sortedPagesCache && now - sortedPagesCache.fetchedAt < FILM_PHOTOS_CACHE_TTL_MS) {
    return sortedPagesCache.pages;
  }
  if (sortedPagesInFlight) return sortedPagesInFlight;

  sortedPagesInFlight = (async () => {
    const databaseId = resolveFilmDatabaseId();
    const allPages: NotionPage[] = [];
    let cursor: string | undefined;
    do {
      const body: Record<string, unknown> = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const resp = (await notionFetch(`/v1/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(body),
      })) as { results?: NotionPage[]; has_more?: boolean; next_cursor?: string };
      allPages.push(...(resp.results ?? []));
      if (!resp.has_more) break;
      cursor = resp.next_cursor;
    } while (cursor);

    const sorted: SortedPage[] = allPages.map((page) => ({
      page,
      title: pageTitle(page.properties),
      month: pageMonth(page.properties),
      year: pageYear(page.properties),
      note: pageNote(page.properties),
    }));
    sorted.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const mA = MONTH_ORDER.indexOf(a.month as (typeof MONTH_ORDER)[number]);
      const mB = MONTH_ORDER.indexOf(b.month as (typeof MONTH_ORDER)[number]);
      if (mA !== mB) return (mA === -1 ? 99 : mA) - (mB === -1 ? 99 : mB);
      return a.title.localeCompare(b.title);
    });
    sortedPagesCache = { pages: sorted, fetchedAt: Date.now() };
    return sorted;
  })().finally(() => { sortedPagesInFlight = null; });

  return sortedPagesInFlight;
}

async function resolvePhotosFromPages(pages: SortedPage[]): Promise<FilmPhoto[]> {
  type RawEntry = {
    pageId: string;
    title: string;
    month: string;
    year: number;
    url: string;
    note?: string;
    sortIdx: number;
  };

  const batchSize = pages.length <= 12 ? pages.length : 12;
  const raw: RawEntry[] = [];

  for (let i = 0; i < pages.length; i += batchSize) {
    const slice = pages.slice(i, i + batchSize);
    const part = await Promise.all(
      slice.map(async (sp, j) => {
        let blocks: NotionBlockChildren | null;
        try {
          blocks = await notionFetchBlockChildrenOrNull(sp.page.id);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[notion-film] Skipping page after block fetch failure: ${sp.page.id}`,
              error,
            );
          }
          return null;
        }
        if (!blocks) return null;
        const imageBlock = blocks.results?.find((b) => b.type === 'image');
        const url = imageBlock ? imageUrlFromBlock(imageBlock) : null;
        if (!url) return null;
        return {
          pageId: sp.page.id,
          title: sp.title,
          month: sp.month,
          year: sp.year,
          url,
          ...(sp.note ? { note: sp.note } : {}),
          sortIdx: i + j,
        };
      }),
    );
    raw.push(...part.filter((x): x is RawEntry => x != null));
  }

  raw.sort((a, b) => a.sortIdx - b.sortIdx);

  const concurrency = Math.min(raw.length, ASPECT_PROBE_CONCURRENCY);
  const photos: FilmPhoto[] = [];
  for (let i = 0; i < raw.length; i += concurrency) {
    const chunk = raw.slice(i, i + concurrency);
    const aspects = await Promise.all(
      chunk.map((e) => aspectForPage(e.pageId, e.url)),
    );
    for (let j = 0; j < chunk.length; j++) {
      const e = chunk[j];
      photos.push({
        id: e.pageId,
        src: e.url,
        title: e.title,
        month: e.month,
        year: e.year,
        aspectRatio: aspects[j],
        ...(e.note ? { note: e.note } : {}),
      });
    }
  }
  return photos;
}

async function fetchFilmPhotosFromNotionUncached(limit?: number): Promise<FilmPhoto[]> {
  const sorted = await fetchSortedPages();
  const pages = limit ? sorted.slice(0, limit) : sorted;
  return resolvePhotosFromPages(pages);
}

export async function fetchFilmPhotosFromNotion(limit?: number): Promise<FilmPhoto[]> {
  if (limit) {
    if (filmPhotosCache && Date.now() - filmPhotosCache.fetchedAt < FILM_PHOTOS_CACHE_TTL_MS) {
      return filmPhotosCache.photos.slice(0, limit);
    }
    return fetchFilmPhotosFromNotionUncached(limit);
  }

  const now = Date.now();
  if (filmPhotosCache && now - filmPhotosCache.fetchedAt < FILM_PHOTOS_CACHE_TTL_MS) {
    return filmPhotosCache.photos;
  }
  if (filmPhotosInFlight) {
    return filmPhotosInFlight;
  }

  filmPhotosInFlight = fetchFilmPhotosFromNotionUncached()
    .then((photos) => {
      filmPhotosCache = { photos, fetchedAt: Date.now() };
      return photos;
    })
    .catch((error) => {
      if (filmPhotosCache) {
        return filmPhotosCache.photos;
      }
      throw error;
    })
    .finally(() => {
      filmPhotosInFlight = null;
    });

  return filmPhotosInFlight;
}
