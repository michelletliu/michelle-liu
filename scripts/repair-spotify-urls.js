#!/usr/bin/env node
const { Buffer } = require('node:buffer');
const { createClient } = require('@sanity/client');

const sanityClient = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-10-10',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.');
  process.exit(1);
}

const MUSIC_QUERY = `
  *[_type == "shelfItem" && mediaType == "music"] {
    _id,
    title,
    author,
    spotifyUrl
  }
`;

const normalize = (value = '') => {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
};

const getSpotifyToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

const parseSpotifyUrl = (spotifyUrl) => {
  if (!spotifyUrl) return null;
  const match = spotifyUrl.match(/open\.spotify\.com\/(album|track|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
};

const pingSpotifyEntity = async (token, type, id) => {
  const endpointType = type === 'album' ? 'albums' : type === 'track' ? 'tracks' : type === 'playlist' ? 'playlists' : null;
  if (!endpointType) return false;
  const response = await fetch(`https://api.spotify.com/v1/${endpointType}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.ok;
};

const isExistingUrlValid = async (token, spotifyUrl) => {
  const parsed = parseSpotifyUrl(spotifyUrl);
  if (!parsed) return false;
  return pingSpotifyEntity(token, parsed.type, parsed.id);
};

const searchSpotifyLink = async (token, item) => {
  const terms = [item.title, item.author].filter(Boolean).join(' ');
  if (!terms.trim()) return null;
  const query = encodeURIComponent(terms);
  const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album,track&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.warn(`Unable to search Spotify for "${item.title}" (${response.status})`);
    return null;
  }

  const { albums, tracks } = await response.json();
  const candidates = [];

  if (albums?.items?.length) {
    albums.items.forEach((album) => {
      candidates.push({
        id: album.id,
        type: 'album',
        name: album.name,
        artists: album.artists.map((artist) => artist.name),
      });
    });
  }

  if (tracks?.items?.length) {
    tracks.items.forEach((track) => {
      candidates.push({
        id: track.id,
        type: 'track',
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
      });
    });
  }

  if (!candidates.length) return null;

  const normalizedTitle = normalize(item.title);
  const normalizedAuthor = normalize(item.author);

  const match = candidates.find((candidate) => {
    const normalizedCandidateTitle = normalize(candidate.name);
    const artistMatch = candidate.artists.some((artist) => normalize(artist).includes(normalizedAuthor));
    return normalizedCandidateTitle === normalizedTitle && artistMatch;
  });

  if (match) return match;

  const titleMatch = candidates.find((candidate) => normalize(candidate.name) === normalizedTitle);
  if (titleMatch) return titleMatch;

  const artistMatch = candidates.find((candidate) =>
    candidate.artists.some((artist) => normalize(artist).includes(normalizedAuthor))
  );
  if (artistMatch) return artistMatch;

  const preferredAlbum = candidates.find((candidate) => candidate.type === 'album');
  return preferredAlbum ?? candidates[0];
};

const repairSpotifyLinks = async () => {
  const token = await getSpotifyToken();
  console.log('✅ Spotify API token acquired.\n');

  const musicItems = await sanityClient.fetch(MUSIC_QUERY);
  console.log(`Found ${musicItems.length} music shelf items.\n`);

  const updates = [];
  const stillValid = [];
  const missing = [];

  for (const item of musicItems) {
    const needsLookup = !item.spotifyUrl;
    const valid = item.spotifyUrl ? await isExistingUrlValid(token, item.spotifyUrl) : false;

    if (valid) {
      stillValid.push(item);
      continue;
    }

    const result = await searchSpotifyLink(token, item);
    if (result) {
      updates.push({
        ...item,
        correctedUrl: `https://open.spotify.com/${result.type}/${result.id}`,
        foundAs: `${result.name} by ${result.artists.join(', ')}`,
      });
    } else {
      missing.push(item);
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  console.log(`✓ Valid links remained: ${stillValid.length}`);
  console.log(`🔁 Links to update: ${updates.length}`);
  console.log(`❓ Could not find Spotify match: ${missing.length}\n`);

  if (updates.length > 0) {
    updates.forEach((item) => {
      console.log(`- "${item.title}" by ${item.author}`);
      console.log(`  Old: ${item.spotifyUrl || '<none>'}`);
      console.log(`  New: ${item.correctedUrl}`);
      console.log(`  Matched as: ${item.foundAs}\n`);
    });
  }

  if (missing.length > 0) {
    console.log('Albums we could not match (verify manually):');
    missing.forEach((item) =>
      console.log(`  - "${item.title}" by ${item.author} (existing: ${item.spotifyUrl || 'none'})`)
    );
    console.log('');
  }

  if (!process.env.SANITY_TOKEN) {
    console.log('Set SANITY_TOKEN to apply these updates to Sanity.');
    return;
  }

  console.log('Updating Sanity...');
  for (const item of updates) {
    try {
      await sanityClient.patch(item._id).set({ spotifyUrl: item.correctedUrl }).commit();
      console.log(`✓ Updated ${item.title}`);
    } catch (error) {
      console.error(`✗ Failed to update ${item.title}:`, error.message);
    }
  }

  console.log('\nAll done.');
};

repairSpotifyLinks().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
