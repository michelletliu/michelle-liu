const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  dedupeMovies,
  fetchLetterboxdFeed,
  findExistingMatch,
  letterboxdSlug,
  normalizeTitle,
  parseFeed,
  parseTmdbId,
  planMutations,
  publishedId,
  resolvePoster,
} = require('./sync-letterboxd-rss.js');

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/letterboxd-rss.xml'),
  'utf8'
);

test('parses Letterboxd namespaced fields and encoded text', () => {
  const [movie] = parseFeed(fixture);
  assert.equal(movie.title, 'Mr. & Mrs. Smith');
  assert.equal(movie.watchedDate, '2026-06-19');
  assert.equal(movie.watchedYear, '2026');
  assert.equal(movie.rating, 4);
  assert.equal(movie.tmdbId, 787);
  assert.equal(movie.letterboxdSlug, 'mr-mrs-smith-2005');
  assert.match(movie.rssPosterUrl, /^https:\/\/a\.ltrbxd\.com\//);
});

test('extracts the film slug from normal and rewatch URLs', () => {
  assert.equal(
    letterboxdSlug('https://letterboxd.com/liumichelle/film/mulholland-drive/1/'),
    'mulholland-drive'
  );
});

test('represents a missing member rating as null', () => {
  const movie = parseFeed(fixture).find((item) => item.title === 'Unrated Film');
  assert.equal(movie.rating, null);
});

test('parses half-star Letterboxd ratings', () => {
  const xml = '<rss><channel><item>'
    + '<letterboxd:filmTitle>Half Star</letterboxd:filmTitle>'
    + '<letterboxd:memberRating>0.5</letterboxd:memberRating>'
    + '<tmdb:movieId>123</tmdb:movieId>'
    + '</item></channel></rss>';
  assert.equal(parseFeed(xml)[0].rating, 0.5);
});

test('accepts only positive whole-number TMDb IDs', () => {
  for (const invalid of [undefined, null, '', 'abc', '787abc', 0, '0', -1, '-1', NaN, 1.5, '1.5']) {
    assert.equal(parseTmdbId(invalid), null);
  }
  assert.equal(parseTmdbId('787'), 787);
  assert.equal(parseTmdbId(787), 787);
});

test('malformed TMDb values cannot become IDs, keys, document IDs, or patch values', () => {
  for (const raw of ['abc', '787abc', '0', '-5']) {
    const xml = '<rss><channel><item>'
      + `<letterboxd:filmTitle>Invalid ${raw}</letterboxd:filmTitle>`
      + `<link>https://letterboxd.com/liumichelle/film/invalid-${encodeURIComponent(raw)}/</link>`
      + `<tmdb:movieId>${raw}</tmdb:movieId>`
      + '</item></channel></rss>';
    const [item] = parseFeed(xml);

    assert.equal(item.tmdbId, null);
    assert.equal(
      dedupeMovies([item, {...item, title: `Duplicate ${raw}`, tmdbId: null}]).length,
      1
    );
    assert.doesNotMatch(
      planMutations([], [item]).creates[0]._id,
      /tmdb/
    );
    const {patches} = planMutations(
      [{_id: `existing-${raw}`, title: item.title}],
      [item]
    );
    assert.equal(patches[0]?.set.tmdbId, undefined);
  }
});

test('keeps the newest diary entry for repeated films', () => {
  const items = parseFeed(fixture);
  const deduped = dedupeMovies(items);
  assert.equal(deduped.filter((item) => item.tmdbId === 787).length, 1);
  assert.equal(deduped.find((item) => item.tmdbId === 787).watchedDate, '2026-06-19');
});

test('normalizes punctuation and collapses document prefixes', () => {
  assert.equal(normalizeTitle('Mr. & Mrs. Smith'), 'mr mrs smith');
  assert.equal(publishedId('drafts.movie'), 'movie');
  assert.equal(publishedId('versions.release.movie'), 'movie');
});

test('matches by TMDb ID before slug or title', () => {
  const existing = [
    {_id: 'wrong', title: 'Different', tmdbId: 787},
    {_id: 'slug', title: 'Mr. & Mrs. Smith', letterboxdSlug: 'mr-mrs-smith-2005'},
  ];
  assert.equal(findExistingMatch(existing, {tmdbId: 787})._id, 'wrong');
});

test('uses a unique normalized title fallback and rejects ambiguity', () => {
  assert.equal(
    findExistingMatch([{_id: 'one', title: 'Before Sunrise'}], {
      title: 'Before Sunrise',
      tmdbId: 76,
      letterboxdSlug: 'before-sunrise',
    })._id,
    'one'
  );
  assert.equal(
    findExistingMatch([
      {_id: 'one', title: 'Crash'},
      {_id: 'two', title: 'Crash'},
    ], {title: 'Crash'}),
    null
  );
});

test('creates deterministic movie documents', () => {
  const {creates} = planMutations([], [{
    title: 'Before Sunrise',
    watchedDate: '2026-06-19',
    watchedYear: '2026',
    rating: 3,
    letterboxdSlug: 'before-sunrise',
    tmdbId: 76,
    rssPosterUrl: 'https://a.ltrbxd.com/poster.jpg',
  }]);
  assert.equal(creates[0]._id, 'shelfItem-movie-tmdb-76');
  assert.equal(creates[0].isFeatured, false);
  assert.equal(creates[0].isPublished, true);
  assert.equal(creates[0].year, '2026');
  assert.equal(creates[0].dateWatched, '2026-06-19');
});

test('updates authoritative fields and preserves curated fields', () => {
  const existing = [{
    _id: 'movie',
    title: 'Before Sunrise',
    year: '2025',
    dateWatched: '2025-01-01',
    rating: 5,
    order: 12,
    isFeatured: true,
    hasCover: true,
  }];
  const {patches} = planMutations(existing, [{
    title: 'Before Sunrise',
    watchedDate: '2026-06-19',
    watchedYear: '2026',
    rating: 3,
    letterboxdSlug: 'before-sunrise',
    tmdbId: 76,
  }]);
  assert.deepEqual(patches[0].set, {
    year: '2026',
    dateWatched: '2026-06-19',
    rating: 3,
    letterboxdSlug: 'before-sunrise',
    tmdbId: 76,
  });
  assert.equal('order' in patches[0].set, false);
  assert.equal('isFeatured' in patches[0].set, false);
});

test('unsets an existing rating when Letterboxd is unrated', () => {
  const {patches} = planMutations(
    [{_id: 'movie', title: 'Unrated Film', rating: 4}],
    [{title: 'Unrated Film', rating: null}]
  );
  assert.deepEqual(patches[0].unset, ['rating']);
});

test('preserves an existing rating when the feed omits rating', () => {
  const {patches} = planMutations(
    [{_id: 'movie', title: 'Unrated Film', rating: 4}],
    [{title: 'Unrated Film'}]
  );
  assert.equal(patches.length, 0);
});

test('patches the published document when a version appears first', () => {
  const {patches} = planMutations(
    [
      {_id: 'versions.release.movie', title: 'Before Sunrise', rating: 5},
      {_id: 'movie', title: 'Before Sunrise', rating: 5},
    ],
    [{title: 'Before Sunrise', rating: 3}]
  );
  assert.equal(patches[0]._id, 'movie');
});

test('skips a second feed film that claims an already planned document', () => {
  const existing = [{_id: 'movie', title: 'Shared Title', rating: 5}];
  const first = {
    title: 'Shared Title',
    rating: 4,
    tmdbId: 101,
    letterboxdSlug: 'first-film',
  };
  const second = {
    title: 'Shared Title',
    rating: 3,
    tmdbId: 202,
    letterboxdSlug: 'second-film',
  };

  const plan = planMutations(existing, [first, second]);
  assert.equal(plan.patches.length, 1);
  assert.equal(plan.patches[0]._id, 'movie');
  assert.deepEqual(plan.skipped, [second]);
});

test('warns and skips RSS items without a dedupe key', () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    assert.deepEqual(dedupeMovies([{title: 'Keyless Film', pubDate: null}]), []);
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(warnings, ['Skipping invalid Letterboxd item without TMDb ID or slug: Keyless Film']);
});

test('uses TMDb poster path when enrichment succeeds', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({poster_path: '/poster.jpg'}),
  });
  assert.equal(
    await resolvePoster({tmdbId: 76, rssPosterUrl: 'rss'}, fetchImpl, 'key'),
    'https://image.tmdb.org/t/p/w500/poster.jpg'
  );
});

test('falls back to the RSS poster when TMDb is unavailable', async () => {
  const fetchImpl = async () => ({ok: false, status: 503});
  assert.equal(
    await resolvePoster({tmdbId: 76, rssPosterUrl: 'rss'}, fetchImpl, 'key'),
    'rss'
  );
});

test('rejects a malformed feed with mismatched tags', async () => {
  const malformed = '<?xml version="1.0"?><rss><channel><item></channel></item></rss>';
  const fetchImpl = async () => ({
    ok: true,
    text: async () => malformed,
  });

  await assert.rejects(
    fetchLetterboxdFeed(fetchImpl),
    /valid RSS feed/
  );
});

test('accepts the valid Letterboxd fixture', async () => {
  const fetchImpl = async () => ({
    ok: true,
    text: async () => fixture,
  });

  assert.equal(await fetchLetterboxdFeed(fetchImpl), fixture);
});

test('accepts RSS comments and self-closing elements', async () => {
  const xml = '<?xml version="1.0"?><rss><channel><!-- valid --><atom:link href="https://example.com" /></channel></rss>';
  const fetchImpl = async () => ({
    ok: true,
    text: async () => xml,
  });

  assert.equal(await fetchLetterboxdFeed(fetchImpl), xml);
});

test('rejects RSS containing a DOCTYPE', async () => {
  const xml = '<?xml version="1.0"?><!DOCTYPE rss><rss><channel></channel></rss>';
  const fetchImpl = async () => ({
    ok: true,
    text: async () => xml,
  });

  await assert.rejects(fetchLetterboxdFeed(fetchImpl), /valid RSS feed/);
});
