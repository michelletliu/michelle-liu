/**
 * Parse and sync movies from LiuMichelle's Letterboxd diary/review RSS feed.
 *
 * Task 1 exports pure parser helpers; full Sanity sync is added in later tasks.
 *
 * Run: node scripts/sync-letterboxd-rss.js
 */

const fs = require('node:fs');
const path = require('node:path');
const {createClient} = require('@sanity/client');

const SANITY_QUERY = `*[_type == "shelfItem" && mediaType == "movie"
  && !(_id in path("drafts.**"))
  && !(_id in path("versions.**"))]{
  _id, title, year, dateWatched, rating, letterboxdSlug, tmdbId,
  externalCoverUrl, order, isFeatured, isPublished,
  "hasCover": defined(cover)
}`;

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function tag(block, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = block.match(new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1];
  return v.trim() || null;
}

/** Strip drafts. / versions.* prefixes so draft+published pairs collapse to one id. */
function publishedId(id) {
  if (!id) return id;
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length);
  const versionMatch = id.match(/^versions\.[^.]+\.(.+)$/);
  if (versionMatch) return versionMatch[1];
  return id;
}

function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function letterboxdSlug(url) {
  if (!url) return null;
  const m = url.match(/\/film\/([^/]+)/);
  return m ? m[1] : null;
}

function extractPosterUrl(description) {
  if (!description) return null;
  const m = description.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
}

function parseRating(raw) {
  if (raw == null || raw === '') return null;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return null;
  return Number.isInteger(n) ? parseInt(raw, 10) : n;
}

function parseTmdbId(raw) {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function pubDateMs(pubDate) {
  if (!pubDate) return 0;
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function dedupeKey(item) {
  if (item.tmdbId != null) return `tmdb:${item.tmdbId}`;
  if (item.letterboxdSlug) return `slug:${item.letterboxdSlug}`;
  return null;
}

function parseFeed(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = decodeEntities(tag(block, 'letterboxd:filmTitle'));
    if (!title) continue;

    const link = tag(block, 'link');
    const watchedDate = tag(block, 'letterboxd:watchedDate');
    const tmdbRaw = tag(block, 'tmdb:movieId');

    items.push({
      title,
      releaseYear: tag(block, 'letterboxd:filmYear') || null,
      watchedDate: watchedDate || null,
      watchedYear: watchedDate ? watchedDate.slice(0, 4) : null,
      rating: parseRating(tag(block, 'letterboxd:memberRating')),
      letterboxdSlug: letterboxdSlug(link),
      tmdbId: parseTmdbId(tmdbRaw),
      rssPosterUrl: extractPosterUrl(tag(block, 'description')),
      pubDate: tag(block, 'pubDate') || null,
    });
  }
  return items;
}

function dedupeMovies(items) {
  const sorted = [...items].sort((a, b) => pubDateMs(b.pubDate) - pubDateMs(a.pubDate));
  const seen = new Set();
  const result = [];
  for (const item of sorted) {
    const key = dedupeKey(item);
    if (!key) {
      console.warn(`Skipping invalid Letterboxd item without TMDb ID or slug: ${item.title || '(untitled)'}`);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Prefer the published doc when both a draft and published copy are present. */
function collapseMatches(matches) {
  if (!matches || matches.length === 0) return [];
  const byId = new Map();
  for (const doc of matches) {
    const id = publishedId(doc._id);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, doc);
      continue;
    }
    if (doc._id === id && existing._id !== id) {
      byId.set(id, doc);
    }
  }
  return [...byId.values()];
}

function findMatchCandidates(existing, item) {
  const collapsed = collapseMatches(existing);

  if (item.tmdbId != null) {
    const candidates = collapseMatches(
      collapsed.filter((doc) => doc.tmdbId === item.tmdbId)
    );
    if (candidates.length > 0) return candidates;
  }

  if (item.letterboxdSlug) {
    const candidates = collapseMatches(
      collapsed.filter((doc) => doc.letterboxdSlug === item.letterboxdSlug)
    );
    if (candidates.length > 0) return candidates;
  }

  if (item.title) {
    const key = normalizeTitle(item.title);
    return collapseMatches(
      collapsed.filter((doc) => normalizeTitle(doc.title) === key)
    );
  }

  return [];
}

function findExistingMatch(existing, item) {
  const candidates = findMatchCandidates(existing, item);
  return candidates.length === 1 ? candidates[0] : null;
}

function buildCreateDoc(item) {
  const doc = {
    _id: item.tmdbId != null
      ? `shelfItem-movie-tmdb-${item.tmdbId}`
      : `shelfItem-movie-letterboxd-${item.letterboxdSlug}`,
    _type: 'shelfItem',
    title: item.title,
    mediaType: 'movie',
    isFeatured: false,
    isPublished: true,
    order: 0,
  };

  if (item.watchedYear) doc.year = item.watchedYear;
  if (item.watchedDate) doc.dateWatched = item.watchedDate;
  if (item.rating != null) doc.rating = item.rating;
  if (item.letterboxdSlug) doc.letterboxdSlug = item.letterboxdSlug;
  if (item.tmdbId != null) doc.tmdbId = item.tmdbId;

  const poster = item.resolvedPosterUrl || item.rssPosterUrl;
  if (poster) doc.externalCoverUrl = poster;

  return doc;
}

function buildPatch(existing, item) {
  const set = {};
  const unset = [];

  if (item.watchedDate || item.watchedYear) {
    if (existing.year !== item.watchedYear) set.year = item.watchedYear;
  }

  if (item.watchedDate && existing.dateWatched !== item.watchedDate) {
    set.dateWatched = item.watchedDate;
  }

  if (item.rating != null) {
    if (existing.rating !== item.rating) set.rating = item.rating;
  } else if (item.rating === null && existing.rating != null) {
    unset.push('rating');
  }

  if (item.letterboxdSlug && existing.letterboxdSlug !== item.letterboxdSlug) {
    set.letterboxdSlug = item.letterboxdSlug;
  }

  if (item.tmdbId != null && existing.tmdbId !== item.tmdbId) {
    set.tmdbId = item.tmdbId;
  }

  const poster = item.resolvedPosterUrl || item.rssPosterUrl;
  if (poster && !existing.hasCover && !existing.externalCoverUrl) {
    set.externalCoverUrl = poster;
  }

  return { set, unset };
}

function planMutations(existing, feedItems) {
  const creates = [];
  const patches = [];
  const skipped = [];
  const claimedIds = new Set();

  for (const item of feedItems) {
    const candidates = findMatchCandidates(existing, item);
    const match = candidates.length === 1 ? candidates[0] : null;

    if (match) {
      const claimId = publishedId(match._id);
      if (claimedIds.has(claimId)) {
        skipped.push(item);
        continue;
      }
      claimedIds.add(claimId);

      const { set, unset } = buildPatch(match, item);
      if (Object.keys(set).length > 0 || unset.length > 0) {
        patches.push({
          _id: match._id,
          title: match.title,
          set,
          unset,
        });
      }
      continue;
    }

    if (candidates.length > 1) {
      skipped.push(item);
      continue;
    }

    creates.push(buildCreateDoc(item));
  }

  return { creates, patches, skipped };
}

async function resolvePoster(item, fetchImpl, apiKey) {
  if (!apiKey || item.tmdbId == null) return item.rssPosterUrl;

  try {
    const url = `https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetchImpl(url);
    if (!response.ok) return item.rssPosterUrl;

    const movie = await response.json();
    return movie && movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : item.rssPosterUrl;
  } catch {
    return item.rssPosterUrl;
  }
}

function findTagEnd(xml, start) {
  let quote = null;
  for (let i = start; i < xml.length; i += 1) {
    const char = xml[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i;
    }
  }
  return -1;
}

function hasValidRssStructure(xml) {
  const stack = [];
  let rootCount = 0;
  let channelCount = 0;
  let position = 0;

  while (position < xml.length) {
    const tagStart = xml.indexOf('<', position);
    if (tagStart === -1) {
      return stack.length === 0
        && xml.slice(position).trim() === ''
        && rootCount === 1
        && channelCount === 1;
    }
    if (stack.length === 0 && xml.slice(position, tagStart).trim() !== '') {
      return false;
    }

    if (xml.startsWith('<!--', tagStart)) {
      const end = xml.indexOf('-->', tagStart + 4);
      if (end === -1) return false;
      position = end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', tagStart)) {
      if (stack.length === 0) return false;
      const end = xml.indexOf(']]>', tagStart + 9);
      if (end === -1) return false;
      position = end + 3;
      continue;
    }
    if (xml.startsWith('<?', tagStart)) {
      const end = xml.indexOf('?>', tagStart + 2);
      if (end === -1) return false;
      position = end + 2;
      continue;
    }
    if (xml.startsWith('<!', tagStart)) return false;

    const tagEnd = findTagEnd(xml, tagStart + 1);
    if (tagEnd === -1) return false;
    const rawTag = xml.slice(tagStart + 1, tagEnd);

    if (rawTag.startsWith('/')) {
      const closingName = rawTag.slice(1).trim();
      if (!/^[A-Za-z_][\w.:-]*$/.test(closingName) || stack.pop() !== closingName) {
        return false;
      }
    } else {
      const selfClosing = /\/\s*$/.test(rawTag);
      const openingTag = selfClosing ? rawTag.replace(/\/\s*$/, '') : rawTag;
      const nameMatch = openingTag.match(/^([A-Za-z_][\w.:-]*)/);
      if (!nameMatch) return false;

      const name = nameMatch[1];
      const attributes = openingTag.slice(name.length);
      const validAttributes = /^(?:\s+[A-Za-z_][\w.:-]*\s*=\s*(?:"[^"]*"|'[^']*'))*\s*$/.test(attributes);
      if (!validAttributes) return false;

      if (stack.length === 0) {
        rootCount += 1;
        if (rootCount !== 1 || name !== 'rss' || selfClosing) return false;
      } else if (stack.length === 1 && stack[0] === 'rss' && name === 'channel') {
        channelCount += 1;
        if (channelCount > 1 || selfClosing) return false;
      }

      if (!selfClosing) stack.push(name);
    }
    position = tagEnd + 1;
  }

  return stack.length === 0 && rootCount === 1 && channelCount === 1;
}

async function fetchLetterboxdFeed(fetchImpl = fetch) {
  const username = process.env.LETTERBOXD_USERNAME || 'LiuMichelle';
  const url = `https://letterboxd.com/${username.toLowerCase()}/rss/`;
  const response = await fetchImpl(url, {
    headers: {'User-Agent': 'michelle-liu-letterboxd-sanity-sync/1.0'},
  });

  if (!response.ok) {
    throw new Error(`Letterboxd feed returned HTTP ${response.status}`);
  }

  const xml = await response.text();
  if (!hasValidRssStructure(xml)) {
    throw new Error('Letterboxd response was not a valid RSS feed');
  }
  return xml;
}

async function main() {
  const xml = await fetchLetterboxdFeed();
  const feedItems = dedupeMovies(parseFeed(xml));

  const client = createClient({
    projectId: 'am3v0x1c',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_TOKEN,
  });
  const existing = await client.fetch(SANITY_QUERY);

  const enrichedItems = await Promise.all(feedItems.map(async (item) => {
    const candidates = findMatchCandidates(existing, item);
    const match = candidates.length === 1 ? candidates[0] : null;
    const needsPoster = candidates.length === 0
      || (match && !match.hasCover && !match.externalCoverUrl);

    if (!needsPoster) return item;
    return {
      ...item,
      resolvedPosterUrl: await resolvePoster(item, fetch, process.env.TMDB_API_KEY),
    };
  }));

  const plan = planMutations(existing, enrichedItems);
  console.log(`Parsed ${feedItems.length} unique Letterboxd movies.`);
  console.log(`Creates: ${plan.creates.length}`);
  plan.creates.forEach((doc) => console.log(`  + ${doc.title}`));
  console.log(`Patches: ${plan.patches.length}`);
  plan.patches.forEach((patch) => {
    const fields = [...Object.keys(patch.set), ...patch.unset.map((field) => `unset:${field}`)];
    console.log(`  ~ ${patch.title}: ${fields.join(', ')}`);
  });
  console.log(`Skipped: ${plan.skipped.length}`);
  plan.skipped.forEach((item) => console.log(`  ! ${item.title}`));

  if (!process.env.SANITY_TOKEN) {
    const previewPath = path.join(__dirname, 'letterboxd-sync-preview.json');
    fs.writeFileSync(previewPath, `${JSON.stringify(plan, null, 2)}\n`);
    console.log(`DRY RUN: no Sanity writes; preview written to ${previewPath}`);
    return plan;
  }

  if (plan.creates.length === 0 && plan.patches.length === 0) {
    console.log('Nothing to sync.');
    return plan;
  }

  const transaction = client.transaction();
  plan.creates.forEach((doc) => transaction.createIfNotExists(doc));
  plan.patches.forEach((patch) => {
    const mutation = {};
    if (Object.keys(patch.set).length > 0) mutation.set = patch.set;
    if (patch.unset.length > 0) mutation.unset = patch.unset;
    transaction.patch(patch._id, mutation);
  });
  await transaction.commit();
  console.log(`Committed ${plan.creates.length + plan.patches.length} Sanity mutations.`);
  return plan;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Letterboxd sync failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  dedupeMovies,
  fetchLetterboxdFeed,
  findExistingMatch,
  letterboxdSlug,
  main,
  normalizeTitle,
  parseFeed,
  parseTmdbId,
  planMutations,
  publishedId,
  resolvePoster,
};
