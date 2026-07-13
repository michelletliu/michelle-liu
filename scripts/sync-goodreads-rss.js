/**
 * Sync books from a Goodreads "read" shelf RSS feed into Sanity shelfItem docs.
 *
 * - Creates new book shelfItems that don't exist yet (matched by cleaned title).
 * - Backfills ONLY missing metadata (rating, dateRead, review, goodreadsUrl, cover)
 *   on existing books, so it never clobbers values curated by hand in Studio.
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
const FEED_URL = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${SHELF}`;

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

function matchKey(title) {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    const addedDate = parseDate(tag(b, 'user_date_added'));
    const cover = tag(b, 'book_large_image_url') || tag(b, 'book_image_url');

    items.push({
      bookId,
      title: cleanTitle(rawTitle),
      matchKey: matchKey(rawTitle),
      author: decodeEntities(tag(b, 'author_name')),
      rating,
      dateRead: readDate ? readDate.iso : null,
      year: (readDate || addedDate || {}).year || null,
      review: cleanReview(tag(b, 'user_review')),
      goodreadsUrl: bookId ? `https://www.goodreads.com/book/show/${bookId}` : null,
      // Goodreads serves a "nophoto" placeholder when a book has no cover.
      cover: cover && !/nophoto/i.test(cover) ? cover : null,
      isFavorite: isFavoriteShelf(tag(b, 'user_shelves')),
    });
  }
  return items;
}

async function fetchFeed() {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'michelle-liu-goodreads-sync/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Goodreads feed returned ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function main() {
  console.log(`Goodreads sync - feed: ${FEED_URL}\n`);

  const xml = await fetchFeed();
  const feedBooks = parseFeed(xml);
  console.log(`Parsed ${feedBooks.length} books from the "${SHELF}" shelf`);

  const existing = await client.fetch(`
    *[_type == "shelfItem" && mediaType == "book"]{
      _id, title, author, rating, dateRead, review, goodreadsUrl,
      externalCoverUrl, year, isLibraryFavorite, "hasCover": defined(cover)
    }
  `);
  console.log(`Found ${existing.length} existing book shelfItems in Sanity\n`);

  const byTitle = new Map();
  for (const book of existing) {
    const key = matchKey(book.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(book);
  }

  const creates = [];
  const patches = [];

  for (const item of feedBooks) {
    const matches = byTitle.get(item.matchKey);

    if (matches && matches.length > 0) {
      // Disambiguate by author's first name when a title has multiple matches.
      let match = matches[0];
      if (matches.length > 1 && item.author) {
        const first = matchKey(item.author).split(' ')[0];
        const byAuthor = matches.find(
          (mm) => mm.author && matchKey(mm.author).includes(first)
        );
        if (byAuthor) match = byAuthor;
      }

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
      creates.push(doc);
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

main().catch((err) => {
  console.error('Goodreads sync failed:', err.message);
  process.exit(1);
});
