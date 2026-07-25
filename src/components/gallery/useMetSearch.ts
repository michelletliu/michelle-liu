"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MetArtwork, MetSearchResponse } from "./metArtworks";

export type MetSearchStatus = "idle" | "loading" | "success" | "error";

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

export function useMetSearch() {
  const [state, setState] = useState<MetSearchState>(INITIAL);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => () => inFlight.current?.abort(), []);

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

  const reset = useCallback(() => {
    inFlight.current?.abort();
    setState(INITIAL);
  }, []);

  return { ...state, search, loadMore, reset };
}

function dedupe(artworks: MetArtwork[]): MetArtwork[] {
  const seen = new Set<number>();
  return artworks.filter((a) => {
    if (seen.has(a.objectID)) return false;
    seen.add(a.objectID);
    return true;
  });
}
