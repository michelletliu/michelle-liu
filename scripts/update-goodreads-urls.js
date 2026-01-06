#!/usr/bin/env node
/**
 * Script to update book shelf items with Goodreads URLs
 * Parses the original Goodreads CSV export to get Book IDs,
 * matches them to existing books in Sanity, and updates goodreadsUrl field.
 *
 * Usage: node scripts/update-goodreads-urls.js
 * With token: SANITY_TOKEN=your-token node scripts/update-goodreads-urls.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// Configuration
const SANITY_PROJECT_ID = 'am3v0x1c';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Parse CSV properly handling quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Split into lines, handling multiline fields
function splitCSVLines(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      // Skip \r\n
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  return lines;
}

// Normalize title for matching (lowercase, remove special chars, etc)
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  // Read the Goodreads CSV
  const csvPath = path.join(__dirname, '../src/components/library/goodreads_library_export.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Goodreads CSV not found at:', csvPath);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = splitCSVLines(csvContent);
  const headers = parseCSVLine(lines[0]);
  
  // Find column indices
  const bookIdIdx = headers.indexOf('Book Id');
  const titleIdx = headers.indexOf('Title');
  const authorIdx = headers.indexOf('Author');
  
  const log = process.argv.includes('--json') ? () => {} : console.log;
  
  log('📖 Parsing Goodreads CSV...');
  log(`   Found columns: Book Id at ${bookIdIdx}, Title at ${titleIdx}, Author at ${authorIdx}`);
  
  // Build a map of normalized title -> { bookId, title, author }
  const goodreadsBooks = new Map();
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const bookId = fields[bookIdIdx];
    const title = fields[titleIdx];
    const author = fields[authorIdx];
    
    if (bookId && title) {
      const normalizedKey = normalizeTitle(title);
      // Create URL slug from title (replace spaces with underscores, remove special chars)
      const titleSlug = title
        .replace(/['']/g, '')
        .replace(/[""]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_');
      goodreadsBooks.set(normalizedKey, {
        bookId,
        title,
        author,
        url: `https://www.goodreads.com/book/show/${bookId}.${titleSlug}`
      });
    }
  }
  
  log(`   Parsed ${goodreadsBooks.size} books from CSV\n`);
  
  // Initialize Sanity client
  const sanityClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    token: process.env.SANITY_TOKEN,
    useCdn: false,
  });
  
  // Fetch all book shelf items from Sanity
  log('📚 Fetching books from Sanity...');
  const sanityBooks = await sanityClient.fetch(`
    *[_type == "shelfItem" && mediaType == "book"] {
      _id,
      title,
      author,
      goodreadsUrl
    }
  `);
  
  log(`   Found ${sanityBooks.length} books in Sanity\n`);
  
  // Match and prepare updates
  const updates = [];
  const notFound = [];
  
  for (const book of sanityBooks) {
    // Skip if already has a goodreadsUrl
    if (book.goodreadsUrl) {
      continue;
    }
    
    const normalizedTitle = normalizeTitle(book.title);
    const goodreadsMatch = goodreadsBooks.get(normalizedTitle);
    
    if (goodreadsMatch) {
      updates.push({
        _id: book._id,
        title: book.title,
        goodreadsUrl: goodreadsMatch.url
      });
    } else {
      // Try partial matching
      let found = false;
      for (const [key, value] of goodreadsBooks.entries()) {
        if (key.includes(normalizedTitle) || normalizedTitle.includes(key)) {
          updates.push({
            _id: book._id,
            title: book.title,
            goodreadsUrl: value.url
          });
          found = true;
          break;
        }
      }
      if (!found) {
        notFound.push({
          title: book.title,
          author: book.author
        });
      }
    }
  }
  
  log(`✅ Found Goodreads URLs for ${updates.length} books`);
  if (notFound.length > 0) {
    log(`⚠️  Could not find URLs for ${notFound.length} books:`);
    notFound.slice(0, 10).forEach(b => log(`   - "${b.title}" by ${b.author}`));
    if (notFound.length > 10) {
      log(`   ... and ${notFound.length - 10} more`);
    }
  }
  
  // Apply updates
  if (!process.env.SANITY_TOKEN) {
    // If --json flag is passed, output JSON for MCP tools
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(updates, null, 2));
      return;
    }
    
    log('\n--- DRY RUN (SANITY_TOKEN not set) ---');
    log(`Would update ${updates.length} books with Goodreads URLs`);
    log('\nSample updates:');
    updates.slice(0, 5).forEach((u, i) => {
      log(`${i + 1}. "${u.title}"`);
      log(`   → ${u.goodreadsUrl}`);
    });
    log('\nTo apply updates, run with:');
    log('SANITY_TOKEN=your-token node scripts/update-goodreads-urls.js');
    return;
  }
  
  if (updates.length === 0) {
    log('\n✅ No updates needed - all books already have Goodreads URLs');
    return;
  }
  
  log(`\n🚀 Applying ${updates.length} updates to Sanity...`);
  
  // Batch updates
  const transaction = sanityClient.transaction();
  for (const update of updates) {
    transaction.patch(update._id, {
      set: { goodreadsUrl: update.goodreadsUrl }
    });
  }
  
  await transaction.commit();
  log(`✅ Successfully updated ${updates.length} books with Goodreads URLs!`);
}

main().catch(console.error);
