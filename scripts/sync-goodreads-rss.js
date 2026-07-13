/**
 * Sync books from a Goodreads "read" shelf RSS feed into Sanity shelfItem docs.
 *
 * - Creates new book shelfItems that don't exist yet (matched by Goodreads
 *   book id when available, otherwise cleaned title + author disambiguation).
 * - Backfills ONLY missing metadata (rating, dateRead, review, goodreadsUrl, cover)
 *   on existing books, so it never clobbers values curated by hand in Studio.
 * - When several Sanity books share a title, author must uniquely match;
 *   otherwise the feed item is skipped or created — never patched onto matches[0].
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

function cleanReview(html) {
  if (!html) return null;
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  const decoded = decodeEntities(text).replace(/\n{3,}/g, '\n\n').trim();
  return decoded || null;
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

/**
 * Pick the Sanity shelfItem for a Goodreads feed item.
 * When several books share a normalized title, author must disambiguate —
 * never fall back to matches[0], which can write metadata to the wrong doc.
 */
function findExistingMatch(matches, item) {
  if (!matches || matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple books share this title — require a unique author match.
  if (!item.author) return null;

  const byAuthor = matches.filter(
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

function parseFeed(xml) {
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
    if (!readDate) continue;
    const cover = tag(b, 'book_large_image_url') || tag(b, 'book_image_url');

    items.push({
      bookId,
      title: cleanTitle(rawTitle),
      matchKey: matchKey(rawTitle),
      author: decodeEntities(tag(b, 'author_name')),
      rating,
      dateRead: readDate.iso,
      year: readDate.year,
      review: cleanReview(tag(b, 'user_review')),
      goodreadsUrl: bookId ? `https://www.goodreads.com/book/show/${bookId}` : null,
      // Goodreads serves a "nophoto" placeholder when a book has no cover.
      cover: cover && !/nophoto/i.test(cover) ? cover : null,
      isFavorite: isFavoriteShelf(tag(b, 'user_shelves')),
    });
  }
  return items;
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
// returns fewer than PAGE_SIZE (or zero), then dedupe by bookId.
async function fetchAllFeedBooks() {
  const all = [];
  const seen = new Set();
  let page = 1;

  while (true) {
    const xml = await fetchFeedPage(page);
    const items = parseFeed(xml);
    console.log(`  page ${page}: ${items.length} items`);

    for (const item of items) {
      const key = item.bookId || item.matchKey;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(item);
    }

    if (items.length < PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

async function main() {
  console.log(`Goodreads sync - feed: ${FEED_BASE} (paginated)\n`);

  const feedBooks = await fetchAllFeedBooks();
  console.log(`Parsed ${feedBooks.length} books from the "${SHELF}" shelf\n`);

  const existing = await client.fetch(`
    *[_type == "shelfItem" && mediaType == "book"]{
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
    } else if (matches.length > 1 && !item.author) {
      // Same title, no author on the feed item — do not guess among candidates.
      console.log(
        `  ! Skipping ambiguous title "${item.title}" — ${matches.length} matches, no author to disambiguate`
      );
    } else {
      // No title match, or author didn't match any candidate (different book).
      if (matches.length > 1) {
        console.log(
          `  ! Ambiguous title "${item.title}" by ${item.author} — no author match among ${matches.length}; creating new doc`
        );
      }
      creates.push(buildCreateDoc(item));
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
  cleanTitle,
  parseFeed,
};
