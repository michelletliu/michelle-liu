const assert = require('node:assert/strict');
const test = require('node:test');

const {
  findExistingMatch,
  authorsMatch,
  matchKey,
  collapseMatches,
  publishedId,
  cleanReview,
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

test('cleanReview keeps the bold and italic the library renders', () => {
  assert.equal(
    cleanReview('<b>An opening quote.</b><br /><br />Then the review.'),
    '<b>An opening quote.</b>\n\nThen the review.'
  );
  assert.equal(cleanReview('<i>Emphasis.</i>'), '<i>Emphasis.</i>');
});

test('cleanReview normalizes tag aliases and casing', () => {
  assert.equal(cleanReview('<STRONG>Loud</STRONG>'), '<b>Loud</b>');
  assert.equal(cleanReview('<em>Soft</em>'), '<i>Soft</i>');
  assert.equal(cleanReview('<B>Loud</B>'), '<b>Loud</b>');
});

test('cleanReview flattens tags the renderer does not support', () => {
  assert.equal(
    cleanReview('<blockquote>Quoted</blockquote>'),
    'Quoted'
  );
  assert.equal(cleanReview('<u>Underlined</u>'), 'Underlined');
  assert.equal(
    cleanReview('<a href="https://example.com">A link</a>'),
    'A link'
  );
});

test('cleanReview drops unmatched tags that would render as literal text', () => {
  assert.equal(cleanReview('An <i>unclosed quote.'), 'An unclosed quote.');
  assert.equal(cleanReview('A stray close.</b>'), 'A stray close.');
  assert.equal(
    cleanReview('<b>Kept</b> but <i>stray'),
    '<b>Kept</b> but stray'
  );
});

test('cleanReview pulls the padding out of Goodreads quote blocks', () => {
  assert.equal(
    cleanReview('<i><br />A quoted line.<br /></i>'),
    '<i>A quoted line.</i>'
  );
});

test('cleanReview collapses whitespace-only lines left by removed block tags', () => {
  assert.equal(
    cleanReview('One<br />  <br />  <br />Two'),
    'One\n\nTwo'
  );
});

test('cleanReview closes and reopens tags around a divider line', () => {
  assert.equal(
    cleanReview('<i>A quote.<br /><br />---<br /><br />Another quote.</i>'),
    '<i>A quote.</i>\n\n---\n\n<i>Another quote.</i>'
  );
});

test('cleanReview still decodes entities and returns null for empty reviews', () => {
  assert.equal(cleanReview('Tom &amp; Jerry&apos;s'), "Tom & Jerry's");
  assert.equal(cleanReview(''), null);
  assert.equal(cleanReview('<br /><br />'), null);
});
