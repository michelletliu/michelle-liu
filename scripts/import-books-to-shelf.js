/**
 * Script to import books from parsed-books.json into Sanity as shelf items.
 * This adds all books read from 2020-2025 (and 2026) to the bookshelf section.
 * 
 * Run with: node scripts/import-books-to-shelf.js
 */

const { createClient } = require('@sanity/client');
const parsedBooks = require('./parsed-books.json');
const bookCovers = require('./book-covers.json');

// Sanity client configuration
const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // You need to set this environment variable
});

// Create a map from title to cover URL for quick lookup
const coverMap = new Map();
bookCovers.forEach(book => {
  if (book.coverUrl) {
    coverMap.set(book.title, book.coverUrl);
  }
});

// Generate a slug-like ID from the title
function generateId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 96);
}

// Filter books to only include those with dateFinished in years 2020-2026
const booksToImport = parsedBooks.filter(book => {
  if (!book.dateFinished) return false;
  const year = parseInt(book.dateFinished.substring(0, 4));
  return year >= 2020 && year <= 2026;
});

console.log(`Found ${booksToImport.length} books to import (2020-2026)`);

// Group by year for reporting
const byYear = {};
booksToImport.forEach(book => {
  const year = book.dateFinished.substring(0, 4);
  byYear[year] = (byYear[year] || 0) + 1;
});
console.log('Books by year:', byYear);

async function importBooks() {
  // First, check what shelf items already exist
  const existingItems = await client.fetch(`*[_type == "shelfItem" && mediaType == "book"]{title}`);
  const existingTitles = new Set(existingItems.map(item => item.title));
  
  console.log(`\nFound ${existingItems.length} existing book shelf items`);
  
  // Filter out books that already exist
  const newBooks = booksToImport.filter(book => !existingTitles.has(book.title));
  console.log(`${newBooks.length} new books to import (${booksToImport.length - newBooks.length} already exist)`);
  
  if (newBooks.length === 0) {
    console.log('No new books to import!');
    return;
  }
  
  // Create shelf items for each new book
  const transaction = client.transaction();
  
  newBooks.forEach((book, index) => {
    const year = book.dateFinished.substring(0, 4);
    const coverUrl = coverMap.get(book.title);
    
    const shelfItem = {
      _id: `shelfItem-book-${generateId(book.title)}`,
      _type: 'shelfItem',
      title: book.title,
      mediaType: 'book',
      author: book.author,
      year: year,
      rating: book.rating || 3,
      isFeatured: false,
      isPublished: true,
      order: index + 1,
    };
    
    // Add external cover URL if available
    if (coverUrl) {
      shelfItem.externalCoverUrl = coverUrl;
    }
    
    transaction.createIfNotExists(shelfItem);
  });
  
  console.log('\nCommitting transaction...');
  
  try {
    const result = await transaction.commit();
    console.log(`Successfully imported ${newBooks.length} books!`);
    console.log('Transaction result:', result);
  } catch (error) {
    console.error('Error importing books:', error.message);
    throw error;
  }
}

// Check for token
if (!process.env.SANITY_TOKEN) {
  console.log('\n⚠️  SANITY_TOKEN environment variable not set.');
  console.log('To run this script, you need a Sanity API token with write access.');
  console.log('\nTo create a token:');
  console.log('1. Go to https://www.sanity.io/manage/project/am3v0x1c/api');
  console.log('2. Create a new token with "Editor" permissions');
  console.log('3. Run: SANITY_TOKEN=your-token node scripts/import-books-to-shelf.js');
  console.log('\n--- DRY RUN OUTPUT ---');
  console.log(`Would import ${booksToImport.length} books`);
  
  // Show sample of what would be imported
  console.log('\nSample books to import:');
  booksToImport.slice(0, 5).forEach((book, i) => {
    const year = book.dateFinished.substring(0, 4);
    const coverUrl = coverMap.get(book.title);
    console.log(`${i + 1}. "${book.title}" by ${book.author} (${year})${coverUrl ? ' [has cover]' : ' [no cover]'}`);
  });
  
  process.exit(0);
}

importBooks().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
