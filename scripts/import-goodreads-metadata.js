/**
 * Script to import dates read, ratings, and reviews from Goodreads CSV
 * into existing shelfItem books in Sanity
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// Sanity client configuration
const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// Parse CSV (handling quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// Normalize title for matching (lowercase, remove special chars)
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert Goodreads date (2025/12/29) to ISO date (2025-12-29)
function convertDate(goodreadsDate) {
  if (!goodreadsDate || goodreadsDate.trim() === '') return null;
  const parts = goodreadsDate.split('/');
  if (parts.length !== 3) return null;
  return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
}

// Strip HTML tags and clean up review text
function cleanReview(html) {
  if (!html || html.trim() === '') return null;
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  console.log('📚 Importing Goodreads metadata into Sanity...\n');
  
  // Read CSV file
  const csvPath = '/Users/michelleliu/Downloads/goodreads_library_export (1).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  const titleIndex = header.indexOf('Title');
  const authorIndex = header.indexOf('Author');
  const ratingIndex = header.indexOf('My Rating');
  const dateReadIndex = header.indexOf('Date Read');
  const reviewIndex = header.indexOf('My Review');
  
  console.log(`Found columns: Title=${titleIndex}, Author=${authorIndex}, Rating=${ratingIndex}, DateRead=${dateReadIndex}, Review=${reviewIndex}`);
  
  // Parse all books with metadata
  const booksWithMetadata = [];
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < Math.max(titleIndex, authorIndex, ratingIndex, dateReadIndex, reviewIndex) + 1) {
      continue;
    }
    
    const title = fields[titleIndex];
    const author = fields[authorIndex];
    const rating = parseInt(fields[ratingIndex], 10);
    const dateRead = convertDate(fields[dateReadIndex]);
    const review = cleanReview(fields[reviewIndex]);
    
    // Only include if has at least one piece of metadata
    if ((rating && rating > 0) || dateRead || review) {
      booksWithMetadata.push({
        title,
        author,
        rating: rating > 0 ? rating : null,
        dateRead,
        review,
        normalizedTitle: normalizeTitle(title),
      });
    }
  }
  
  console.log(`\n📖 Found ${booksWithMetadata.length} books with metadata (rating, date read, or review)`);
  
  // Fetch all existing books from Sanity
  console.log('\n🔍 Fetching existing books from Sanity...');
  const sanityBooks = await client.fetch(`
    *[_type == "shelfItem" && mediaType == "book"] {
      _id,
      title,
      author,
      rating,
      dateRead,
      review,
      year
    }
  `);
  
  console.log(`Found ${sanityBooks.length} books in Sanity`);
  
  // Create a map for matching
  const sanityBookMap = new Map();
  sanityBooks.forEach(book => {
    const key = normalizeTitle(book.title);
    if (!sanityBookMap.has(key)) {
      sanityBookMap.set(key, []);
    }
    sanityBookMap.get(key).push(book);
  });
  
  // Match and prepare updates
  const updates = [];
  const unmatched = [];
  
  for (const book of booksWithMetadata) {
    const matches = sanityBookMap.get(book.normalizedTitle);
    
    if (matches && matches.length > 0) {
      // If multiple matches, try to match by author too
      let bestMatch = matches[0];
      if (matches.length > 1) {
        const authorNorm = normalizeTitle(book.author);
        const authorMatch = matches.find(m => 
          m.author && normalizeTitle(m.author).includes(authorNorm.split(' ')[0])
        );
        if (authorMatch) bestMatch = authorMatch;
      }
      
      // Prepare update only for fields that have data
      const update = { _id: bestMatch._id, title: bestMatch.title };
      let hasUpdate = false;
      
      if (book.rating && book.rating > 0) {
        update.rating = book.rating;
        hasUpdate = true;
      }
      
      if (book.dateRead) {
        update.dateRead = book.dateRead;
        hasUpdate = true;
      }
      
      if (book.review) {
        update.review = book.review;
        hasUpdate = true;
      }
      
      if (hasUpdate) {
        updates.push(update);
      }
    } else {
      unmatched.push(book);
    }
  }
  
  console.log(`\n✅ Matched ${updates.length} books for updates`);
  console.log(`❓ Unmatched: ${unmatched.length} books\n`);
  
  // Show sample of unmatched
  if (unmatched.length > 0) {
    console.log('Sample unmatched books (first 10):');
    unmatched.slice(0, 10).forEach(b => {
      console.log(`  - "${b.title}" by ${b.author}`);
    });
    console.log('');
  }
  
  // Output summary of what will be updated
  console.log('=== UPDATE SUMMARY ===\n');
  
  let withRating = 0;
  let withDate = 0;
  let withReview = 0;
  
  updates.forEach(u => {
    if (u.rating) withRating++;
    if (u.dateRead) withDate++;
    if (u.review) withReview++;
  });
  
  console.log(`Books to update with rating: ${withRating}`);
  console.log(`Books to update with date read: ${withDate}`);
  console.log(`Books to update with review: ${withReview}`);
  
  // Show sample updates
  console.log('\n=== SAMPLE UPDATES (first 5) ===\n');
  updates.slice(0, 5).forEach(u => {
    console.log(`📗 "${u.title}"`);
    if (u.rating) console.log(`   Rating: ${'★'.repeat(u.rating)}${'☆'.repeat(5 - u.rating)}`);
    if (u.dateRead) console.log(`   Date Read: ${u.dateRead}`);
    if (u.review) console.log(`   Review: ${u.review.substring(0, 100)}...`);
    console.log('');
  });
  
  // Apply updates if SANITY_TOKEN is set
  if (process.env.SANITY_TOKEN) {
    console.log('\n🔄 Applying updates to Sanity...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const update of updates) {
      try {
        const patch = client.patch(update._id);
        
        if (update.rating) {
          patch.set({ rating: update.rating });
        }
        if (update.dateRead) {
          patch.set({ dateRead: update.dateRead });
        }
        if (update.review) {
          patch.set({ review: update.review });
        }
        
        await patch.commit();
        successCount++;
        
        if (successCount % 20 === 0) {
          console.log(`  Updated ${successCount}/${updates.length} books...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  Error updating "${update.title}": ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${successCount} books`);
    if (errorCount > 0) {
      console.log(`❌ Failed to update ${errorCount} books`);
    }
  } else {
    console.log('\n⚠️  SANITY_TOKEN not set. Run with token to apply updates:');
    console.log('   SANITY_TOKEN=your_token node scripts/import-goodreads-metadata.js\n');
    
    // Save updates to JSON for review
    const outputPath = path.join(__dirname, 'goodreads-updates.json');
    fs.writeFileSync(outputPath, JSON.stringify(updates, null, 2));
    console.log(`📄 Saved updates to ${outputPath} for review`);
  }
}

main().catch(console.error);
