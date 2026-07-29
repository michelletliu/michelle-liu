/**
 * Backfill `dateStarted` on book shelfItems from Goodreads reading sessions.
 *
 * The RSS feed the daily sync reads only carries a finish date (`user_read_at`),
 * so every book landed in Sanity with `dateRead` alone and the Library modal had
 * nothing to render a "Dates Read" range from. Goodreads does record the start
 * of each reading session, but only behind a signed-in page — see below.
 *
 * Input: scripts/goodreads-reading-dates.json, an array of
 *   { bookId, title, started, read }  (ISO dates, null when unset)
 *
 * To regenerate it, sign in to Goodreads and run this in the browser console on
 * any goodreads.com page. The My Books table renders a `date_started` cell for
 * every row even when the column is hidden in your display settings, and each
 * cell's edit link carries the ISO date:
 *
 *   const iso = (cell) => [...(cell?.querySelectorAll('a[onclick]') || [])]
 *     .map((a) => (a.getAttribute('onclick').match(/value:\s*"(\d{4}-\d{2}-\d{2})"/) || [])[1])
 *     .filter(Boolean);
 *   const out = [];
 *   for (let page = 1; page <= 8; page++) {
 *     const res = await fetch(`/review/list/126741914?shelf=read&per_page=100&page=${page}`);
 *     const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
 *     const rows = [...doc.querySelectorAll('tr.bookalike')].map((row) => {
 *       const a = row.querySelector('td.field.title a[href*="/book/show/"]');
 *       const started = iso(row.querySelector('td.field.date_started'));
 *       const read = iso(row.querySelector('td.field.date_read'));
 *       return {
 *         bookId: (a.getAttribute('href').match(/\/book\/show\/(\d+)/) || [])[1],
 *         title: a.getAttribute('title'),
 *         started: started.length ? started.sort()[0] : null,
 *         read: read.length ? read.sort().at(-1) : null,
 *       };
 *     });
 *     out.push(...rows);
 *     if (rows.length < 100) break;
 *   }
 *   copy(JSON.stringify(out, null, 2));
 *
 * A book re-read across several sessions gets the earliest start and the latest
 * finish, so the range covers the whole history rather than one session.
 *
 * Dry-run when SANITY_TOKEN is not set: prints the plan and writes
 * scripts/reading-dates-preview.json.
 *
 * Run: SANITY_TOKEN=your_token node scripts/backfill-reading-dates.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const { matchKey } = require('./sync-goodreads-rss.js');

const INPUT = path.join(__dirname, 'goodreads-reading-dates.json');

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

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
  const feed = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

  // Only a range spanning more than one day is worth rendering — a book started
  // and finished the same day reads better as the plain "Date Read" line.
  const usable = feed.filter((r) => r.bookId && r.started && r.read && r.started < r.read);
  const byBookId = new Map(usable.map((r) => [r.bookId, r]));
  const byTitleKey = new Map();
  for (const r of usable) {
    const key = matchKey(r.title || '');
    if (!key) continue;
    if (!byTitleKey.has(key)) byTitleKey.set(key, []);
    byTitleKey.get(key).push(r);
  }

  console.log(`${feed.length} Goodreads rows, ${usable.length} with a multi-day range\n`);

  // Filter for books in JS rather than with defined() in the query — the GROQ
  // filter silently omits recently written docs from this dataset.
  const books = (
    await client.fetch(`
      *[_type == "shelfItem" && mediaType == "book"
        && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
        _id, title, dateStarted, dateRead, dateFinished, goodreadsUrl
      }
    `)
  ).filter((doc) => doc.title);
  console.log(`Checking ${books.length} book shelfItems\n`);

  const patches = [];
  const conflicts = [];
  let unmatched = 0;

  for (const doc of books) {
    const bookId = bookIdFromDoc(doc);
    let row = bookId ? byBookId.get(bookId) : null;
    if (!row) {
      // Fall back to title, but only when it identifies exactly one book.
      const candidates = byTitleKey.get(matchKey(doc.title)) || [];
      if (candidates.length === 1) row = candidates[0];
    }
    if (!row) {
      unmatched += 1;
      continue;
    }

    if (doc.dateStarted && doc.dateStarted !== row.started) {
      // Set by hand in Studio and disagrees with Goodreads — leave it.
      conflicts.push({ title: doc.title, stored: doc.dateStarted, goodreads: row.started });
      continue;
    }
    if (doc.dateStarted === row.started) continue;

    const finished = doc.dateFinished || doc.dateRead;
    if (finished && finished <= row.started) {
      // Would render a backwards or zero-length range against what's stored.
      conflicts.push({ title: doc.title, stored: `finished ${finished}`, goodreads: row.started });
      continue;
    }

    patches.push({ _id: doc._id, title: doc.title, dateStarted: row.started, finished });
  }

  console.log(`Books gaining a date range: ${patches.length}`);
  patches.forEach((p) => console.log(`  - "${p.title}" ${p.dateStarted} -> ${p.finished}`));
  console.log(`\nNo Goodreads start date, staying on a single date: ${unmatched}`);
  if (conflicts.length > 0) {
    console.log(`\nLeft untouched (disagrees with what's stored): ${conflicts.length}`);
    conflicts.forEach((c) => console.log(`  - "${c.title}" stored ${c.stored}, Goodreads ${c.goodreads}`));
  }
  console.log('');

  if (!process.env.SANITY_TOKEN) {
    const out = path.join(__dirname, 'reading-dates-preview.json');
    fs.writeFileSync(out, JSON.stringify({ patches, conflicts }, null, 2));
    console.log('SANITY_TOKEN not set - DRY RUN, no changes written.');
    console.log(`Wrote preview to ${out}`);
    return;
  }

  if (patches.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  const tx = client.transaction();
  for (const p of patches) tx.patch(p._id, { set: { dateStarted: p.dateStarted } });

  console.log('Committing to Sanity...');
  const result = await tx.commit();
  console.log(`Backfilled ${result.results.length} start dates.`);
}

main().catch((err) => {
  console.error('Reading date backfill failed:', err.message);
  process.exit(1);
});
