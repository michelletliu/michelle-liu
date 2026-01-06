// Script to match books and generate cover URL updates
const fs = require('fs');
const path = require('path');

// Load the book covers with ISBNs
const bookCovers = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'book-covers.json'), 'utf8')
);

// Sanity books (from our query - manually listed)
const sanityBooks = [
  { _id: "008c0e83-f8b0-482b-8122-acd346cf3ba7", title: "Martyr!", author: "Kaveh Akbar" },
  { _id: "02660fcb-5aca-4fba-ba2a-0a564466b18c", title: "Kim Jiyoung, Born 1982", author: "Cho Nam-Joo" },
  { _id: "03bf547b-bca4-4cbb-88ef-7fb703e8d14c", title: "The Song of Achilles", author: "Madeline Miller" },
  { _id: "04ba7b29-27b0-4e5a-aa35-300b32dfbf70", title: "The House of Spirits", author: "Isabel Allende" },
  { _id: "05539cd4-d921-4f7f-a41c-ff9e767e6306", title: "Bliss Montage", author: "Ling Ma" },
  { _id: "057daf3d-8b7b-47a2-8ed3-6d291678cd40", title: "Benjamin Franklin: An American Life", author: "Walter Isaacson" },
  { _id: "0aa7e855-ba7e-4852-8b98-b96fe4341eef", title: "Blink", author: "Malcolm Gladwell" },
  { _id: "0ade5975-04ee-48f5-822b-14413fa68ef0", title: "The Death of Ivan Ilych", author: "Leo Tolstoy" },
  { _id: "0c3af7f9-d7c5-4d2c-90fe-66e4d0c30f66", title: "Stoner", author: "John Williams" },
  { _id: "0cd2e96f-9dee-4439-82d3-28553001e255", title: "East of Eden", author: "John Steinbeck" },
  { _id: "0e19a829-1e2a-4931-b25e-f95b2b2395dc", title: "Breasts and Eggs", author: "Mieko Kawakami" },
  { _id: "0e281e59-2611-44b0-84b9-df663033dd2d", title: "Letters to a Young Poet", author: "Rainer Maria Rilke" },
  { _id: "0ecd8c0b-73d1-43ff-96cb-23e6a4ce1225", title: "If on a Winter's Night a Traveler", author: "Italo Calvino" },
  { _id: "1043f104-2634-41b4-ae6b-550931de3692", title: "Dandelion Wine", author: "Ray Bradbury" },
  { _id: "115e7d04-9976-4fe7-93cf-cd3200992fd3", title: "Zen and the Art of Motorcycle Maintenance", author: "Robert M. Pirsig" },
  { _id: "177112ba-d229-4072-95bc-0fdfe1d68e6b", title: "The Prince", author: "Niccolò Machiavelli" },
  { _id: "18181f60-02da-4349-9ca0-c2110b6ab06a", title: "Madonna in a Fur Coat", author: "Sabahattin Ali" },
  { _id: "184589e5-d63b-44cf-91e4-c71bd45f81c8", title: "The Bell Jar", author: "Sylvia Plath" },
  { _id: "19b8ebe3-9dc4-43fd-82e8-7e4f9b6c834b", title: "Kitchen", author: "Banana Yoshimoto" },
  { _id: "1ea092bb-25e6-4475-8265-704bdf862edf", title: "What We Talk About When We Talk About Love", author: "Raymond Carver" },
  { _id: "1eff1363-d08b-4ec5-9350-6eaaf77cce13", title: "A Little Life", author: "Hanya Yanagihara" },
  { _id: "1fe1b01a-b87e-48eb-9840-37f6c00b61eb", title: "All the Lovers in the Night", author: "Mieko Kawakami" },
  { _id: "20f01a97-2e14-4c48-8556-99275e7fa31f", title: "Man's Search for Meaning", author: "Viktor E. Frankl" },
  { _id: "2439cb77-9cae-46c6-8dc8-a9f4ef9390bb", title: "The Sun Also Rises", author: "Ernest Hemingway" },
  { _id: "24a75834-723f-46e4-8a4e-b22bf9725e16", title: "Pachinko", author: "Min Jin Lee" },
  { _id: "25be302b-ff21-4ad4-89eb-76a65e61527a", title: "Shoe Dog", author: "Phil Knight" },
  { _id: "27fe1def-c892-41dd-b69f-0f05e06740c6", title: "Play It As It Lays", author: "Joan Didion" },
  { _id: "28e9e14e-e94c-4268-a5c7-336ab89f608f", title: "Circe", author: "Madeline Miller" },
  { _id: "2c23aca4-2255-4f9c-8480-2bead5e23902", title: "The Almanack of Naval Ravikant: A Guide to Wealth and Happiness", author: "Eric Jorgenson" },
  { _id: "30c58962-a6c4-4df2-9fcb-10dd661b1ea1", title: "The Stranger", author: "Albert Camus" },
  { _id: "35aad10b-ba0d-44e3-a850-c37c0c9f0a7c", title: "The Bonesetter's Daughter", author: "Amy Tan" },
  { _id: "38605975-9041-4cc9-8b23-21729aef51c3", title: "Colorless Tsukuru Tazaki and His Years of Pilgrimage", author: "Haruki Murakami" },
  { _id: "3c59ad66-454e-46ba-9130-ecda1514a394", title: "Tuesdays with Morrie", author: "Mitch Albom" },
  { _id: "4307c1da-461c-4950-9db3-1e572d9deceb", title: "Rogues: True Stories of Grifters, Killers, Rebels and Crooks", author: "Patrick Radden Keefe" },
  { _id: "43b182e6-fbd3-4ef3-b25f-87ec82a278be", title: "The Elephant Vanishes", author: "Haruki Murakami" },
  { _id: "4549b35a-3df9-42a1-9172-cb6ad2c07449", title: "Thus Spoke Zarathustra", author: "Friedrich Nietzsche" },
  { _id: "4b51e2bd-337e-465a-8b15-a6ceaab4b24d", title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { _id: "4e220ffa-183a-4dbf-9147-e21ec90d175d", title: "Total Recall", author: "Arnold Schwarzenegger" },
  { _id: "4e4281ed-0522-41f3-80d0-d341e8917054", title: "Heaven", author: "Mieko Kawakami" },
  { _id: "4ffc4f0c-ecf1-455b-a810-afca2618982a", title: "The Goldfinch", author: "Donna Tartt" },
  { _id: "526ba5b9-caf1-4bbb-9e88-6b8ff3f8aaac", title: "Norwegian Wood", author: "Haruki Murakami" },
  { _id: "5657a738-cf1c-4839-a695-c04f9d6467f4", title: "The Myth of Sisyphus", author: "Albert Camus" },
  { _id: "5ed914af-9e29-4280-bbcb-0fc7b0f60807", title: "The Prophet", author: "Kahlil Gibran" },
  { _id: "608dd3b3-ff9a-4a2e-9bd5-4554be28fdb5", title: "Where the Crawdads Sing", author: "Delia Owens" },
  { _id: "60b8b9ed-fa5a-4e3d-8bec-e7995906fe9e", title: "Tortilla Flat", author: "John Steinbeck" },
  { _id: "61e445f4-c607-46f2-8581-dc4c823c7824", title: "The Remains of the Day", author: "Kazuo Ishiguro" },
  { _id: "68e63a3e-4a85-4292-9b32-630cf65e4f62", title: "The Vegetarian", author: "Han Kang" },
  { _id: "73dacd85-1dcc-4980-a9aa-7737ac90d61e", title: "Circe", author: "Madeline Miller" },
  { _id: "73e190a3-6a0a-4c6e-b685-7de312895a66", title: "Brave New World", author: "Aldous Huxley" },
  { _id: "7a33a81d-62b9-4396-8ae7-70bc176aa058", title: "Tell Me Everything", author: "Minka Kelly" },
  { _id: "80be45aa-6208-42f5-aaee-693e4716a122", title: "Kafka on the Shore", author: "Haruki Murakami" },
  { _id: "82fff665-0600-4d28-994c-ff21a1df6dfc", title: "The Tao Te Ching", author: "Lao Tzu" },
  { _id: "89bd7a37-a645-4225-b308-ec1c2bdf4cee", title: "After Dark", author: "Haruki Murakami" },
  { _id: "8aa9b381-9462-4a12-9b53-7c900076be4f", title: "The Secret History", author: "Donna Tartt" },
  { _id: "8f00354d-257f-455e-8561-ffa9b06f1692", title: "Kitchen", author: "Banana Yoshimoto" },
  { _id: "8f6048af-a6a1-4e37-8c49-3a6ad2d6c741", title: "Careless People: A Cautionary Tale of Power, Greed, and Lost Idealism", author: "Sarah Wynn-Williams" },
  { _id: "9a207298-1604-4476-81b4-e1e0ad915936", title: "One Hundred Years of Solitude", author: "Gabriel García Márquez" },
  { _id: "9ce490fa-4dba-4374-8d3a-bc8dc773c5a8", title: "Norwegian Wood", author: "Haruki Murakami" },
  { _id: "a16410ca-31ce-4c66-9451-de9bb2c2da81", title: "Meditations", author: "Marcus Aurelius" },
  { _id: "a2f8dbe9-f632-47cc-9c98-7b26118c341b", title: "The Vegetarian", author: "Han Kang" },
  { _id: "abb935d5-1ecc-455c-bd74-fdad40d92334", title: "Stoner", author: "John Williams" },
  { _id: "b46275bc-72f1-40f2-b180-401fdb456a84", title: "Kafka on the Shore", author: "Haruki Murakami" },
  { _id: "b5d5b857-a037-451f-abe3-064001e51f67", title: "Pachinko", author: "Min Jin Lee" },
  { _id: "b82a1e16-2751-467f-93da-5435f9f27f65", title: "Tortilla Flat", author: "John Steinbeck" },
  { _id: "bc61ac23-859c-4540-969a-5284820b530e", title: "A Book of Five Rings: The Classic Guide to Strategy", author: "Miyamoto Musashi" },
  { _id: "bdce1b09-806c-42d0-94be-20b4f40a5dbe", title: "A Philosophical Enquiry into the Origin of Our Ideas of the Sublime and Beautiful", author: "Edmund Burke" },
  { _id: "bf3036a7-3d8c-4703-9f4d-3ff738a9200e", title: "The Body Artist", author: "Don DeLillo" },
  { _id: "bf943ef0-f1c9-43d0-be26-5cd84f918706", title: "Finite and Infinite Games", author: "James P. Carse" },
  { _id: "c0689774-6609-485c-ba64-8cd98a444a52", title: "All the Light We Cannot See", author: "Anthony Doerr" },
  { _id: "c354722a-b8a5-4162-8e41-0cbd44166499", title: "Only the Paranoid Survive", author: "Andrew S. Grove" },
  { _id: "c3e56b4e-762a-4be3-b5e0-f0286988065c", title: "A Little Life", author: "Hanya Yanagihara" },
  { _id: "c506604a-e1a5-4d08-a456-72b9be09efcc", title: "An Ideal Husband", author: "Oscar Wilde" },
  { _id: "c9009601-0c0f-4b64-ac6f-e8ad86f0a3f5", title: "Being Mortal: Medicine and What Matters in the End", author: "Atul Gawande" },
  { _id: "c9a5d178-bbdb-43cf-a799-1585f9ca2751", title: "Nausea", author: "Jean-Paul Sartre" },
  { _id: "ca267223-e46a-45fb-a6eb-c0c04012722e", title: "Greenlights", author: "Matthew McConaughey" },
  { _id: "ca63f0a8-7ba0-4605-9514-25aad9daf0c5", title: "The Song of Achilles", author: "Madeline Miller" },
  { _id: "d073d46b-4e00-4ef8-873b-5327bdfec3b9", title: "Wind/Pinball: Two Novels", author: "Haruki Murakami" },
  { _id: "d57296ec-a4e2-423e-b5be-94ebfe5879b5", title: "Sunrise on the Reaping (The Hunger Games, #0.5)", author: "Suzanne Collins" },
  { _id: "d60090df-94ac-4af1-950b-7289b29f2fab", title: "A Visit from the Goon Squad", author: "Jennifer Egan" },
  { _id: "d609d565-f60d-489d-a125-95f2f9015a30", title: "Never Enough: From Barista to Billionaire", author: "Andrew Wilkinson" },
  { _id: "da302502-8d0d-45b9-899e-947a189b8f7a", title: "The Big Sleep", author: "Raymond Chandler" },
  { _id: "dfb79a1c-1d58-4ff1-9210-1e3015851947", title: "Tell Them of Battles, Kings, and Elephants", author: "Mathias Énard" },
  { _id: "e00d75d0-92e5-4f50-8a1f-a737d642e4f8", title: "Cannery Row", author: "John Steinbeck" },
  { _id: "e1a76644-6fbf-45a8-8be3-2169413fc118", title: "The Hour of the Star", author: "Clarice Lispector" },
  { _id: "e77d00b8-01f7-4953-be4a-847cb55ed942", title: "Never Let Me Go", author: "Kazuo Ishiguro" },
  { _id: "ebdbdc72-c007-4c85-850d-2ba9acf3762d", title: "The Memory Police", author: "Yōko Ogawa" },
  { _id: "f3043b9c-ba60-42ee-abcc-6077b49af53e", title: "1984", author: "George Orwell" },
  { _id: "f4be8117-a568-4b39-9889-9a9a7e9f3ad7", title: "The Curious Case of Benjamin Button", author: "F. Scott Fitzgerald" },
  { _id: "f745b73a-e856-41a5-80dc-2c2639fda143", title: "Siddhartha", author: "Hermann Hesse" },
  { _id: "fbc4dfdc-0339-4e93-abc2-c417be41c3c0", title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
];

// Normalize title for matching (remove subtitles in parentheses, lowercase, trim)
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize author name (handle double spaces, lowercase)
function normalizeAuthor(author) {
  return author
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Match Sanity books to cover URLs
const matches = [];
const noMatch = [];

for (const sanityBook of sanityBooks) {
  const normalizedSanityTitle = normalizeTitle(sanityBook.title);
  const normalizedSanityAuthor = normalizeAuthor(sanityBook.author);
  
  // Find matching book in covers
  const match = bookCovers.find(cover => {
    const normalizedCoverTitle = normalizeTitle(cover.title);
    const normalizedCoverAuthor = normalizeAuthor(cover.author);
    
    // Match by normalized title OR author last name + partial title match
    const titleMatch = normalizedSanityTitle === normalizedCoverTitle ||
      normalizedCoverTitle.includes(normalizedSanityTitle) ||
      normalizedSanityTitle.includes(normalizedCoverTitle);
    
    return titleMatch;
  });
  
  if (match && match.coverUrl) {
    matches.push({
      _id: sanityBook._id,
      title: sanityBook.title,
      coverUrl: match.coverUrl,
      isbn: match.isbn
    });
  } else {
    noMatch.push(sanityBook);
  }
}

console.log(`\n=== MATCH RESULTS ===`);
console.log(`Matched with covers: ${matches.length}`);
console.log(`No cover found: ${noMatch.length}`);

console.log(`\n=== BOOKS WITH COVER URLs (first 30) ===\n`);
matches.slice(0, 30).forEach((m, i) => {
  console.log(`${i + 1}. ${m.title}`);
  console.log(`   ID: ${m._id}`);
  console.log(`   Cover: ${m.coverUrl}\n`);
});

console.log(`\n=== BOOKS WITHOUT COVERS ===\n`);
noMatch.forEach((b, i) => {
  console.log(`${i + 1}. "${b.title}" by ${b.author}`);
});

// Save matches for reference
fs.writeFileSync(
  path.join(__dirname, 'sanity-cover-matches.json'),
  JSON.stringify(matches, null, 2)
);
console.log(`\nSaved ${matches.length} matches to scripts/sanity-cover-matches.json`);
