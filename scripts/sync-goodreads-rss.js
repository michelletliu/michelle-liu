/**
 * Sync books from a Goodreads "read" shelf RSS feed into Sanity shelfItem docs.
 *
 * - Creates new book shelfItems that don't exist yet (matched by Goodreads
 *   book id when available, otherwise cleaned title + author disambiguation).
 * - Backfills ONLY missing metadata (rating, dateRead, review, goodreadsUrl, cover)
 *   on existing books, so it never clobbers values curated by hand in Studio.
 * - When several Sanity books share a title, author must uniquely match;
 *   otherwise the feed item is skipped — never patched onto matches[0] or
 *   created as a duplicate. Draft+published pairs collapse to one match.
 *
 * Dry-run when SANITY_TOKEN is not set: prints what it would do and writes a
 * scripts/goodreads-sync-preview.json for review.
 *
 * Env:
 *   SANITY_TOKEN       Sanity Editor token (required to write; dry-run without it)
 *   GOODREADS_USER_ID  Goodreads numeric user id (default 126741914)
 *   GOODREADS_SHELF    Shelf name (default "read")
 *
 * Run: SANITY_TOKEN=your_token node scripts/sync-goodreads-rss.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const USER_ID = process.env.GOODREADS_USER_ID || '126741914';
const SHELF = process.env.GOODREADS_SHELF || 'read';
// Goodreads list_rss returns at most PAGE_SIZE items per request; paginate with &page=.
const PAGE_SIZE = 100;
const FEED_BASE = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${SHELF}`;

function feedUrl(page) {
  return `${FEED_BASE}&page=${page}`;
}

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

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

// The library renderer understands a small subset of inline tags. Anything
// outside this set has to be flattened to text or it shows up literally.
const RENDERABLE_TAGS = new Set(['b', 'i']);

/** Drop tags the renderer can't handle; normalize the ones it can to lowercase. */
function stripUnrenderableTags(html) {
  return html
    .replace(/<(\/?)\s*strong\b[^>]*>/gi, '<$1b>')
    .replace(/<(\/?)\s*em\b[^>]*>/gi, '<$1i>')
    .replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (_match, slash, name) => {
      const tag = name.toLowerCase();
      return RENDERABLE_TAGS.has(tag) ? `<${slash}${tag}>` : '';
    });
}

/**
 * Remove tags with no partner. Goodreads happily saves a review with a stray
 * `<i>` or `</b>`, and the renderer prints an unmatched tag as literal text.
 */
function dropUnbalancedTags(text) {
  const tags = [];
  const re = /<(\/?)(b|i)>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tags.push({ start: m.index, end: re.lastIndex, isClosing: m[1] === '/', name: m[2] });
  }

  const openByName = new Map();
  const unmatched = new Set();
  tags.forEach((t, index) => {
    const open = openByName.get(t.name) || [];
    if (!t.isClosing) open.push(index);
    else if (open.length > 0) open.pop();
    else unmatched.add(index);
    openByName.set(t.name, open);
  });
  for (const open of openByName.values()) for (const index of open) unmatched.add(index);
  if (unmatched.size === 0) return text;

  let out = '';
  let cursor = 0;
  for (const index of [...unmatched].sort((a, b) => a - b)) {
    out += text.slice(cursor, tags[index].start);
    cursor = tags[index].end;
  }
  return out + text.slice(cursor);
}

/**
 * The renderer splits a review into sections on divider lines before it parses
 * tags, so a pair that straddles a divider lands unbalanced in two sections and
 * prints literally. Close the open tags before each divider and reopen after.
 */
function balanceAcrossDividers(text) {
  const parts = text.split(/(\n*-{3,}\n*)/g);
  if (parts.length < 3) return text;

  let carried = [];
  return parts
    .map((part, index) => {
      if (index % 2 === 1 || !part) return part;

      const stack = [...carried];
      const re = /<(\/?)(b|i)>/g;
      let m;
      while ((m = re.exec(part)) !== null) {
        if (!m[1]) stack.push(m[2]);
        else {
          const at = stack.lastIndexOf(m[2]);
          if (at !== -1) stack.splice(at, 1);
        }
      }
      const reopened = carried.map((name) => `<${name}>`).join('');
      const closed = [...stack].reverse().map((name) => `</${name}>`).join('');
      carried = stack;
      return reopened + part + closed;
    })
    .join('');
}

function cleanReview(html) {
  if (!html) return null;
  const text = dropUnbalancedTags(
    stripUnrenderableTags(html.replace(/<br\s*\/?>/gi, '\n'))
  );
  const decoded = decodeEntities(text)
    // Indentation left behind by removed block tags turns runs of blank lines
    // into whitespace-only lines, which survive the blank-line collapse below.
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    // Goodreads writes quote blocks as `<i><br />…<br /></i>`; pull that padding
    // outside the tag so the emphasis starts on the text itself.
    .replace(/<(b|i)>\s+/g, '<$1>')
    .replace(/\s+<\/(b|i)>/g, '</$1>')
    .trim();
  return balanceAcrossDividers(decoded) || null;
}

// Goodreads titles carry series/edition suffixes, e.g.
// "The Handmaid's Tale (The Handmaid's Tale, #1)" or "The Fall (Vintage International)".
// Strip parenthetical groups so titles match/store cleanly.
function cleanTitle(title) {
  return (title || '').replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

// Matching key: drop the "(series/edition)" suffix AND the ": subtitle" so the
// feed's long titles (e.g. "Being Mortal: Medicine and What Matters in the End")
// match existing library entries stored under the short title ("Being Mortal").
function matchKey(title) {
  return cleanTitle(title)
    .split(':')[0]
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when two author strings refer to the same person after normalization. */
function authorsMatch(a, b) {
  if (!a || !b) return false;
  const tokensA = matchKey(a).split(' ').filter(Boolean);
  const tokensB = matchKey(b).split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];

  // Single-token names only match an exact single-token peer (avoid "John" → any John*).
  if (shorter.length === 1) {
    return longer.length === 1 && shorter[0] === longer[0];
  }

  // Every token of the shorter name must appear in the longer
  // ("Mary Shelley" ↔ "Mary Wollstonecraft Shelley").
  return shorter.every((t) => longer.includes(t));
}

/** Strip drafts. / versions.* prefixes so draft+published pairs collapse to one id. */
function publishedId(id) {
  if (!id) return id;
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length);
  const versionMatch = id.match(/^versions\.[^.]+\.(.+)$/);
  if (versionMatch) return versionMatch[1];
  return id;
}

/**
 * Prefer the published doc when both a draft and published copy are present.
 * Prevents draft+published pairs from looking like two different books.
 */
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
    // Prefer non-draft over draft when both exist.
    if (existing._id.startsWith('drafts.') && !doc._id.startsWith('drafts.')) {
      byId.set(id, doc);
    }
  }
  return [...byId.values()];
}

/**
 * Pick the Sanity shelfItem for a Goodreads feed item.
 * When several books share a normalized title, author must disambiguate —
 * never fall back to matches[0], which can write metadata to the wrong doc.
 */
function findExistingMatch(matches, item) {
  const unique = collapseMatches(matches);
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];

  // Multiple books share this title — require a unique author match.
  if (!item.author) return null;

  const byAuthor = unique.filter(
    (mm) => mm.author && authorsMatch(mm.author, item.author)
  );
  if (byAuthor.length === 1) return byAuthor[0];
  return null;
}

// Extract a single tag's value from an <item> block; unwraps CDATA.
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'));
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1];
  return v.trim() || null;
}

// RFC-822 date (e.g. "Sun, 12 Jul 2026 00:00:00 +0000") -> { iso: "2026-07-12", year: "2026" }
function parseDate(rfc822) {
  if (!rfc822) return null;
  const d = new Date(rfc822);
  if (isNaN(d.getTime())) return null;
  return { iso: d.toISOString().slice(0, 10), year: String(d.getUTCFullYear()) };
}

function isFavoriteShelf(shelves) {
  return (shelves || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .some((s) => s === 'favorites' || s === 'favourites' || s === 'favorite');
}

// Pull the Goodreads numeric book id out of whatever identity a stored doc
// carries: its goodreadsUrl (.../book/show/{id}) or its deterministic _id
// (shelfItem-book-gr-{id}). Lets us match on stable identity, not title text.
function bookIdFromDoc(doc) {
  if (doc.goodreadsUrl) {
    const m = doc.goodreadsUrl.match(/\/book\/show\/(\d+)/);
    if (m) return m[1];
  }
  if (doc._id) {
    const m = doc._id.match(/shelfItem-book-gr-(\d+)/);
    if (m) return m[1];
  }
  return null;
}

function parseFeed(xml, { requireReadDate = true } = {}) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const bookId = tag(b, 'book_id');
    const rawTitle = decodeEntities(tag(b, 'title'));
    if (!rawTitle) continue;

    const rating = parseInt(tag(b, 'user_rating') || '0', 10) || 0;
    const readDate = parseDate(tag(b, 'user_read_at'));
    // Only sync books with a real finish date. This matches the original
    // library curation and skips date-less catalogued books (childhood/school
    // reads, want-to-read carryovers) that were never actually logged as read.
    if (requireReadDate && !readDate) continue;
    const cover = tag(b, 'book_large_image_url') || tag(b, 'book_image_url');

    items.push({
      bookId,
      title: cleanTitle(rawTitle),
      matchKey: matchKey(rawTitle),
      author: decodeEntities(tag(b, 'author_name')),
      rating,
      dateRead: readDate ? readDate.iso : null,
      year: readDate ? readDate.year : null,
      review: cleanReview(tag(b, 'user_review')),
      goodreadsUrl: bookId ? `https://www.goodreads.com/book/show/${bookId}` : null,
      // Goodreads serves a "nophoto" placeholder when a book has no cover.
      cover: cover && !/nophoto/i.test(cover) ? cover : null,
      isFavorite: isFavoriteShelf(tag(b, 'user_shelves')),
    });
  }
  return items;
}

/** Count <item> blocks in a page — used for pagination before read-date filtering. */
function countFeedItems(xml) {
  const matches = xml.match(/<item>/gi);
  return matches ? matches.length : 0;
}

async function fetchFeedPage(page) {
  const url = feedUrl(page);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'michelle-liu-goodreads-sync/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Goodreads feed returned ${res.status} ${res.statusText} (${url})`);
  }
  return res.text();
}

// list_rss caps each response at ~100 items. Walk page=1,2,... until a page
// returns fewer than PAGE_SIZE raw items (or zero), then dedupe by bookId.
async function fetchAllFeedBooks() {
  const all = [];
  const seen = new Set();
  let page = 1;

  while (true) {
    const xml = await fetchFeedPage(page);
    const rawCount = countFeedItems(xml);
    const items = parseFeed(xml);
    console.log(`  page ${page}: ${items.length} dated / ${rawCount} raw items`);

    for (const item of items) {
      const key = item.bookId || item.matchKey;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(item);
    }

    if (rawCount < PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

async function main() {
  console.log(`Goodreads sync - feed: ${FEED_BASE} (paginated)\n`);

  const feedBooks = await fetchAllFeedBooks();
  console.log(`Parsed ${feedBooks.length} books from the "${SHELF}" shelf\n`);

  // Exclude drafts/versions so a Studio edit never looks like a second book.
  const existing = await client.fetch(`
    *[_type == "shelfItem" && mediaType == "book" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
      _id, title, author, rating, dateRead, review, goodreadsUrl,
      externalCoverUrl, year, isLibraryFavorite, "hasCover": defined(cover)
    }
  `);
  console.log(`Found ${existing.length} existing book shelfItems in Sanity\n`);

  // Index existing docs by stable Goodreads id AND by normalized title. The
  // id index is authoritative so a title edited by hand in Studio can't slip
  // past the match and spawn a duplicate shelfItem-book-gr-{id} document.
  const byBookId = new Map();
  const byTitle = new Map();
  for (const book of existing) {
    const bookId = bookIdFromDoc(book);
    if (bookId) byBookId.set(bookId, book);
    const key = matchKey(book.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(book);
  }

  const creates = [];
  const patches = [];

  function buildCreateDoc(item) {
    const doc = {
      _id: item.bookId ? `shelfItem-book-gr-${item.bookId}` : undefined,
      _type: 'shelfItem',
      title: item.title,
      mediaType: 'book',
      author: item.author || undefined,
      year: item.year || undefined,
      isFeatured: false,
      isPublished: true,
      order: 0,
    };
    if (item.rating > 0) doc.rating = item.rating;
    if (item.dateRead) doc.dateRead = item.dateRead;
    if (item.review) doc.review = item.review;
    if (item.goodreadsUrl) doc.goodreadsUrl = item.goodreadsUrl;
    if (item.cover) doc.externalCoverUrl = item.cover;
    if (item.isFavorite) doc.isLibraryFavorite = true;
    return doc;
  }

  for (const item of feedBooks) {
    // Prefer identity match; fall back to normalized title.
    const idMatch = item.bookId ? byBookId.get(item.bookId) : null;
    const matches = idMatch ? [idMatch] : byTitle.get(item.matchKey) || [];
    const match = findExistingMatch(matches, item);

    if (match) {
      // Backfill only fields that are currently empty in Sanity.
      const set = {};
      if (item.rating > 0 && (match.rating == null || match.rating === 0)) set.rating = item.rating;
      if (item.dateRead && !match.dateRead) set.dateRead = item.dateRead;
      if (item.review && !match.review) set.review = item.review;
      if (item.goodreadsUrl && !match.goodreadsUrl) set.goodreadsUrl = item.goodreadsUrl;
      if (item.year && !match.year) set.year = item.year;
      if (item.cover && !match.externalCoverUrl && !match.hasCover) set.externalCoverUrl = item.cover;

      if (Object.keys(set).length > 0) {
        patches.push({ _id: match._id, title: match.title, set });
      }
    } else {
      const uniqueMatches = collapseMatches(matches);
      if (uniqueMatches.length === 0) {
        // No existing title/id match — genuinely new book.
        creates.push(buildCreateDoc(item));
      } else if (
        item.author &&
        !uniqueMatches.some((m) => m.author && authorsMatch(m.author, item.author))
      ) {
        // Same short title, different author (e.g. two unrelated "1984"s) — create.
        creates.push(buildCreateDoc(item));
      } else {
        // Candidates exist but couldn't uniquely match — never invent a duplicate.
        // (Same title + author on draft+published used to fall through and create.)
        console.log(
          `  ! Skipping ambiguous title "${item.title}"${item.author ? ` by ${item.author}` : ''} — ${uniqueMatches.length} existing match(es), not creating`
        );
      }
    }
  }

  console.log(`New books to create: ${creates.length}`);
  console.log(`Existing books to backfill: ${patches.length}\n`);

  if (creates.length > 0) {
    console.log('New books:');
    creates.forEach((d, i) =>
      console.log(`  ${i + 1}. "${d.title}"${d.author ? ` by ${d.author}` : ''}${d.year ? ` (${d.year})` : ''}`)
    );
    console.log('');
  }
  if (patches.length > 0) {
    console.log('Backfills:');
    patches.forEach((p) => console.log(`  - "${p.title}" -> ${Object.keys(p.set).join(', ')}`));
    console.log('');
  }

  if (!process.env.SANITY_TOKEN) {
    console.log('SANITY_TOKEN not set - DRY RUN, no changes written.');
    console.log('  Create an Editor token: https://www.sanity.io/manage/project/am3v0x1c/api');
    console.log('  Then: SANITY_TOKEN=your_token node scripts/sync-goodreads-rss.js');
    const out = path.join(__dirname, 'goodreads-sync-preview.json');
    fs.writeFileSync(out, JSON.stringify({ creates, patches }, null, 2));
    console.log(`\nWrote preview to ${out}`);
    return;
  }

  if (creates.length === 0 && patches.length === 0) {
    console.log('Nothing to sync - already up to date.');
    return;
  }

  const tx = client.transaction();
  for (const doc of creates) tx.createIfNotExists(doc);
  for (const p of patches) tx.patch(p._id, { set: p.set });

  console.log('Committing to Sanity...');
  const result = await tx.commit();
  console.log(
    `Synced: ${creates.length} created, ${patches.length} updated (${result.results.length} mutations).`
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Goodreads sync failed:', err.message);
    process.exit(1);
  });
}

module.exports = {
  matchKey,
  authorsMatch,
  findExistingMatch,
  collapseMatches,
  publishedId,
  cleanTitle,
  cleanReview,
  parseFeed,
};
