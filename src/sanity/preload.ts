/**
 * Preloading utility for Sanity data
 * Fetches data in the background to improve perceived performance
 * when users navigate to likely pages (Apple, Roblox, Adobe, NASA, Art, About)
 */

import profilePic from "../assets/Website Profile Pic.png";
import { client, urlFor } from "./client";
import {
  ART_PIECES_QUERY,
  SKETCHBOOKS_QUERY,
  MURALS_QUERY,
  EXPERIENCES_QUERY,
  COMMUNITIES_QUERY,
  SHELF_ITEMS_QUERY,
  QUOTES_QUERY,
  LORE_ITEMS_QUERY,
  SHELF_BOOKS_QUERY,
  BOOK_YEARS_QUERY,
} from "./queries";
import type {
  Project,
  ArtPiece,
  Sketchbook,
  Mural,
  Experience,
  Community,
  ShelfItem,
  LoreItem,
  AboutQuote,
} from "./types";

// Simple in-memory cache for preloaded data
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track if preloading is already in progress to avoid duplicate calls
let preloadingInProgress = false;

/**
 * Get cached data if available and not expired
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

/**
 * Set data in cache
 */
function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Warm the browser cache for an image URL by issuing an Image() request.
 * No-op outside the browser.
 */
function warmImage(src: string | undefined): void {
  if (!src || typeof window === "undefined") return;
  const img = new Image();
  // High priority hint where supported, falls back gracefully otherwise.
  (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
  img.decoding = "async";
  img.src = src;
}

/**
 * Warm the browser cache for a Mux HLS playlist by fetching the .m3u8 manifest.
 * The manifest is small (~1KB) but its DNS / TLS / first-byte cost is what
 * makes the modal's video element take a moment to start; pre-fetching here
 * cuts that out so the popup opens with the video ready to render.
 */
function warmMuxManifest(playbackId: string | undefined): void {
  if (!playbackId || typeof window === "undefined") return;
  fetch(`https://stream.mux.com/${playbackId}.m3u8`, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "force-cache",
  }).catch(() => {
    /* ignore — best-effort warmup */
  });
}

/**
 * Preload project data for a specific company. Also warms the browser cache
 * for the hero image and Mux video manifest so the popup opens without
 * showing the gray shimmer.
 */
async function preloadProject(company: string): Promise<void> {
  const cacheKey = `project:${company}`;
  const existing = getCachedData<Project>(cacheKey);
  if (existing) {
    // Sanity data already cached — still warm the media URLs in case this is
    // a fresh page load where the browser cache was discarded.
    if (existing.heroImage) warmImage(urlFor(existing.heroImage).width(1200).url());
    warmMuxManifest(existing.heroVideo);
    return;
  }

  try {
    const response = await fetch(`/api/project?company=${encodeURIComponent(company)}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error(`Project API returned ${response.status}`);
    }
    const data = (await response.json()) as Project;
    if (data) {
      setCachedData(cacheKey, data);
      if (data.heroImage) warmImage(urlFor(data.heroImage).width(1200).url());
      warmMuxManifest(data.heroVideo);
    }
  } catch (err) {
    console.warn(`Failed to preload project ${company}:`, err);
  }
}

/**
 * Preload art page data
 */
async function preloadArtPage(): Promise<void> {
  const cacheKeyArt = "art:pieces";
  const cacheKeySketchbooks = "art:sketchbooks";
  const cacheKeyMurals = "art:murals";

  // Skip if all data is already cached
  if (
    getCachedData(cacheKeyArt) &&
    getCachedData(cacheKeySketchbooks) &&
    getCachedData(cacheKeyMurals)
  ) {
    return;
  }

  try {
    const [artPieces, sketchbooks, murals] = await Promise.all([
      !getCachedData(cacheKeyArt)
        ? client.fetch<ArtPiece[]>(ART_PIECES_QUERY)
        : Promise.resolve(null),
      !getCachedData(cacheKeySketchbooks)
        ? client.fetch<Sketchbook[]>(SKETCHBOOKS_QUERY)
        : Promise.resolve(null),
      !getCachedData(cacheKeyMurals)
        ? client.fetch<Mural[]>(MURALS_QUERY)
        : Promise.resolve(null),
    ]);

    if (artPieces) setCachedData(cacheKeyArt, artPieces);
    if (sketchbooks) setCachedData(cacheKeySketchbooks, sketchbooks);
    if (murals) setCachedData(cacheKeyMurals, murals);
  } catch (err) {
    console.warn("Failed to preload art page:", err);
  }
}

/**
 * Preload about page data
 */
async function preloadAboutPage(): Promise<void> {
  const img = new Image();
  img.src = profilePic;

  const cacheKeys = {
    experiences: "about:experiences",
    communities: "about:communities",
    shelfItems: "about:shelfItems",
    quotes: "about:quotes",
    loreItems: "about:loreItems",
  };

  // Skip if all data is already cached
  if (
    getCachedData(cacheKeys.experiences) &&
    getCachedData(cacheKeys.communities) &&
    getCachedData(cacheKeys.shelfItems) &&
    getCachedData(cacheKeys.quotes) &&
    getCachedData(cacheKeys.loreItems)
  ) {
    return;
  }

  try {
    const [experiences, communities, shelfItems, quotes, loreItems] =
      await Promise.all([
        !getCachedData(cacheKeys.experiences)
          ? client.fetch<Experience[]>(EXPERIENCES_QUERY)
          : Promise.resolve(null),
        !getCachedData(cacheKeys.communities)
          ? client.fetch<Community[]>(COMMUNITIES_QUERY)
          : Promise.resolve(null),
        !getCachedData(cacheKeys.shelfItems)
          ? client.fetch<ShelfItem[]>(SHELF_ITEMS_QUERY)
          : Promise.resolve(null),
        !getCachedData(cacheKeys.quotes)
          ? client.fetch<AboutQuote[]>(QUOTES_QUERY)
          : Promise.resolve(null),
        !getCachedData(cacheKeys.loreItems)
          ? client.fetch<LoreItem[]>(LORE_ITEMS_QUERY)
          : Promise.resolve(null),
      ]);

    if (experiences) setCachedData(cacheKeys.experiences, experiences);
    if (communities) setCachedData(cacheKeys.communities, communities);
    if (shelfItems) setCachedData(cacheKeys.shelfItems, shelfItems);
    if (quotes) setCachedData(cacheKeys.quotes, quotes);
    if (loreItems) setCachedData(cacheKeys.loreItems, loreItems);
  } catch (err) {
    console.warn("Failed to preload about page:", err);
  }
}

/**
 * Preload library page data
 */
async function preloadLibraryPage(): Promise<void> {
  const cacheKeys = {
    books: "library:books",
    years: "library:years",
  };

  // Skip if all data is already cached
  if (getCachedData(cacheKeys.books) && getCachedData(cacheKeys.years)) {
    return;
  }

  try {
    const [books, years] = await Promise.all([
      !getCachedData(cacheKeys.books)
        ? client.fetch(SHELF_BOOKS_QUERY)
        : Promise.resolve(null),
      !getCachedData(cacheKeys.years)
        ? client.fetch<string[]>(BOOK_YEARS_QUERY)
        : Promise.resolve(null),
    ]);

    if (books) setCachedData(cacheKeys.books, books);
    if (years) setCachedData(cacheKeys.years, years);
  } catch (err) {
    console.warn("Failed to preload library page:", err);
  }
}

/**
 * Preload all likely pages when user enters homepage.
 * Apple and Roblox are fetched eagerly (most likely to be clicked first).
 * Everything else is deferred to idle time so it doesn't compete for bandwidth.
 */
export function preloadLikelyPages(): void {
  if (preloadingInProgress) return;
  preloadingInProgress = true;

  // High-priority: fetch immediately so data is ready before user clicks
  Promise.all([preloadProject("apple"), preloadProject("roblox")]).then(
    () => {
      // Lower-priority: defer remaining fetches to idle time
      const doRest = async () => {
        await Promise.all([
          preloadProject("adobe"),
          preloadProject("nasa"),
          preloadArtPage(),
          preloadAboutPage(),
          preloadLibraryPage(),
        ]);
        preloadingInProgress = false;
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => doRest(), { timeout: 3000 });
      } else {
        setTimeout(doRest, 500);
      }
    },
  );
}
