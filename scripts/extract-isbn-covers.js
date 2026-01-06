const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../src/components/library/goodreads_library_export.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

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
        i++;
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

// Clean ISBN from Goodreads format like ="0394720245" or =""
function cleanISBN(isbnRaw) {
  if (!isbnRaw) return null;
  // Remove ="..." wrapper
  const match = isbnRaw.match(/="?([0-9X]+)"?/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

const lines = splitCSVLines(csvContent);
const headers = parseCSVLine(lines[0]);

// Find column indices
const titleIdx = headers.indexOf('Title');
const authorIdx = headers.indexOf('Author');
const isbnIdx = headers.indexOf('ISBN');
const isbn13Idx = headers.indexOf('ISBN13');
const shelfIdx = headers.indexOf('Exclusive Shelf');
const bookshelvesIdx = headers.indexOf('Bookshelves');

console.log('Found columns - Title:', titleIdx, 'Author:', authorIdx, 'ISBN:', isbnIdx, 'ISBN13:', isbn13Idx);

// Parse books and extract ISBNs
const bookCovers = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  
  const shelf = fields[shelfIdx];
  const bookshelves = fields[bookshelvesIdx] || '';
  
  // Only include read, currently-reading, or books with favorites in bookshelves
  const isRead = shelf === 'read';
  const isCurrentlyReading = shelf === 'currently-reading';
  const isFavorite = bookshelves.includes('favorites');
  
  if (isRead || isCurrentlyReading || isFavorite) {
    const title = fields[titleIdx];
    const author = fields[authorIdx];
    const isbn = cleanISBN(fields[isbnIdx]);
    const isbn13 = cleanISBN(fields[isbn13Idx]);
    
    // Prefer ISBN-10 over ISBN-13 for Open Library (both work but 10 is more common)
    const bestISBN = isbn || isbn13;
    
    if (bestISBN) {
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${bestISBN}-L.jpg`;
      bookCovers.push({
        title,
        author,
        isbn: bestISBN,
        coverUrl
      });
    } else {
      bookCovers.push({
        title,
        author,
        isbn: null,
        coverUrl: null
      });
    }
  }
}

// Count books with and without ISBNs
const withISBN = bookCovers.filter(b => b.isbn).length;
const withoutISBN = bookCovers.filter(b => !b.isbn).length;

console.log(`\nTotal books: ${bookCovers.length}`);
console.log(`Books with ISBN: ${withISBN}`);
console.log(`Books without ISBN: ${withoutISBN}`);

console.log('\n--- Sample books with covers ---\n');
bookCovers.filter(b => b.coverUrl).slice(0, 10).forEach((b, i) => {
  console.log(`${i + 1}. "${b.title}" by ${b.author}`);
  console.log(`   ISBN: ${b.isbn}`);
  console.log(`   Cover: ${b.coverUrl}\n`);
});

console.log('\n--- Books without ISBN ---\n');
bookCovers.filter(b => !b.isbn).slice(0, 10).forEach((b, i) => {
  console.log(`${i + 1}. "${b.title}" by ${b.author}`);
});

// Save the mapping
fs.writeFileSync(
  path.join(__dirname, 'book-covers.json'),
  JSON.stringify(bookCovers, null, 2)
);
console.log('\nSaved book cover mappings to scripts/book-covers.json');
