/**
 * Preloading utility for Sanity data
 * Fetches data in the background to improve perceived performance
 * when users navigate to likely pages (Apple, Roblox, Adobe, NASA, Art, About)
 */

import { client } from "./client";
import {
  PROJECT_BY_COMPANY_QUERY,
  ART_PIECES_QUERY,
  SKETCHBOOKS_QUERY,
  MURALS_QUERY,
  EXPERIENCES_QUERY,
  COMMUNITIES_QUERY,
  SHELF_ITEMS_QUERY,
  QUOTES_QUERY,
  LORE_ITEMS_QUERY,
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
 * Preload project data for a specific company
 */
async function preloadProject(company: string): Promise<void> {
  const cacheKey = `project:${company}`;
  if (getCachedData(cacheKey)) return;

  try {
    const data = await client.fetch<Project>(PROJECT_BY_COMPANY_QUERY, {
      company,
    });
    if (data) {
      setCachedData(cacheKey, data);
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
 * Preload all likely pages when user enters homepage
 * Uses requestIdleCallback for non-blocking preloading
 */
export function preloadLikelyPages(): void {
  if (preloadingInProgress) return;
  preloadingInProgress = true;

  const doPreload = async () => {
    // Preload all likely pages in parallel
    // Priority: All main work projects, Art and About are main nav items
    await Promise.all([
      preloadProject("apple"),
      preloadProject("roblox"),
      preloadProject("adobe"),
      preloadProject("nasa"),
      preloadArtPage(),
      preloadAboutPage(),
    ]);

    preloadingInProgress = false;
  };

  // Use requestIdleCallback if available, otherwise use setTimeout
  // This ensures preloading doesn't block the main thread
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => doPreload(), { timeout: 3000 });
  } else {
    // Fallback: wait for initial render to complete
    setTimeout(doPreload, 1000);
  }
}
