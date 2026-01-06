const { createClient } = require("@sanity/client");

const MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2";
const COVERART_BASE = "https://coverartarchive.org";

// MusicBrainz requires a User-Agent header
const USER_AGENT = "MichelleLiuPortfolio/1.0 (https://michelle-liu.com)";

// Sanity client
const sanityClient = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// Album hints for disambiguation (artist name variations or release year)
const albumHints = {
  "Born to Die": { artist: "Lana Del Rey", year: 2012 },
  "Brat": { artist: "Charli XCX", year: 2024 },
  "Ultraviolence": { artist: "Lana Del Rey", year: 2014 },
  "Hozier": { artist: "Hozier", year: 2014 },
  "1989 (Deluxe)": { artist: "Taylor Swift", year: 2014, searchTitle: "1989" },
  "Coup D'Etat": { artist: "G-Dragon", year: 2013 },
  "Electra Heart": { artist: "Marina and the Diamonds", year: 2012 },
  "Portal": { artist: "Balu Brigada", year: 2023 },
  // 2025 Spotify Wrapped albums
  "So Close to What": { artist: "Tate McRae", year: 2024 },
  "Submarine": { artist: "The Marías", year: 2024 },
  "My 21st Century Blues": { artist: "RAYE", year: 2023 },
  "Pure Heroine": { artist: "Lorde", year: 2013 },
  "French Exit": { artist: "TV Girl", year: 2014 },
  "Bird's Eye": { artist: "Ravyn Lenae", year: 2024 },
  "This Wasn't Meant for You Anyway": { artist: "Lola Young", year: 2024 },
  "how i'm feeling now": { artist: "Charli XCX", year: 2020 },
  "back to friends": { artist: "sombr", year: 2024 },
  "Ruby": { artist: "Jennie", year: 2025 },
  "Prada": { artist: "cassö", year: 2024 },
  "Love Potions": { artist: "BJ Lips", year: 2024 },
  // 2024 Spotify Wrapped albums
  "eternal sunshine": { artist: "Ariana Grande", year: 2024 },
  "Melodrama": { artist: "Lorde", year: 2017 },
  "Something to Give Each Other": { artist: "Troye Sivan", year: 2023 },
  "Wiped Out!": { artist: "The Neighbourhood", year: 2015 },
  "I Love You.": { artist: "The Neighbourhood", year: 2013 },
  "The Secret of Us": { artist: "Gracie Abrams", year: 2024 },
  "Norman Fucking Rockwell!": { artist: "Lana Del Rey", year: 2019 },
  "Honeymoon": { artist: "Lana Del Rey", year: 2015 },
  "Unreal Unearth": { artist: "Hozier", year: 2023 },
  "Starboy": { artist: "The Weeknd", year: 2016 },
  "The Tortured Poets Department": { artist: "Taylor Swift", year: 2024 },
  "Hyperion": { artist: "Gesaffelstein", year: 2019 },
  // 2023 Spotify Wrapped albums
  "The 1975": { artist: "The 1975", year: 2013 },
  "Barbie The Album": { artist: "Various Artists", year: 2023 },
  "Lover": { artist: "Taylor Swift", year: 2019 },
  "Midnights": { artist: "Taylor Swift", year: 2022 },
  "Call Me If You Get Lost": { artist: "Tyler, The Creator", year: 2021 },
  "Being Funny in a Foreign Language": { artist: "The 1975", year: 2022 },
  "All My Demons Greeting Me as a Friend": { artist: "AURORA", year: 2016 },
  "Meet the Woo": { artist: "Pop Smoke", year: 2019 },
  "The Good Life": { artist: "Maisie Peters", year: 2023 },
  "Call Me By Your Name (Soundtrack)": { artist: "Sufjan Stevens", year: 2017, searchTitle: "Call Me by Your Name" },
  // 2020 Spotify Wrapped albums
  "Visions": { artist: "Grimes", year: 2012 },
  "Miss Anthropocene": { artist: "Grimes", year: 2020 },
  "After Hours": { artist: "The Weeknd", year: 2020 },
  "Future Nostalgia": { artist: "Dua Lipa", year: 2020 },
  "Manic": { artist: "Halsey", year: 2020 },
  "Fine Line": { artist: "Harry Styles", year: 2019 },
  "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?": { artist: "Billie Eilish", year: 2019 },
  "Art Angels": { artist: "Grimes", year: 2015 },
  "Immunity": { artist: "Clairo", year: 2019 },
  "Hot Pink": { artist: "Doja Cat", year: 2019 },
  "Changes": { artist: "Justin Bieber", year: 2020 },
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search MusicBrainz for a release (album/single)
 * Returns the MBID of the best match
 */
async function searchMusicBrainz(albumTitle, artistName, year = null) {
  // Build search query
  let query = `release:"${albumTitle}"`;
  if (artistName) {
    query += ` AND artist:"${artistName}"`;
  }

  const params = new URLSearchParams({
    query,
    fmt: "json",
    limit: "10",
  });

  const response = await fetch(`${MUSICBRAINZ_BASE}/release?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(`  MusicBrainz search failed: ${response.status}`);
    return null;
  }

  const data = await response.json();

  if (!data.releases || data.releases.length === 0) {
    return null;
  }

  // Find the best match - prefer official releases with cover art
  let bestMatch = null;

  for (const release of data.releases) {
    // Check if year matches (if provided)
    if (year && release.date) {
      const releaseYear = parseInt(release.date.substring(0, 4));
      if (releaseYear !== year) {
        continue;
      }
    }

    // Prefer releases with higher score and status "Official"
    if (!bestMatch || release.score > bestMatch.score) {
      bestMatch = release;
    }
  }

  // Fall back to first result if no better match
  if (!bestMatch && data.releases.length > 0) {
    bestMatch = data.releases[0];
  }

  if (bestMatch) {
    return {
      mbid: bestMatch.id,
      title: bestMatch.title,
      artist: bestMatch["artist-credit"]?.[0]?.name,
      date: bestMatch.date,
    };
  }

  return null;
}

/**
 * Get cover art URL from Cover Art Archive
 * Returns the front cover URL if available
 */
async function getCoverArt(mbid) {
  // First, check if cover art exists
  const response = await fetch(`${COVERART_BASE}/release/${mbid}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // No cover art available
    }
    console.error(`  Cover Art Archive error: ${response.status}`);
    return null;
  }

  const data = await response.json();

  // Find the front cover
  const frontCover = data.images?.find((img) => img.front === true);
  if (frontCover) {
    // Return the 500px thumbnail for better performance (or full image)
    return frontCover.thumbnails?.["500"] || frontCover.thumbnails?.large || frontCover.image;
  }

  // Fall back to first image if no front cover marked
  if (data.images && data.images.length > 0) {
    const first = data.images[0];
    return first.thumbnails?.["500"] || first.thumbnails?.large || first.image;
  }

  return null;
}

/**
 * Test if a URL is accessible
 */
async function testUrl(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🎵 Fetching all music items from Sanity...\n");

  // Get all music items from Sanity
  const musicItems = await sanityClient.fetch(`
    *[_type == "shelfItem" && mediaType == "music"]{
      _id,
      title,
      author,
      externalCoverUrl
    }
  `);

  console.log(`Found ${musicItems.length} music items\n`);

  const updates = [];
  const failed = [];
  const skipped = [];

  for (const item of musicItems) {
    const hint = albumHints[item.title] || {};
    const searchTitle = hint.searchTitle || item.title;
    const artistName = item.author || hint.artist;
    const year = hint.year;

    // Skip items without artist info and no hints
    if (!artistName) {
      console.log(`⚠ ${item.title} - no artist info, skipping`);
      skipped.push({ title: item.title, reason: "no artist" });
      continue;
    }

    // Test if current URL works
    const currentWorks = item.externalCoverUrl
      ? await testUrl(item.externalCoverUrl)
      : false;

    if (currentWorks) {
      console.log(`✓ ${item.title} - existing cover works`);
      continue;
    }

    // Search MusicBrainz
    console.log(
      `🔍 Searching: "${searchTitle}" by ${artistName}${year ? ` (${year})` : ""}...`
    );

    // MusicBrainz rate limit: 1 request per second
    await sleep(1100);

    const mbResult = await searchMusicBrainz(searchTitle, artistName, year);

    if (!mbResult) {
      console.log(`  ✗ Not found on MusicBrainz`);
      failed.push({ title: item.title, artist: artistName, reason: "not found on MusicBrainz" });
      continue;
    }

    console.log(`  Found: ${mbResult.title} by ${mbResult.artist} (MBID: ${mbResult.mbid})`);

    // Get cover art
    await sleep(1100);
    const coverUrl = await getCoverArt(mbResult.mbid);

    if (!coverUrl) {
      console.log(`  ✗ No cover art available`);
      failed.push({ title: item.title, artist: artistName, reason: "no cover art on Archive" });
      continue;
    }

    // Verify the cover URL works
    const coverWorks = await testUrl(coverUrl);

    if (coverWorks) {
      console.log(`  → Cover: ${coverUrl}`);
      updates.push({
        _id: item._id,
        title: item.title,
        artist: artistName,
        oldUrl: item.externalCoverUrl,
        newUrl: coverUrl,
        mbid: mbResult.mbid,
      });
    } else {
      console.log(`  ✗ Cover URL not accessible`);
      failed.push({ title: item.title, artist: artistName, reason: "cover URL inaccessible" });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");
  console.log("=".repeat(50));
  console.log(`✅ Albums to update: ${updates.length}`);
  console.log(`⚠️  Skipped (no artist): ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (skipped.length > 0) {
    console.log("\nSkipped items:");
    skipped.forEach((s) => console.log(`  - ${s.title}: ${s.reason}`));
  }

  if (failed.length > 0) {
    console.log("\nFailed items:");
    failed.forEach((f) => console.log(`  - ${f.title} by ${f.artist}: ${f.reason}`));
  }

  if (updates.length > 0) {
    console.log("\n--- Updates to apply ---");
    console.log(JSON.stringify(updates, null, 2));
  }

  // Apply updates if SANITY_TOKEN is set
  if (process.env.SANITY_TOKEN && updates.length > 0) {
    console.log("\n🚀 Applying updates to Sanity...");

    for (const update of updates) {
      try {
        await sanityClient
          .patch(update._id)
          .set({ externalCoverUrl: update.newUrl })
          .commit();
        console.log(`  ✓ Updated: ${update.title}`);
      } catch (err) {
        console.error(`  ✗ Failed to update ${update.title}:`, err.message);
      }
    }

    console.log("\n✨ Done!");
  } else if (!process.env.SANITY_TOKEN) {
    console.log("\n📝 Note: Set SANITY_TOKEN env var to apply updates automatically.");
    console.log("You can also manually update these in Sanity Studio.");
  }
}

main().catch(console.error);
