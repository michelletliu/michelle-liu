const { createClient } = require("@sanity/client");

const TMDB_API_KEY = "bcc72ac7b1d156541c8eab9e0b596bc2";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Sanity client
const sanityClient = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// Movie year hints (for more accurate TMDb searches)
const movieYearHints = {
  "Fallen Angels": 1995,
  "Perfect Blue": 1997,
  "The Boy and the Heron": 2023,
  "Dead Poets Society": 1989,
  "Oldboy": 2003,
  "Blue Velvet": 1986,
  "Wild at Heart": 1990,
  "Asteroid City": 2023,
  "Spider-Man: Across the Spider-Verse": 2023,
  "The Hunger Games: Catching Fire": 2013,
  "The Hunger Games": 2012,
  "The Wonderful Story of Henry Sugar": 2023,
  "Kiki's Delivery Service": 1989,
  "Parasite": 2019,
  "Nomadland": 2020,
  "Mulholland Drive": 2001,
  "Dune: Part Two": 2024,
  "La La Land": 2016,
  "The Silence of the Lambs": 1991,
  "Glass Onion": 2022,
  "The Hunger Games: The Ballad of Songbirds & Snakes": 2023,
  "Saltburn": 2023,
  "Oppenheimer": 2023,
  "Inception": 2010,
  "In the Mood for Love": 2000,
  "21": 2008,
  "Hotel Chevalier": 2007,
  "Inland Empire": 2006,
  "Memento": 2000,
  "Guardians of the Galaxy Vol. 3": 2023,
  "Heathers": 1988,
  "The Green Planet": 2022,
  "(500) Days of Summer": 2009,
  "Lost Highway": 1997,
  "Drive My Car": 2021,
  "Minions: The Rise of Gru": 2022,
  "Top Gun: Maverick": 2022,
  "Palo Alto": 2013,
  "Harry Potter and the Goblet of Fire": 2005,
  "The Godfather": 1972,
  "Roman Holiday": 1953,
  "Materialists": 2024,
  "Infernal Affairs": 2002,
  "Chungking Express": 1994,
  "Yi Yi": 2000,
  "Whiplash": 2014,
  "Beetlejuice": 1988,
  "The Matrix": 1999,
  "Wicked": 2024,
  "Left-Handed Girl": 2019,
  "Interstellar": 2014,
  "Frankenstein": 2024,
  "Anora": 2024,
};

async function searchMovie(title, year = null) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: title,
  });
  if (year) {
    params.append("year", year);
  }

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    // Return the first result with a poster
    const withPoster = data.results.find((r) => r.poster_path);
    if (withPoster) {
      return {
        title: withPoster.title,
        posterPath: withPoster.poster_path,
        posterUrl: `${TMDB_IMAGE_BASE}${withPoster.poster_path}`,
        tmdbId: withPoster.id,
      };
    }
  }
  return null;
}

async function testPosterUrl(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Fetching all movies from Sanity...\n");

  // Get all movies from Sanity
  const movies = await sanityClient.fetch(`
    *[_type == "shelfItem" && mediaType == "movie"]{
      _id,
      title,
      externalCoverUrl
    }
  `);

  console.log(`Found ${movies.length} movies\n`);

  const updates = [];
  const failed = [];

  for (const movie of movies) {
    const yearHint = movieYearHints[movie.title];

    // Test if current URL works
    const currentWorks = movie.externalCoverUrl
      ? await testPosterUrl(movie.externalCoverUrl)
      : false;

    if (currentWorks) {
      console.log(`✓ ${movie.title} - existing poster works`);
      continue;
    }

    // Search TMDb for the movie
    console.log(
      `Searching TMDb for: ${movie.title}${yearHint ? ` (${yearHint})` : ""}...`
    );
    const result = await searchMovie(movie.title, yearHint);

    if (result) {
      // Verify the new URL works
      const newUrlWorks = await testPosterUrl(result.posterUrl);

      if (newUrlWorks) {
        console.log(`  → Found: ${result.posterUrl}`);
        updates.push({
          _id: movie._id,
          title: movie.title,
          oldUrl: movie.externalCoverUrl,
          newUrl: result.posterUrl,
        });
      } else {
        console.log(`  ✗ Found poster but URL doesn't work`);
        failed.push(movie.title);
      }
    } else {
      console.log(`  ✗ No poster found`);
      failed.push(movie.title);
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\n--- Summary ---");
  console.log(`Movies to update: ${updates.length}`);
  console.log(`Failed to find: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed movies:", failed.join(", "));
  }

  // Output the updates as JSON for review
  console.log("\n--- Updates to apply ---");
  console.log(JSON.stringify(updates, null, 2));

  // If SANITY_TOKEN is set, apply updates
  if (process.env.SANITY_TOKEN && updates.length > 0) {
    console.log("\nApplying updates to Sanity...");

    for (const update of updates) {
      try {
        await sanityClient
          .patch(update._id)
          .set({ externalCoverUrl: update.newUrl })
          .commit();
        console.log(`  Updated: ${update.title}`);
      } catch (err) {
        console.error(`  Failed to update ${update.title}:`, err.message);
      }
    }

    console.log("\nDone!");
  } else if (!process.env.SANITY_TOKEN) {
    console.log(
      "\nNote: Set SANITY_TOKEN env var to apply updates automatically."
    );
    console.log(
      "You can also manually update these in Sanity Studio or use the MCP tools."
    );
  }
}

main().catch(console.error);
