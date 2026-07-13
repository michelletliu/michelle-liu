const assert = require('node:assert/strict');
const test = require('node:test');

const { findExistingMatch, authorsMatch, matchKey } = require('./sync-goodreads-rss.js');

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
