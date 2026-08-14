/**
 * Preloading utility for Sanity data
 * Fetches data in the background to improve perceived performance
 * when users navigate to likely pages (Apple, Roblox, Adobe, NASA, Art, About)
 */

import { muxPosterUrl } from "../lib/muxPoster";
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
  STARTUPS_QUERY,
  PROJECTS_QUERY,
  EXPERIMENT_PROJECTS_QUERY,
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
  Startup,
} from "./types";

/** Cache keys for Work tab Sanity payloads (HomePageClient hydrates from these). */
export const WORK_SANITY_PROJECTS_KEY = "work:sanityProjects";
export const WORK_EXPERIMENT_PROJECTS_KEY = "work:experimentProjects";

type WorkSanityProject = {
  company: string;
  heroVideo?: string;
};

type WorkExperimentProject = {
  projectId?: string;
  muxPlaybackIdClip?: string;
  muxPlaybackId?: string;
};

// Simple in-memory cache for preloaded data
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track if preloading is already in progress to avoid duplicate calls
let preloadingInProgress = false;
const projectRequests = new Map<
  string,
  Promise<{ project: Project | null; unlocked: boolean }>
>();

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
 * Set data in cache (also used by pages after a live fetch so revisits are instant)
 */
export function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function fetchProjectByCompany(
  company: string,
): Promise<{ project: Project | null; unlocked: boolean }> {
  const existing = projectRequests.get(company);
  if (existing) return existing;

  const request = fetch(
    `/api/project?company=${encodeURIComponent(company)}`,
    {
      cache: "no-store",
      credentials: "same-origin",
    },
  ).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch project ${company}: ${response.status}`);
    }

    return {
      project: (await response.json()) as Project | null,
      unlocked: response.headers.get("x-project-unlocked") === "true",
    };
  });

  projectRequests.set(company, request);
  const clear = () => {
    if (projectRequests.get(company) === request) {
      projectRequests.delete(company);
    }
  };
  void request.then(clear, clear);

  return request;
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
 *
 * Prefer calling this on project-card hover — not on Work mount. Hitting
 * `/api/project` eagerly in dev queues a heavy Next compile that blocks
 * Work → About / Art soft navigations for tens of seconds.
 */
export async function preloadProject(company: string): Promise<void> {
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
    const { project: data } = await fetchProjectByCompany(company);
    if (data) {
      setCachedData(cacheKey, data);
      if (data.heroImage) warmImage(urlFor(data.heroImage).width(1200).url());
      warmMuxManifest(data.heroVideo);
    }
  } catch (err) {
    console.warn(`Failed to preload project ${company}:`, err);
  }
}

/** Warm above-the-fold art thumbs so Work → Art doesn't shimmer in. */
function warmArtImages(
  artPieces: ArtPiece[] | null,
  sketchbooks: Sketchbook[] | null,
): void {
  if (artPieces) {
    for (const piece of artPieces.slice(0, 8)) {
      if (piece.image) warmImage(urlFor(piece.image).width(800).url());
    }
  }
  const firstBook = sketchbooks?.[0];
  if (firstBook?.images) {
    for (const img of firstBook.images.slice(0, 4)) {
      if (img.asset) warmImage(urlFor(img).height(600).url());
    }
  }
}

/**
 * Preload art page data (+ warm first gallery thumbs)
 */
export async function preloadArtPage(): Promise<void> {
  const cacheKeyArt = "art:pieces";
  const cacheKeySketchbooks = "art:sketchbooks";
  const cacheKeyMurals = "art:murals";

  const cachedArt = getCachedData<ArtPiece[]>(cacheKeyArt);
  const cachedSketchbooks = getCachedData<Sketchbook[]>(cacheKeySketchbooks);
  const cachedMurals = getCachedData<Mural[]>(cacheKeyMurals);

  // Data already cached — still warm media URLs (browser cache may be cold).
  if (cachedArt && cachedSketchbooks && cachedMurals) {
    warmArtImages(cachedArt, cachedSketchbooks);
    return;
  }

  try {
    const [artPieces, sketchbooks, murals] = await Promise.all([
      !cachedArt ? client.fetch<ArtPiece[]>(ART_PIECES_QUERY) : Promise.resolve(null),
      !cachedSketchbooks
        ? client.fetch<Sketchbook[]>(SKETCHBOOKS_QUERY)
        : Promise.resolve(null),
      !cachedMurals ? client.fetch<Mural[]>(MURALS_QUERY) : Promise.resolve(null),
    ]);

    if (artPieces) setCachedData(cacheKeyArt, artPieces);
    if (sketchbooks) setCachedData(cacheKeySketchbooks, sketchbooks);
    if (murals) setCachedData(cacheKeyMurals, murals);

    warmArtImages(
      artPieces ?? cachedArt,
      sketchbooks ?? cachedSketchbooks,
    );
  } catch (err) {
    console.warn("Failed to preload art page:", err);
  }
}

/**
 * Preload about page data
 */
export async function preloadAboutPage(): Promise<void> {
  const cacheKeys = {
    experiences: "about:experiences",
    communities: "about:communities",
    shelfItems: "about:shelfItems",
    quotes: "about:quotes",
    loreItems: "about:loreItems",
    startups: "about:startups",
  };

  // Skip if all data is already cached
  if (
    getCachedData(cacheKeys.experiences) &&
    getCachedData(cacheKeys.communities) &&
    getCachedData(cacheKeys.shelfItems) &&
    getCachedData(cacheKeys.quotes) &&
    getCachedData(cacheKeys.loreItems) &&
    getCachedData(cacheKeys.startups)
  ) {
    return;
  }

  try {
    const [experiences, communities, shelfItems, quotes, loreItems, startups] =
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
        !getCachedData(cacheKeys.startups)
          ? client.fetch<Startup[]>(STARTUPS_QUERY)
          : Promise.resolve(null),
      ]);

    if (experiences) setCachedData(cacheKeys.experiences, experiences);
    if (communities) setCachedData(cacheKeys.communities, communities);
    if (shelfItems) setCachedData(cacheKeys.shelfItems, shelfItems);
    if (quotes) setCachedData(cacheKeys.quotes, quotes);
    if (loreItems) setCachedData(cacheKeys.loreItems, loreItems);
    if (startups) setCachedData(cacheKeys.startups, startups);
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

/** Warm Work project thumbnails so Art → Work doesn't shimmer in. */
function warmWorkMedia(
  projects: WorkSanityProject[] | null,
  experiments: WorkExperimentProject[] | null,
): void {
  if (projects) {
    for (const project of projects) {
      if (project.heroVideo) {
        warmImage(
          `https://image.mux.com/${project.heroVideo}/thumbnail.png?width=1920`,
        );
      }
    }
  }
  if (experiments) {
    for (const experiment of experiments.slice(0, 8)) {
      const playbackId =
        experiment.muxPlaybackIdClip || experiment.muxPlaybackId;
      if (playbackId) {
        // Must match the card's poster URL exactly or the warm request is wasted.
        warmImage(
          muxPosterUrl(playbackId, {
            projectId: experiment.projectId,
            width: 1920,
          }),
        );
      }
    }
  }
}

/**
 * Preload Work tab Sanity lists (+ warm first card thumbs).
 * HomePageClient hydrates from these keys after mount.
 */
export async function preloadWorkPage(): Promise<void> {
  const cachedProjects = getCachedData<WorkSanityProject[]>(
    WORK_SANITY_PROJECTS_KEY,
  );
  const cachedExperiments = getCachedData<WorkExperimentProject[]>(
    WORK_EXPERIMENT_PROJECTS_KEY,
  );

  if (cachedProjects && cachedExperiments) {
    warmWorkMedia(cachedProjects, cachedExperiments);
    return;
  }

  try {
    const [projects, experiments] = await Promise.all([
      cachedProjects
        ? Promise.resolve(null)
        : client.fetch<WorkSanityProject[]>(PROJECTS_QUERY),
      cachedExperiments
        ? Promise.resolve(null)
        : client.fetch<WorkExperimentProject[]>(EXPERIMENT_PROJECTS_QUERY),
    ]);

    if (projects) setCachedData(WORK_SANITY_PROJECTS_KEY, projects);
    if (experiments) setCachedData(WORK_EXPERIMENT_PROJECTS_KEY, experiments);

    warmWorkMedia(
      projects ?? cachedProjects,
      experiments ?? cachedExperiments,
    );
  } catch (err) {
    console.warn("Failed to preload work page:", err);
  }
}

/**
 * Preload all likely pages when user enters a main tab.
 * Work/Art/About Sanity data is fetched eagerly so tab switches feel instant.
 * Project modal APIs stay off this path — they compile `/api/project` in dev
 * and starve tab-route compiles. Cards call `preloadProject` on hover instead.
 */
export function preloadLikelyPages(): void {
  if (preloadingInProgress) return;
  preloadingInProgress = true;

  void (async () => {
    try {
      // Tab destinations only — never compete with /about|/art route compiles
      await Promise.all([
        preloadWorkPage(),
        preloadArtPage(),
        preloadAboutPage(),
      ]);

      const doRest = async () => {
        try {
          await preloadLibraryPage();
        } finally {
          preloadingInProgress = false;
        }
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          void doRest();
        }, { timeout: 5000 });
      } else {
        setTimeout(() => {
          void doRest();
        }, 1500);
      }
    } catch {
      preloadingInProgress = false;
    }
  })();
}
