// Script to fetch Google Books covers for books missing covers
const https = require('https');

// Books without covers
const booksWithoutCovers = [
  { _id: "04ba7b29-27b0-4e5a-aa35-300b32dfbf70", author: "Isabel Allende", title: "The House of Spirits" },
  { _id: "0ade5975-04ee-48f5-822b-14413fa68ef0", author: "Leo Tolstoy", title: "The Death of Ivan Ilych" },
  { _id: "0e19a829-1e2a-4931-b25e-f95b2b2395dc", author: "Mieko Kawakami", title: "Breasts and Eggs" },
  { _id: "0e281e59-2611-44b0-84b9-df663033dd2d", author: "Rainer Maria Rilke", title: "Letters to a Young Poet" },
  { _id: "0ecd8c0b-73d1-43ff-96cb-23e6a4ce1225", author: "Italo Calvino", title: "If on a Winter's Night a Traveler" },
  { _id: "184589e5-d63b-44cf-91e4-c71bd45f81c8", author: "Sylvia Plath", title: "The Bell Jar" },
  { _id: "24a75834-723f-46e4-8a4e-b22bf9725e16", author: "Min Jin Lee", title: "Pachinko" },
  { _id: "30c58962-a6c4-4df2-9fcb-10dd661b1ea1", author: "Albert Camus", title: "The Stranger" },
  { _id: "3c59ad66-454e-46ba-9130-ecda1514a394", author: "Mitch Albom", title: "Tuesdays with Morrie" },
  { _id: "43b182e6-fbd3-4ef3-b25f-87ec82a278be", author: "Haruki Murakami", title: "The Elephant Vanishes" },
  { _id: "4549b35a-3df9-42a1-9172-cb6ad2c07449", author: "Friedrich Nietzsche", title: "Thus Spoke Zarathustra" },
  { _id: "4b51e2bd-337e-465a-8b15-a6ceaab4b24d", author: "Fyodor Dostoevsky", title: "Crime and Punishment" },
  { _id: "526ba5b9-caf1-4bbb-9e88-6b8ff3f8aaac", author: "Haruki Murakami", title: "Norwegian Wood" },
  { _id: "5657a738-cf1c-4839-a695-c04f9d6467f4", author: "Albert Camus", title: "The Myth of Sisyphus" },
  { _id: "61e445f4-c607-46f2-8581-dc4c823c7824", author: "Kazuo Ishiguro", title: "The Remains of the Day" },
  { _id: "73e190a3-6a0a-4c6e-b685-7de312895a66", author: "Aldous Huxley", title: "Brave New World" },
  { _id: "80be45aa-6208-42f5-aaee-693e4716a122", author: "Haruki Murakami", title: "Kafka on the Shore" },
  { _id: "82fff665-0600-4d28-994c-ff21a1df6dfc", author: "Lao Tzu", title: "The Tao Te Ching" },
  { _id: "9a207298-1604-4476-81b4-e1e0ad915936", author: "Gabriel García Márquez", title: "One Hundred Years of Solitude" },
  { _id: "a16410ca-31ce-4c66-9451-de9bb2c2da81", author: "Marcus Aurelius", title: "Meditations" },
  { _id: "da302502-8d0d-45b9-899e-947a189b8f7a", author: "Raymond Chandler", title: "The Big Sleep" },
  { _id: "f3043b9c-ba60-42ee-abcc-6077b49af53e", author: "George Orwell", title: "1984" },
  { _id: "f745b73a-e856-41a5-80dc-2c2639fda143", author: "Hermann Hesse", title: "Siddhartha" },
];

function fetchGoogleBooksCover(title, author) {
  return new Promise((resolve, reject) => {
    // Clean title for search (remove subtitles)
    const cleanTitle = title.replace(/\s*\([^)]*\)\s*/g, '').replace(/:/g, '');
    const cleanAuthor = author.split(',')[0]; // Use first author name
    
    const query = encodeURIComponent(`intitle:${cleanTitle} inauthor:${cleanAuthor}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items[0] && json.items[0].volumeInfo.imageLinks) {
            // Get the largest available image
            const imageLinks = json.items[0].volumeInfo.imageLinks;
            // Convert HTTP to HTTPS and get larger image by changing zoom parameter
            let coverUrl = imageLinks.thumbnail || imageLinks.smallThumbnail;
            if (coverUrl) {
              // Convert to HTTPS
              coverUrl = coverUrl.replace('http://', 'https://');
              // Get larger image by modifying zoom parameter
              coverUrl = coverUrl.replace('zoom=1', 'zoom=2');
              // Remove curl edge
              coverUrl = coverUrl.replace('&edge=curl', '');
            }
            resolve(coverUrl);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('Fetching Google Books covers...\n');
  
  const results = [];
  
  for (const book of booksWithoutCovers) {
    const coverUrl = await fetchGoogleBooksCover(book.title, book.author);
    
    if (coverUrl) {
      console.log(`✓ ${book.title} by ${book.author}`);
      console.log(`  ${coverUrl}\n`);
      results.push({ ...book, coverUrl });
    } else {
      console.log(`✗ ${book.title} by ${book.author} - NOT FOUND\n`);
      results.push({ ...book, coverUrl: null });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n=== SUMMARY ===');
  const found = results.filter(r => r.coverUrl);
  const notFound = results.filter(r => !r.coverUrl);
  
  console.log(`Found: ${found.length}`);
  console.log(`Not found: ${notFound.length}`);
  
  if (notFound.length > 0) {
    console.log('\nBooks without covers:');
    notFound.forEach(b => console.log(`  - ${b.title}`));
  }
  
  // Output for Sanity patching
  console.log('\n=== FOR SANITY UPDATE ===');
  found.forEach(b => {
    console.log(`{ _id: "${b._id}", title: "${b.title}", coverUrl: "${b.coverUrl}" },`);
  });
}

main();
