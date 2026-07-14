const assert = require('node:assert/strict');
const test = require('node:test');

const {
  findExistingMatch,
  authorsMatch,
  matchKey,
  collapseMatches,
  publishedId,
} = require('./sync-goodreads-rss.js');

const bookA = { _id: 'a', title: '1984', author: 'George Orwell' };
const bookB = { _id: 'b', title: '1984', author: 'Haruki Murakami' };

test('single title match returns that shelfItem', () => {
  const match = findExistingMatch([bookA], { author: 'George Orwell' });
  assert.equal(match, bookA);
});

test('disambiguates duplicate titles by author', () => {
  const match = findExistingMatch([bookA, bookB], { author: 'Haruki Murakami' });
  assert.equal(match._id, 'b');
});

test('does not fall back to first entry when feed item has no author', () => {
  const match = findExistingMatch([bookA, bookB], { author: null });
  assert.equal(match, null);
});

test('does not fall back to first entry when author matches none of the candidates', () => {
  const match = findExistingMatch([bookA, bookB], { author: 'Someone Else' });
  assert.equal(match, null);
});

test('authorsMatch equates full names and longer variants', () => {
  assert.equal(authorsMatch('Mary Shelley', 'Mary Wollstonecraft Shelley'), true);
  assert.equal(authorsMatch('George Orwell', 'Haruki Murakami'), false);
  assert.equal(matchKey('1984!'), '1984');
});

test('matchKey strips subtitles so long Goodreads titles match short library titles', () => {
  assert.equal(
    matchKey('Being Mortal: Medicine and What Matters in the End'),
    matchKey('Being Mortal')
  );
  assert.equal(
    matchKey("A Book of Five Rings: The Classic Guide to Strategy"),
    matchKey('A Book of Five Rings')
  );
  assert.equal(
    matchKey('Four Thousand Weeks: Time Management for Mortals'),
    'four thousand weeks'
  );
});

test('publishedId strips drafts and versions prefixes', () => {
  assert.equal(publishedId('abc'), 'abc');
  assert.equal(publishedId('drafts.abc'), 'abc');
  assert.equal(publishedId('versions.release1.abc'), 'abc');
});

test('collapseMatches merges draft+published into one published doc', () => {
  const published = { _id: 'abc', title: 'Being Mortal', author: 'Atul Gawande' };
  const draft = { _id: 'drafts.abc', title: 'Being Mortal', author: 'Atul Gawande' };
  const collapsed = collapseMatches([draft, published]);
  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0]._id, 'abc');
});

test('draft+published pair with same author matches instead of looking ambiguous', () => {
  const published = { _id: 'abc', title: 'Being Mortal', author: 'Atul Gawande' };
  const draft = { _id: 'drafts.abc', title: 'Being Mortal', author: 'Atul Gawande' };
  const match = findExistingMatch([draft, published], { author: 'Atul Gawande' });
  assert.equal(match._id, 'abc');
});
