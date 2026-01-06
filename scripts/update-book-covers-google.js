#!/usr/bin/env node
/**
 * Script to update shelf item book covers using Google Books API
 * Google Books API provides high-quality cover images
 * 
 * Usage: node scripts/update-book-covers-google.js
 * 
 * Requires SANITY_TOKEN environment variable for write access
 */

const https = require('https');

// Configuration
const SANITY_PROJECT_ID = 'am3v0x1c';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Helper to make HTTPS requests
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// Search Google Books API for a book cover
async function getGoogleBooksCover(title, author) {
  const query = encodeURIComponent(`${title} ${author || ''}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
  
  try {
    const data = await httpsGet(url);
    if (data?.items?.[0]?.volumeInfo?.imageLinks) {
      const imageLinks = data.items[0].volumeInfo.imageLinks;
      // Prefer larger images, fallback to thumbnail
      // Remove edge=curl and zoom parameters for cleaner images
      let coverUrl = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail;
      if (coverUrl) {
        // Convert to HTTPS and get larger image
        coverUrl = coverUrl.replace('http://', 'https://');
        // Remove zoom=1 to get larger image, or set zoom=2 for bigger
        coverUrl = coverUrl.replace('&edge=curl', '');
        // Try to get a larger version
        if (coverUrl.includes('zoom=1')) {
          coverUrl = coverUrl.replace('zoom=1', 'zoom=2');
        }
        return coverUrl;
      }
    }
    return null;
  } catch (error) {
    console.error(`  Error fetching cover for "${title}":`, error.message);
    return null;
  }
}

// Sanity API helper
async function sanityFetch(query, params = {}) {
  const token = process.env.SANITY_TOKEN;
  const encodedQuery = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}`;
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Sanity mutation helper
async function sanityMutate(mutations) {
  const token = process.env.SANITY_TOKEN;
  if (!token) throw new Error('SANITY_TOKEN required');
  
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ mutations });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Add delay to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('📚 Updating book covers with Google Books API...\n');
  
  // Check for token
  if (!process.env.SANITY_TOKEN) {
    console.log('⚠️  SANITY_TOKEN not set. Running in DRY RUN mode.\n');
    console.log('To update covers, run:');
    console.log('  SANITY_TOKEN=your-token node scripts/update-book-covers-google.js\n');
  }
  
  // Fetch all books from Sanity
  const books = await sanityFetch(`
    *[_type == "shelfItem" && mediaType == "book" && isPublished == true] | order(year desc) {
      _id,
      title,
      author,
      year,
      externalCoverUrl
    }
  `);
  
  console.log(`Found ${books.length} books to process\n`);
  
  // Group by year for progress tracking
  const booksByYear = {};
  books.forEach(book => {
    const year = book.year || 'unknown';
    if (!booksByYear[year]) booksByYear[year] = [];
    booksByYear[year].push(book);
  });
  
  console.log('Books by year:');
  Object.entries(booksByYear).sort((a, b) => b[0].localeCompare(a[0])).forEach(([year, yearBooks]) => {
    console.log(`  ${year}: ${yearBooks.length} books`);
  });
  console.log('');
  
  // Process books and find covers
  const updates = [];
  let processed = 0;
  let found = 0;
  let notFound = 0;
  
  for (const book of books) {
    processed++;
    const progress = `[${processed}/${books.length}]`;
    
    // Search for cover
    const coverUrl = await getGoogleBooksCover(book.title, book.author);
    
    if (coverUrl) {
      found++;
      console.log(`${progress} ✓ Found cover for "${book.title}"`);
      
      if (coverUrl !== book.externalCoverUrl) {
        updates.push({
          patch: {
            id: book._id,
            set: { externalCoverUrl: coverUrl }
          }
        });
      }
    } else {
      notFound++;
      console.log(`${progress} ✗ No cover found for "${book.title}" by ${book.author || 'Unknown'}`);
    }
    
    // Rate limit: 100 requests per 100 seconds for Google Books API
    await delay(150);
  }
  
  console.log(`\n📊 Results:`);
  console.log(`  Found covers: ${found}`);
  console.log(`  Missing covers: ${notFound}`);
  console.log(`  Updates needed: ${updates.length}`);
  
  // Apply updates if token is provided
  if (process.env.SANITY_TOKEN && updates.length > 0) {
    console.log(`\n📝 Applying ${updates.length} updates to Sanity...`);
    
    // Batch updates (max 100 per request)
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      try {
        await sanityMutate(batch);
        console.log(`  Updated ${Math.min(i + batchSize, updates.length)}/${updates.length} books`);
      } catch (error) {
        console.error(`  Error updating batch:`, error.message);
      }
    }
    
    console.log('\n✅ Done! Cover images updated.');
  } else if (updates.length > 0) {
    console.log(`\n📋 DRY RUN: Would update ${updates.length} books`);
    console.log('\nSample updates:');
    updates.slice(0, 5).forEach(u => {
      const book = books.find(b => b._id === u.patch.id);
      console.log(`  - "${book?.title}": ${u.patch.set.externalCoverUrl?.substring(0, 60)}...`);
    });
  }
}

main().catch(console.error);
