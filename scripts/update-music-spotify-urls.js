/**
 * Script to update Spotify URLs for music albums in Sanity
 * 
 * Usage:
 * 1. Get a Spotify Client ID and Secret from https://developer.spotify.com/dashboard
 * 2. Run: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy SANITY_TOKEN=zzz node scripts/update-music-spotify-urls.js
 * 
 * Or manually update via Sanity Studio at http://localhost:3333
 */

const { createClient } = require('@sanity/client');

// Sanity config
const sanityClient = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // Required for mutations
});

// Known Spotify album URLs - add more as needed
const SPOTIFY_URLS = {
  'Ultraviolence': 'https://open.spotify.com/album/1ORxRsK3MrSLvh7VQTF01F',
  'Born to Die': 'https://open.spotify.com/album/4X5XvfGb8y7IuHVPxLwkZP',
  'Hozier': 'https://open.spotify.com/album/6GcZBzNoWqfqT5ibU3lMX4',
  '1989 (Deluxe)': 'https://open.spotify.com/album/64LU4c1nfjz1t4VnGhagcg',
  "Coup D'Etat": 'https://open.spotify.com/album/2pFIEfONYUaPlSZRz1PBN2',
  'Electra Heart': 'https://open.spotify.com/album/5pJxDqrJyYTpvAvLZqPYMd',
  'Submarine': 'https://open.spotify.com/album/1qjuT88iLrTr2bP5r0LcAt',
  'So Close to What': 'https://open.spotify.com/album/2oIuCTJgVs9S8vLWvZ2ENX',
  'Portal': 'https://open.spotify.com/album/78Tt5JWq1VG2LCrT1S5ZtL',
  'Brat': 'https://open.spotify.com/album/2lIZef4lzdvZkiiCzvPKj7',
  "how i'm feeling now": 'https://open.spotify.com/album/3vB5bKY1EYqyBzHPWVzV9B',
  'back to friends': 'https://open.spotify.com/album/1DsrDvDzuTVeMPXD77IqDT',
  "Bird's Eye": 'https://open.spotify.com/album/65v3bq8vI6Lv7kAEyQHXoJ',
  'French Exit': 'https://open.spotify.com/album/3Xs1pLJRY0V5oykFCfJmjA',
  'Pure Heroine': 'https://open.spotify.com/album/0rmhjUgoVa17LZuS8xWQ3H',
  'Prada': 'https://open.spotify.com/album/0vZ6OqYsf6lXqPG8AoaXbR', // Single
  'My 21st Century Blues': 'https://open.spotify.com/album/3U8n8LzBx2o9gYXvvNq4uH',
  'Ruby': 'https://open.spotify.com/album/4qkZuGXBqQYjR19tc91bJt',
  "This Wasn't Meant for You Anyway": 'https://open.spotify.com/album/5HdNNSl4kVSi8LFtPNLYPy',
};

async function updateSpotifyUrls() {
  try {
    // Fetch all music items without Spotify URLs
    const musicItems = await sanityClient.fetch(`
      *[_type == "shelfItem" && mediaType == "music"] {
        _id,
        title,
        author,
        spotifyUrl
      }
    `);

    console.log(`Found ${musicItems.length} music items\n`);

    const toUpdate = [];
    const notFound = [];

    for (const item of musicItems) {
      const spotifyUrl = SPOTIFY_URLS[item.title];
      
      if (spotifyUrl && !item.spotifyUrl) {
        toUpdate.push({ ...item, newUrl: spotifyUrl });
      } else if (!spotifyUrl && !item.spotifyUrl) {
        notFound.push(item);
      }
    }

    console.log('Albums to update:');
    toUpdate.forEach(item => {
      console.log(`  - ${item.title} by ${item.author}`);
      console.log(`    URL: ${item.newUrl}`);
    });

    if (notFound.length > 0) {
      console.log('\nAlbums without known Spotify URLs (add manually):');
      notFound.forEach(item => {
        console.log(`  - ${item.title} by ${item.author}`);
      });
    }

    // If SANITY_TOKEN is set, perform updates
    if (process.env.SANITY_TOKEN) {
      console.log('\n--- Performing updates ---\n');
      
      for (const item of toUpdate) {
        try {
          await sanityClient
            .patch(item._id)
            .set({ spotifyUrl: item.newUrl })
            .commit();
          console.log(`✓ Updated: ${item.title}`);
        } catch (err) {
          console.error(`✗ Failed to update ${item.title}:`, err.message);
        }
      }
      
      console.log('\nDone!');
    } else {
      console.log('\n--- DRY RUN ---');
      console.log('Set SANITY_TOKEN environment variable to perform updates.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateSpotifyUrls();
