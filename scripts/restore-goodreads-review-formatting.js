/**
 * One-off repair for book reviews that lost their <b>/<i> formatting.
 *
 * The Goodreads sync used to strip every HTML tag out of a review before
 * writing it to Sanity, so opening quotes and quote blocks landed as flat
 * text. sync-goodreads-rss.js now keeps the tags the library renders, but the
 * sync only backfills empty fields — it will never rewrite a review already in
 * Sanity. This script does that rewrite once.
 *
 * A review is only rewritten when the stored text is byte-identical to what the
 * old stripper produced from the current feed. Anything edited by hand in
 * Studio fails that check and is left alone.
 *
 * Dry-run when SANITY_TOKEN is not set: prints a diff summary and writes
 * scripts/goodreads-review-formatting-preview.json for review.
 *
 * Run: SANITY_TOKEN=your_token node scripts/restore-goodreads-review-formatting.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const { cleanReview, matchKey, findExistingMatch } = require('./sync-goodreads-rss.js');

const USER_ID = process.env.GOODREADS_USER_ID || '126741914';
const SHELF = process.env.GOODREADS_SHELF || 'read';
const PAGE_SIZE = 100;

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

/**
 * The tag-stripping cleanReview as it stood before the fix. Kept verbatim so a
 * stored review can be recognized as untouched sync output.
 */
function legacyCleanReview(html) {
  if (!html) return null;
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  const decoded = decodeEntities(text).replace(/\n{3,}/g, '\n\n').trim();
  return decoded || null;
}

/**
 * Word content alone, with tags and punctuation dropped. Reviews that came in
 * through the older CSV import lost their curly quotes and dashes as well as
 * their tags, so they no longer match the feed byte for byte even though the
 * writing is untouched.
 */
function wordSignature(text) {
  return text
    .replace(/<\/?[bi]>/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'));
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1];
  return v.trim() || null;
}

async function fetchFeedReviews() {
  const byBookId = new Map();
  const byTitleKey = new Map();
  let page = 1;

  while (true) {
    const url = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${SHELF}&page=${page}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'michelle-liu-goodreads-sync/1.0' },
    });
    if (!res.ok) {
      throw new Error(`Goodreads feed returned ${res.status} ${res.statusText} (${url})`);
    }
    const xml = await res.text();

    let rawCount = 0;
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      rawCount += 1;
      const block = m[1];
      const rawReview = tag(block, 'user_review');
      if (!rawReview) continue;

      const item = {
        bookId: tag(block, 'book_id'),
        title: decodeEntities(tag(block, 'title')) || '',
        author: decodeEntities(tag(block, 'author_name')),
        legacy: legacyCleanReview(rawReview),
        formatted: cleanReview(rawReview),
      };
      if (!item.legacy || item.legacy === item.formatted) continue;

      if (item.bookId) byBookId.set(item.bookId, item);
      const key = matchKey(item.title);
      if (key) {
        if (!byTitleKey.has(key)) byTitleKey.set(key, []);
        byTitleKey.get(key).push(item);
      }
    }

    console.log(`  page ${page}: ${rawCount} items`);
    if (rawCount < PAGE_SIZE) break;
    page += 1;
  }

  return { byBookId, byTitleKey };
}

/** Goodreads book id carried by a stored doc, via goodreadsUrl or its _id. */
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

async function main() {
  console.log(`Reading the "${SHELF}" shelf feed...`);
  const { byBookId, byTitleKey } = await fetchFeedReviews();
  console.log(`${byBookId.size} feed reviews carry formatting the old sync dropped\n`);

  // Filter for a review in JS rather than with defined() in the query — the
  // GROQ filter silently omits recently written docs from this dataset.
  const allBooks = await client.fetch(`
    *[_type == "shelfItem" && mediaType == "book"
      && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
      _id, title, author, review, goodreadsUrl
    }
  `);
  const docs = allBooks.filter((doc) => doc.review);
  console.log(`Checking ${docs.length} stored reviews\n`);

  const patches = [];
  const skipped = [];

  for (const doc of docs) {
    const bookId = bookIdFromDoc(doc);
    const item = bookId
      ? byBookId.get(bookId)
      : findExistingMatch(byTitleKey.get(matchKey(doc.title)) || [], doc);
    if (!item) continue;

    if (doc.review === item.legacy) {
      patches.push({ _id: doc._id, title: doc.title, review: item.formatted, via: 'exact' });
    } else if (
      // Never touch a review that already carries formatting — that emphasis
      // was placed by hand and may not sit where the feed puts it.
      !/<\/?[bi]>/.test(doc.review) &&
      wordSignature(doc.review) === wordSignature(item.formatted)
    ) {
      patches.push({ _id: doc._id, title: doc.title, review: item.formatted, via: 'wording' });
    } else {
      skipped.push({
        _id: doc._id,
        title: doc.title,
        reason: /<\/?[bi]>/.test(doc.review) ? 'already formatted' : 'text differs from feed',
        stored: doc.review,
        feed: item.formatted,
      });
    }
  }

  const byVia = (via) => patches.filter((p) => p.via === via);
  console.log(`Reviews to reformat: ${patches.length}`);
  console.log(`  ${byVia('exact').length} identical to the old sync output`);
  console.log(`  ${byVia('wording').length} same wording, punctuation lost by an older import`);
  patches.forEach((p) => console.log(`  - "${p.title}"`));
  if (skipped.length > 0) {
    console.log(`\nLeft untouched: ${skipped.length}`);
    skipped.forEach((s) => console.log(`  - "${s.title}" (${s.reason})`));
  }
  console.log('');

  if (!process.env.SANITY_TOKEN) {
    const out = path.join(__dirname, 'goodreads-review-formatting-preview.json');
    fs.writeFileSync(out, JSON.stringify({ patches, skipped }, null, 2));
    console.log('SANITY_TOKEN not set - DRY RUN, no changes written.');
    console.log(`Wrote preview to ${out}`);
    return;
  }

  if (patches.length === 0) {
    console.log('Nothing to reformat.');
    return;
  }

  const tx = client.transaction();
  for (const p of patches) tx.patch(p._id, { set: { review: p.review } });

  console.log('Committing to Sanity...');
  const result = await tx.commit();
  console.log(`Reformatted ${result.results.length} reviews.`);
}

main().catch((err) => {
  console.error('Review formatting repair failed:', err.message);
  process.exit(1);
});
