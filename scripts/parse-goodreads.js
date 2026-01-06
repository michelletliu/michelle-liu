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

const lines = splitCSVLines(csvContent);
const headers = parseCSVLine(lines[0]);

console.log('Headers:', headers);
console.log('\n');

// Find column indices
const titleIdx = headers.indexOf('Title');
const authorIdx = headers.indexOf('Author');
const ratingIdx = headers.indexOf('My Rating');
const shelfIdx = headers.indexOf('Exclusive Shelf');
const bookshelvesIdx = headers.indexOf('Bookshelves');
const dateReadIdx = headers.indexOf('Date Read');
const dateAddedIdx = headers.indexOf('Date Added');
const reviewIdx = headers.indexOf('My Review');

console.log('Column indices:');
console.log('Title:', titleIdx, 'Author:', authorIdx, 'Rating:', ratingIdx);
console.log('Shelf:', shelfIdx, 'Bookshelves:', bookshelvesIdx);
console.log('Date Read:', dateReadIdx, 'Date Added:', dateAddedIdx);
console.log('Review:', reviewIdx);
console.log('\n');

// Parse all books
const books = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  
  const shelf = fields[shelfIdx];
  const bookshelves = fields[bookshelvesIdx] || '';
  const rating = parseInt(fields[ratingIdx]) || 0;
  
  // Only include read, currently-reading, or books with favorites in bookshelves
  const isRead = shelf === 'read';
  const isCurrentlyReading = shelf === 'currently-reading';
  const isFavorite = bookshelves.includes('favorites');
  
  if (isRead || isCurrentlyReading || isFavorite) {
    // Clean up the review - convert HTML to plain text
    let review = fields[reviewIdx] || '';
    review = review.replace(/<br\/?>/gi, '\n')
                   .replace(/<b>/gi, '**')
                   .replace(/<\/b>/gi, '**')
                   .replace(/<i>/gi, '_')
                   .replace(/<\/i>/gi, '_')
                   .replace(/<blockquote>/gi, '> ')
                   .replace(/<\/blockquote>/gi, '')
                   .replace(/<[^>]+>/g, '');
    
    // Convert date format from YYYY/MM/DD to YYYY-MM-DD
    const dateRead = fields[dateReadIdx] ? fields[dateReadIdx].replace(/\//g, '-') : null;
    const dateAdded = fields[dateAddedIdx] ? fields[dateAddedIdx].replace(/\//g, '-') : null;
    
    // Determine the Sanity shelf value
    let sanityShelf;
    if (isFavorite) {
      sanityShelf = 'favorites';
    } else if (isCurrentlyReading) {
      sanityShelf = 'currently-reading';
    } else {
      sanityShelf = 'read';
    }
    
    // For read/favorites books with rating 0, default to 3
    // For currently-reading, we skip if rating is 0
    let finalRating = rating;
    if (rating === 0) {
      if (sanityShelf === 'currently-reading') {
        finalRating = 3; // Default rating for currently reading
      } else {
        finalRating = 3; // Default for read books without a rating
      }
    }
    
    books.push({
      title: fields[titleIdx],
      author: fields[authorIdx],
      rating: finalRating,
      shelf: sanityShelf,
      dateFinished: dateRead,
      dateStarted: dateAdded,
      review: review || undefined,
    });
  }
}

console.log(`Found ${books.length} books to import:\n`);
console.log('By shelf:');
const byShelves = {};
books.forEach(b => {
  byShelves[b.shelf] = (byShelves[b.shelf] || 0) + 1;
});
console.log(byShelves);

console.log('\n--- First 5 books ---\n');
books.slice(0, 5).forEach((b, i) => {
  console.log(`${i + 1}. "${b.title}" by ${b.author}`);
  console.log(`   Shelf: ${b.shelf}, Rating: ${b.rating}`);
  console.log(`   Date finished: ${b.dateFinished}`);
  if (b.review) {
    console.log(`   Review: ${b.review.substring(0, 100)}...`);
  }
  console.log('');
});

// Output all books as JSON
fs.writeFileSync(
  path.join(__dirname, 'parsed-books.json'),
  JSON.stringify(books, null, 2)
);
console.log('\nSaved all books to scripts/parsed-books.json');
