"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  openAccessImageUrl,
  type MetArtwork,
  type MetSearchResponse,
} from "./metArtworks";
import {
  CURATED_MET_FINGERPRINT,
  CURATED_MET_OBJECT_IDS,
  curatedFirstOpenObjectIds,
} from "./metCurated";

/**
 * Warm the five first-open carousel JPEGs as soon as the curated hand arrives,
 * so opening the picker does not paint Monet Family (and ±2) as empty white
 * frames while the network catches up.
 */
function preloadCuratedFirstOpenImages(artworks: readonly MetArtwork[]): void {
  if (typeof Image === "undefined" || artworks.length === 0) return;
  const warm = new Set(curatedFirstOpenObjectIds());
  for (const artwork of artworks) {
    if (!warm.has(artwork.objectID)) continue;
    const url = openAccessImageUrl(artwork);
    if (!url) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

export type MetSearchStatus = "idle" | "loading" | "success" | "error";

/** Whether the strip is showing the curated default or a search result. */
export type MetStripMode = "curated" | "results";

/**
 * How long typing has to settle before a search leaves.
 *
 * Each search costs a Met `/search` plus a wave of `/objects` hydration, so
 * firing per keystroke would spend a dozen upstream round trips to answer a
 * prefix nobody asked about. Requests that do get sent are still aborted by
 * the next one, so the debounce is about upstream load and the AbortController
 * is about correctness — neither substitutes for the other.
 */
const SEARCH_DEBOUNCE_MS = 350;

export type MetSearchState = {
  status: MetSearchStatus;
  /** The query the current results belong to. */
  query: string;
  artworks: MetArtwork[];
  error: string | null;
  nextOffset: number | null;
  loadingMore: boolean;
  /** Whether results were restricted to a named artist. */
  matchMode: MetSearchResponse["matchMode"];
  /** Works by the named artist that were scanned, Open Access or not. */
  artistMatchesSeen: number;
  /** Matches dropped because they are not Open Access / public domain. */
  skippedNotOpenAccess: number;
};

const INITIAL: MetSearchState = {
  status: "idle",
  query: "",
  artworks: [],
  error: null,
  nextOffset: null,
  loadingMore: false,
  matchMode: "keyword",
  artistMatchesSeen: 0,
  skippedNotOpenAccess: 0,
};

async function requestPage(
  query: string,
  offset: number,
  signal: AbortSignal,
): Promise<MetSearchResponse> {
  const params = new URLSearchParams({ q: query, offset: String(offset) });
  const res = await fetch(`/api/met/search?${params.toString()}`, { signal });
  const data = (await res.json()) as Partial<MetSearchResponse> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not search The Met right now.");
  }
  return {
    query: data.query ?? query,
    offset: data.offset ?? offset,
    nextOffset: data.nextOffset ?? null,
    totalMatches: data.totalMatches ?? 0,
    matchMode: data.matchMode ?? "keyword",
    artistMatchesSeen: data.artistMatchesSeen ?? 0,
    skippedNotOpenAccess: data.skippedNotOpenAccess ?? 0,
    artworks: data.artworks ?? [],
  };
}

/**
 * The curated default set.
 *
 * Failure is silent by design. These works are an opening suggestion, not the
 * feature; if The Met is unreachable the picker still searches, and an error
 * banner about a list the visitor never asked for would be noise.
 *
 * Fetched on mount. Soft-refreshed when the picker opens only if the hand looks
 * thin — a full set is stable museum metadata, and re-hitting `/api/met/curated`
 * on every open stampedes The Met and was what left Monet Family off Hokusai's
 * left. The fingerprint query busts HTTP caches when the list itself changes.
 */
function useCuratedArtworks() {
  const [artworks, setArtworks] = useState<MetArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(async (soft: boolean) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    if (!soft) setLoading(true);
    try {
      const res = await fetch(
        `/api/met/curated?v=${encodeURIComponent(CURATED_MET_FINGERPRINT)}`,
        { signal: controller.signal, cache: "no-store" },
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { artworks?: MetArtwork[] };
      if (controller.signal.aborted) return;
      const next = data.artworks ?? [];
      setArtworks(next);
      preloadCuratedFirstOpenImages(next);
    } catch {
      if (!controller.signal.aborted && !soft) setArtworks([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    return () => inFlight.current?.abort();
  }, [load]);

  const refresh = useCallback(() => {
    // Only re-fetch when the strip is incomplete. A full hand matching the
    // curated id list is already what first-open should show.
    if (artworks.length >= CURATED_MET_OBJECT_IDS.length) return;
    void load(true);
  }, [artworks.length, load]);

  return { curated: artworks, curatedLoading: loading, refreshCurated: refresh };
}

export function useMetSearch() {
  const [state, setState] = useState<MetSearchState>(INITIAL);
  /**
   * The text in the field, which is not the same thing as `state.query`: that
   * one names the results currently on screen and only catches up when a
   * request settles.
   */
  const [query, setQueryText] = useState("");
  const inFlight = useRef<AbortController | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { curated, curatedLoading, refreshCurated } = useCuratedArtworks();

  const clearDebounce = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      inFlight.current?.abort();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const search = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setState({ ...INITIAL, status: "loading", query });

    try {
      const page = await requestPage(query, 0, controller.signal);
      if (controller.signal.aborted) return;
      setState({
        status: "success",
        query,
        artworks: page.artworks,
        error: null,
        nextOffset: page.nextOffset,
        loadingMore: false,
        matchMode: page.matchMode,
        artistMatchesSeen: page.artistMatchesSeen,
        skippedNotOpenAccess: page.skippedNotOpenAccess,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({
        ...INITIAL,
        status: "error",
        query,
        error: err instanceof Error ? err.message : "Search failed.",
      });
    }
  }, []);

  const reset = useCallback(() => {
    clearDebounce();
    inFlight.current?.abort();
    setState(INITIAL);
  }, [clearDebounce]);

  /**
   * Type into the field.
   *
   * Emptying it is a cancel, not a search for nothing: the pending timer and
   * any request already on the wire are dropped, and the strip falls back to
   * the curated set rather than sitting on results for a query that is no
   * longer on screen.
   */
  const setQuery = useCallback(
    (next: string) => {
      setQueryText(next);
      clearDebounce();
      if (!next.trim()) {
        inFlight.current?.abort();
        setState(INITIAL);
        return;
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        void search(next);
      }, SEARCH_DEBOUNCE_MS);
    },
    [clearDebounce, search],
  );

  /** Submitting the form or pressing Search skips the debounce. */
  const submit = useCallback(() => {
    clearDebounce();
    void search(query);
  }, [clearDebounce, query, search]);

  const clearQuery = useCallback(() => {
    setQueryText("");
    reset();
  }, [reset]);

  const loadMore = useCallback(async () => {
    const { query, nextOffset, loadingMore, status } = state;
    if (status !== "success" || nextOffset === null || loadingMore) return;

    const controller = new AbortController();
    inFlight.current?.abort();
    inFlight.current = controller;
    setState((prev) => ({ ...prev, loadingMore: true, error: null }));

    try {
      const page = await requestPage(query, nextOffset, controller.signal);
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        // Met search can surface the same object under different pages of ids.
        artworks: dedupe([...prev.artworks, ...page.artworks]),
        nextOffset: page.nextOffset,
        loadingMore: false,
        artistMatchesSeen: prev.artistMatchesSeen + page.artistMatchesSeen,
        skippedNotOpenAccess:
          prev.skippedNotOpenAccess + page.skippedNotOpenAccess,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        loadingMore: false,
        error: err instanceof Error ? err.message : "Could not load more.",
      }));
    }
  }, [state]);

  /*
   * An untouched field means the curated set is what the strip is for, so the
   * search state is ignored entirely rather than merged with it — no
   * backfilling, and no curated works padding out a thin set of results.
   */
  const mode: MetStripMode = state.status === "idle" ? "curated" : "results";
  const artworks = useMemo(
    () => (mode === "curated" ? curated : state.artworks),
    [mode, curated, state.artworks],
  );

  return {
    ...state,
    /** The field's text. `query` on the state is what the results answer. */
    queryText: query,
    setQuery,
    submit,
    clearQuery,
    mode,
    /** Curated set or results, whichever the strip should be showing. */
    artworks,
    curatedLoading,
    curatedCount: curated.length,
    /** Soft re-fetch so an open tab picks up a reordered curated hand. */
    refreshCurated,
    search,
    loadMore,
    reset,
  };
}

export type MetSearchController = ReturnType<typeof useMetSearch>;

function dedupe(artworks: MetArtwork[]): MetArtwork[] {
  const seen = new Set<number>();
  return artworks.filter((a) => {
    if (seen.has(a.objectID)) return false;
    seen.add(a.objectID);
    return true;
  });
}
