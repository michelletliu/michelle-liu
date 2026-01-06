/**
 * Script to fix broken Spotify URLs for music albums in Sanity
 * 
 * Uses the Spotify Web API to search for albums and find correct URLs.
 * 
 * Usage:
 * node scripts/fix-spotify-urls.js
 * 
 * To actually update Sanity, set SANITY_TOKEN:
 * SANITY_TOKEN=xxx node scripts/fix-spotify-urls.js
 */

const { createClient } = require('@sanity/client');

// Sanity config
const sanityClient = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

// Spotify API credentials (using client credentials flow - no user auth needed)
const SPOTIFY_CLIENT_ID = 'bcc72ac7b1d156541c8eab9e0b596bc2';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Get Spotify access token using client credentials flow
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search Spotify for an album
async function searchSpotifyAlbum(token, title, artist) {
  // Clean up the search query
  const cleanTitle = title.replace(/[()]/g, '').trim();
  const cleanArtist = artist.split(',')[0].trim(); // Take first artist if multiple
  
  const query = encodeURIComponent(`album:${cleanTitle} artist:${cleanArtist}`);
  const url = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=5`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error(`Spotify search failed for "${title}" by "${artist}": ${response.status}`);
    return null;
  }

  const data = await response.json();
  
  if (data.albums && data.albums.items && data.albums.items.length > 0) {
    // Try to find exact or close match
    const albums = data.albums.items;
    
    // First try exact title match
    const exactMatch = albums.find(a => 
      a.name.toLowerCase() === title.toLowerCase() ||
      a.name.toLowerCase() === cleanTitle.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        url: exactMatch.external_urls.spotify,
        name: exactMatch.name,
        artist: exactMatch.artists.map(a => a.name).join(', ')
      };
    }
    
    // Otherwise return first result
    return {
      url: albums[0].external_urls.spotify,
      name: albums[0].name,
      artist: albums[0].artists.map(a => a.name).join(', ')
    };
  }
  
  return null;
}

// Test if a Spotify URL is valid
async function testSpotifyUrl(token, url) {
  if (!url) return false;
  
  // Extract album ID from URL
  const match = url.match(/album\/([a-zA-Z0-9]+)/);
  if (!match) return false;
  
  const albumId = match[1];
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function fixSpotifyUrls() {
  console.log('🎵 Spotify URL Fixer\n');
  
  // Check if we have Spotify credentials
  if (!SPOTIFY_CLIENT_SECRET) {
    console.log('⚠️  SPOTIFY_CLIENT_SECRET not set. Using manual URL mapping.\n');
    return useManualMapping();
  }

  let token;
  try {
    token = await getSpotifyToken();
    console.log('✓ Got Spotify access token\n');
  } catch (error) {
    console.error('✗ Failed to get Spotify token:', error.message);
    console.log('  Falling back to manual URL mapping.\n');
    return useManualMapping();
  }

  // Fetch all music items
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
  const broken = [];
  const notFound = [];
  const valid = [];

  for (const item of musicItems) {
    process.stdout.write(`Checking: ${item.title}... `);
    
    // Test existing URL if present
    if (item.spotifyUrl) {
      const isValid = await testSpotifyUrl(token, item.spotifyUrl);
      if (isValid) {
        console.log('✓ Valid');
        valid.push(item);
        continue;
      } else {
        console.log('✗ Broken');
        broken.push(item);
      }
    } else {
      console.log('⊘ Missing');
    }

    // Search for correct URL
    const result = await searchSpotifyAlbum(token, item.title, item.author);
    
    if (result) {
      toUpdate.push({
        ...item,
        newUrl: result.url,
        foundAs: `${result.name} by ${result.artist}`
      });
    } else {
      notFound.push(item);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✓ Valid URLs: ${valid.length}`);
  console.log(`✗ Broken URLs: ${broken.length}`);
  console.log(`🔍 Found replacements: ${toUpdate.length}`);
  console.log(`❓ Not found: ${notFound.length}`);

  if (toUpdate.length > 0) {
    console.log('\n📝 Albums to update:');
    toUpdate.forEach(item => {
      console.log(`  - "${item.title}" by ${item.author}`);
      console.log(`    Found as: ${item.foundAs}`);
      console.log(`    New URL: ${item.newUrl}`);
    });
  }

  if (notFound.length > 0) {
    console.log('\n❓ Albums not found on Spotify:');
    notFound.forEach(item => {
      console.log(`  - "${item.title}" by ${item.author}`);
    });
  }

  // Perform updates if SANITY_TOKEN is set
  if (process.env.SANITY_TOKEN && toUpdate.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('UPDATING SANITY');
    console.log('='.repeat(60) + '\n');
    
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
    
    console.log('\n✅ Done!');
  } else if (!process.env.SANITY_TOKEN) {
    console.log('\n--- DRY RUN ---');
    console.log('Set SANITY_TOKEN environment variable to perform updates.');
  }
}

// Fallback manual mapping when Spotify API isn't available
async function useManualMapping() {
  // Updated correct Spotify URLs (verified working)
  const CORRECT_SPOTIFY_URLS = {
    // Albums with known working URLs
    'Ultraviolence': 'https://open.spotify.com/album/1ORxRsK3MrSLvh7VQTF01F',
    'Born to Die': 'https://open.spotify.com/album/1uD1kdwTWH1DZQZqGKz6rY',
    'Hozier': 'https://open.spotify.com/album/5IXGltBe6UMmELC7R3ltzK',
    '1989 (Deluxe)': 'https://open.spotify.com/album/34OkZVpuzBa9y40ViWesk7', // 1989 Taylor's Version
    "Coup D'Etat": 'https://open.spotify.com/album/7EGbJWUfPe08X6Vti3aEDz',
    'Electra Heart': 'https://open.spotify.com/album/6Pf4Ed3pwcCh0cJDuwDG2V',
    'Submarine': 'https://open.spotify.com/album/1qjuT88iLrTr2bP5r0LcAt',
    'So Close to What': 'https://open.spotify.com/album/2oIuCTJgVs9S8vLWvZ2ENX',
    'Portal': 'https://open.spotify.com/album/78Tt5JWq1VG2LCrT1S5ZtL',
    'Brat': 'https://open.spotify.com/album/2lIZef4lzdvZkiiCzvPKj7',
    "how i'm feeling now": 'https://open.spotify.com/album/3vB5bKY1EYqyBzHPWVzV9B',
    'back to friends': 'https://open.spotify.com/album/1DsrDvDzuTVeMPXD77IqDT',
    "Bird's Eye": 'https://open.spotify.com/album/65v3bq8vI6Lv7kAEyQHXoJ',
    'French Exit': 'https://open.spotify.com/album/3Xs1pLJRY0V5oykFCfJmjA',
    'Pure Heroine': 'https://open.spotify.com/album/0rmhjUgoVa17LZuS8xWQ3H',
    'Prada': 'https://open.spotify.com/track/4vHCpNZ0VlCxMTfhKKSVAF', // Single/track
    'My 21st Century Blues': 'https://open.spotify.com/album/3U8n8LzBx2o9gYXvvNq4uH',
    'Ruby': 'https://open.spotify.com/album/4qkZuGXBqQYjR19tc91bJt',
    "This Wasn't Meant for You Anyway": 'https://open.spotify.com/album/5HdNNSl4kVSi8LFtPNLYPy',
    // Additional albums
    'Call Me By Your Name (Soundtrack)': 'https://open.spotify.com/album/3x4Fmwg65lyjhVnT9y7wG9',
    'The Secret of Us': 'https://open.spotify.com/album/0jRGPBVLBVeuYvQlbebSFG',
    'Manic': 'https://open.spotify.com/album/0rvYkZMvl9ByMqvSz0Nlsu',
    'Changes': 'https://open.spotify.com/album/63iWSELt9V1kV6RSMxN7Ii',
    'Unreal Unearth': 'https://open.spotify.com/album/3SbtQ35hTiOfMHvfloFGiP',
    'I Love You.': 'https://open.spotify.com/album/2Xoteh7uEpea4TohMxjtaq',
    'Meet the Woo': 'https://open.spotify.com/album/5TZMwZHpbIi5oFzT91EGba',
    'Fine Line': 'https://open.spotify.com/album/7xV2TzoaVc0ycW7fwBwAml',
    'Starboy': 'https://open.spotify.com/album/2ODvWsOgouMbaA5xf0RkJe',
    'Lover': 'https://open.spotify.com/album/1NAmidJlEaVgA3MpcPFYGq',
    'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?': 'https://open.spotify.com/album/0S0KGZnfBGSIssfF54WSJh',
    'Art Angels': 'https://open.spotify.com/album/3Rb9EwGw3LWfvLe11brIm4',
    'Midnights': 'https://open.spotify.com/album/3lS1y25WAhcqJDATJK70Mq',
    'Norman Fucking Rockwell!': 'https://open.spotify.com/album/5XpEKORZ4y6OrCZSKsi46A',
    'Melodrama': 'https://open.spotify.com/album/2B87zXm9bOWvAJdkJBTpzF',
    'After Hours': 'https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj',
    'Call Me If You Get Lost': 'https://open.spotify.com/album/45ba6QAtNrdv6Ke4MFOKk9',
    'Hot Pink': 'https://open.spotify.com/album/1MmVkhiwTH0BkNOU3nqU5S',
    'Future Nostalgia': 'https://open.spotify.com/album/5lKB61UT8MIvJoLLse99Op',
    'The Good Witch': 'https://open.spotify.com/album/0pXQ1kTwsz0QHlvGwzXFg8',
    'Something to Give Each Other': 'https://open.spotify.com/album/1nGgZv04wJYbMg1ifnPZqh',
    'Miss Anthropocene': 'https://open.spotify.com/album/2bOwNQdP3aDFWKJMolqOb5',
    'Visions': 'https://open.spotify.com/album/6VRwvZfKoXQxMCmhOKabAc',
    'Immunity': 'https://open.spotify.com/album/2rJayW4dXvHOTF1jlULhj5',
    'Wiped Out!': 'https://open.spotify.com/album/4DWl4cNvwsFxoqRZDPHSdD',
    'Being Funny in a Foreign Language': 'https://open.spotify.com/album/7qNnpzPKC7rLPrwLXdBNOD',
    'eternal sunshine': 'https://open.spotify.com/album/5EYKrEDnKhhcNxGedaRQeK',
    'The 1975': 'https://open.spotify.com/album/7bFPsKplE73jq7X2vJBjqr',
    'Barbie The Album': 'https://open.spotify.com/album/4xLKn3Xh6keBYKSFuhlYvp',
    'The Tortured Poets Department': 'https://open.spotify.com/album/5H7ixXZfsNMGbIE5OBSpcb',
    'All My Demons Greeting Me as a Friend': 'https://open.spotify.com/album/3s4OoDBb7TqIvkL3w6CPXR',
  };

  // Fetch all music items
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
  const alreadySet = [];

  for (const item of musicItems) {
    const correctUrl = CORRECT_SPOTIFY_URLS[item.title];
    
    if (correctUrl) {
      if (item.spotifyUrl !== correctUrl) {
        toUpdate.push({ ...item, newUrl: correctUrl });
      } else {
        alreadySet.push(item);
      }
    } else {
      notFound.push(item);
    }
  }

  console.log('📝 Albums to update:');
  toUpdate.forEach(item => {
    console.log(`  - "${item.title}" by ${item.author}`);
    console.log(`    Old: ${item.spotifyUrl || '(none)'}`);
    console.log(`    New: ${item.newUrl}`);
  });

  if (notFound.length > 0) {
    console.log('\n❓ Albums without known URLs (add manually):');
    notFound.forEach(item => {
      console.log(`  - "${item.title}" by ${item.author}`);
    });
  }

  console.log(`\n✓ Already correct: ${alreadySet.length}`);
  console.log(`📝 Need update: ${toUpdate.length}`);
  console.log(`❓ Not in mapping: ${notFound.length}`);

  // Perform updates if SANITY_TOKEN is set
  if (process.env.SANITY_TOKEN && toUpdate.length > 0) {
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
    
    console.log('\n✅ Done!');
  } else if (!process.env.SANITY_TOKEN) {
    console.log('\n--- DRY RUN ---');
    console.log('Set SANITY_TOKEN environment variable to perform updates.');
  }
}

fixSpotifyUrls().catch(console.error);
