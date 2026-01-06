#!/usr/bin/env node
/**
 * Script to update all shelf item book covers using Google Books API
 * Tests existing covers and replaces broken ones
 * 
 * Usage: node scripts/update-all-covers-google.js
 */

const https = require('https');
const http = require('http');

// Configuration
const SANITY_PROJECT_ID = 'am3v0x1c';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Helper to make HTTPS requests
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: null });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
  });
}

// Test if an image URL is valid (returns 200)
async function testImageUrl(url) {
  if (!url) return false;
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Search Google Books API for a book cover
async function searchGoogleBooks(title, author) {
  const query = encodeURIComponent(`${title} ${author || ''}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`;
  
  try {
    const result = await httpsGet(url);
    if (result.data?.items) {
      for (const item of result.data.items) {
        const imageLinks = item.volumeInfo?.imageLinks;
        if (imageLinks) {
          // Prefer larger images
          let cover = imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail;
          if (cover) {
            // Upgrade to HTTPS and larger zoom
            cover = cover.replace('http://', 'https://');
            cover = cover.replace('zoom=1', 'zoom=2');
            cover = cover.replace('&edge=curl', ''); // Remove curl effect
            return cover;
          }
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Fetch all books from Sanity
async function fetchAllBooks() {
  const query = encodeURIComponent('*[_type == "shelfItem" && mediaType == "book" && isPublished == true]{_id, title, author, externalCoverUrl}');
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${query}`;
  
  const result = await httpsGet(url);
  return result.data?.result || [];
}

// Update a book's cover in Sanity
async function updateBookCover(id, coverUrl, token) {
  const mutations = {
    mutations: [{
      patch: {
        id: id,
        set: { externalCoverUrl: coverUrl }
      }
    }]
  };
  
  return new Promise((resolve, reject) => {
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`;
    const data = JSON.stringify(mutations);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: responseData });
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('📚 Fetching all books from Sanity...');
  const books = await fetchAllBooks();
  console.log(`Found ${books.length} books\n`);
  
  const booksNeedingCovers = [];
  const booksWithBrokenCovers = [];
  
  console.log('🔍 Testing existing cover URLs...');
  
  let tested = 0;
  for (const book of books) {
    tested++;
    process.stdout.write(`\rTesting ${tested}/${books.length}...`);
    
    if (!book.externalCoverUrl) {
      booksNeedingCovers.push(book);
    } else {
      const isValid = await testImageUrl(book.externalCoverUrl);
      if (!isValid) {
        booksWithBrokenCovers.push(book);
      }
    }
  }
  
  console.log(`\n\n📊 Results:`);
  console.log(`   Books with no cover: ${booksNeedingCovers.length}`);
  console.log(`   Books with broken cover: ${booksWithBrokenCovers.length}`);
  console.log(`   Books with working cover: ${books.length - booksNeedingCovers.length - booksWithBrokenCovers.length}`);
  
  const booksToUpdate = [...booksNeedingCovers, ...booksWithBrokenCovers];
  
  if (booksToUpdate.length === 0) {
    console.log('\n✅ All books have working covers!');
    return;
  }
  
  console.log(`\n🔎 Searching Google Books for ${booksToUpdate.length} covers...`);
  
  const updates = [];
  for (let i = 0; i < booksToUpdate.length; i++) {
    const book = booksToUpdate[i];
    process.stdout.write(`\rSearching ${i + 1}/${booksToUpdate.length}: ${book.title.substring(0, 40)}...`.padEnd(80));
    
    const cover = await searchGoogleBooks(book.title, book.author);
    if (cover) {
      updates.push({ id: book._id, title: book.title, cover });
    } else {
      console.log(`\n   ⚠️  No cover found for: ${book.title}`);
    }
    
    // Rate limit to avoid hitting API limits
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n\n📝 Found ${updates.length} covers to update`);
  
  if (updates.length === 0) {
    console.log('No updates needed.');
    return;
  }
  
  // Check for token
  const token = process.env.SANITY_TOKEN;
  if (!token) {
    console.log('\n⚠️  SANITY_TOKEN not set. Showing updates that would be made:\n');
    updates.forEach((u, i) => {
      console.log(`${i + 1}. ${u.title}`);
      console.log(`   → ${u.cover.substring(0, 70)}...`);
    });
    console.log('\nTo apply updates, run with: SANITY_TOKEN=your-token node scripts/update-all-covers-google.js');
    
    // Output JSON for manual processing
    console.log('\n--- JSON OUTPUT FOR MANUAL UPDATE ---');
    console.log(JSON.stringify(updates, null, 2));
    return;
  }
  
  console.log('\n📤 Updating covers in Sanity...');
  let updated = 0;
  let failed = 0;
  
  for (const update of updates) {
    try {
      const result = await updateBookCover(update.id, update.cover, token);
      if (result.status === 200) {
        updated++;
        console.log(`✅ ${update.title}`);
      } else {
        failed++;
        console.log(`❌ ${update.title}: ${result.status}`);
      }
    } catch (e) {
      failed++;
      console.log(`❌ ${update.title}: ${e.message}`);
    }
    
    // Small delay between updates
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n✅ Updated ${updated} covers, ${failed} failed`);
}

main().catch(console.error);
