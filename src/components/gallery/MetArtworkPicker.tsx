"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { CloseIcon } from "@/components/Close";
import { Info } from "@/components/Info";
import { iconSize } from "@/components/iconSizes";
import MetArtworkDetails from "./MetArtworkDetails";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { stopGalleryKeys, useScrollEdges } from "./galleryInputGuards";
import {
  TILE_HOVER_RING,
  TILE_INSET_RING,
  TILE_SELECTED_RING,
  TILE_SHAPE,
} from "./galleryTile";
import {
  artworkEligibility,
  openAccessImageUrl,
  type MetArtwork,
} from "./metArtworks";
import type { MetSearchController } from "./useMetSearch";

/**
 * The colour the tile strip dissolves into at a scrollable edge.
 *
 * It has to be the inset's own painted surface, and that surface is a
 * composite — `bg-black/5` over the bar's `bg-white/90` over the room — so
 * there is no token to point at. This is the resulting value, and the one the
 * design specifies for the same fade.
 */
const STRIP_EDGE_FADE = "#ededed";

/** How many placeholder tiles stand in for a page of results. */
const SKELETON_TILES = 6;

/** Compact inset shared by loaded tiles and their loading placeholders. */
const STRIP_PADDING = "px-4 py-2";
/**
 * Extends the scroller's vertical clip 16px below its 116px layout footprint.
 *
 * Horizontal scrolling computes `overflow-y` to `auto`, so `py-2` alone would
 * clip `shadow-lg`. A 132px clip leaves 24px below the 100px tile; the negative
 * margin keeps the visible strip and its skeleton at the same compact height.
 */
const STRIP_SHADOW_CLIP = "h-[132px] -mb-4";
const STRIP_BLEED = "-mx-4";

type MetArtworkPickerProps = {
  search: MetSearchController;
  selected: MetArtwork | null;
  onSelect: (artwork: MetArtwork | null) => void;
  /** Locks the picker while a generation is in flight. */
  disabled?: boolean;
  /**
   * Extra control rendered as the last child of the search row, so the bar can
   * sit its collapse toggle beside the Search button instead of in a row of
   * its own. Anything passed here must set `type="button"`: this row is a form.
   */
  searchRowTrailing?: ReactNode;
};

/** Accessible name for a thumbnail: the button takes its name from this alt. */
function artworkLabel(artwork: MetArtwork): string {
  const parts = [artwork.title];
  if (artwork.artistDisplayName) parts.push(`by ${artwork.artistDisplayName}`);
  if (artwork.objectDate) parts.push(`(${artwork.objectDate})`);
  return parts.join(" ");
}

export default function MetArtworkPicker({
  search,
  selected,
  onSelect,
  disabled = false,
  searchRowTrailing,
}: MetArtworkPickerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const {
    status,
    artworks,
    error,
    nextOffset,
    loadingMore,
    query: activeQuery,
    queryText,
    setQuery,
    submit,
    clearQuery,
    matchMode,
    mode,
    curatedLoading,
    loadMore,
  } = search;

  const {
    ref: stripRef,
    atStart,
    atEnd,
  } = useScrollEdges<HTMLDivElement>(`${mode}:${artworks.length}`, "x");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const eligibility = selected ? artworkEligibility(selected) : null;
  const showSkeletons =
    status === "loading" || (mode === "curated" && curatedLoading);
  const showStrip = !showSkeletons && artworks.length > 0;
  /*
   * The strip is the only place a selection can be lifted, and a search can
   * replace it with works that do not include what is already chosen. Without
   * this the ⓘ would be the sole remaining trace of the pick.
   */
  const selectedIsVisible =
    selected !== null && artworks.some((a) => a.objectID === selected.objectID);

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-black/5 px-4 py-2.5">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={stopGalleryKeys}
            placeholder="Search The Met for inspiration…"
            disabled={disabled}
            aria-label="Search The Met collection"
            // `type="search"` paints a heavy accent-coloured native clear glyph
            // in WebKit. Suppress it and use the design system's Close mark, so
            // the affordance matches every other dismiss control on the site.
            className={`h-[38px] w-full rounded-xl border border-zinc-200 bg-white pl-3 text-base text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 [&::-webkit-search-cancel-button]:appearance-none ${
              queryText ? "pr-9" : "pr-3"
            } ${GALLERY_FOCUS_RING}`}
          />
          {queryText && (
            <button
              type="button"
              onClick={clearQuery}
              disabled={disabled}
              aria-label="Clear search"
              data-gallery-no-drag
              className={`absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
            >
              <CloseIcon size="14px" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !queryText.trim() || status === "loading"}
          className={`h-[38px] shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
        >
          Search
        </button>
        {searchRowTrailing}
      </form>

      {/* One polite region covers pending / empty / failed search so a screen
          reader hears each state change without nested live regions. */}
      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {showSkeletons && <ThumbnailSkeletons />}

        {status === "error" && (
          <p className="px-1 text-base text-red-600">
            {error}{" "}
            <button
              type="button"
              onClick={submit}
              className={`rounded-sm underline underline-offset-2 hover:text-red-700 ${GALLERY_FOCUS_RING}`}
            >
              Try again
            </button>
          </p>
        )}

        {status === "success" && artworks.length === 0 && (
          <p className="px-1 text-base leading-snug text-zinc-500">
            {matchMode === "artist" ? (
              // Monet is the case here: The Met holds his work but has released
              // none of it under Open Access. Saying so beats an empty grid,
              // which reads as a broken search.
              <>
                The Met holds work matching “{activeQuery}”, but none of it is in
                the Open Access public domain, so it can’t be used here. Try
                another artist.
              </>
            ) : (
              <>
                No public-domain artworks with images matched “{activeQuery}”.
                Try a different search.
              </>
            )}
          </p>
        )}

        {showStrip && (
          // Pulls back the scroller's shadow padding so the strip still
          // reaches the inset's edge and slides under the fade, rather than
          // stopping short of it with four pixels of gutter showing.
          <div className={`relative ${STRIP_BLEED}`}>
            <div
              ref={stripRef}
              role="group"
              aria-label={
                mode === "curated"
                  ? "Suggested artworks from The Met"
                  : "Met artwork results"
              }
              className={`flex gap-2 overflow-x-auto overscroll-contain ${STRIP_PADDING} ${STRIP_SHADOW_CLIP}`}
            >
              {artworks.map((artwork) => (
                <ArtworkThumbnail
                  key={artwork.objectID}
                  artwork={artwork}
                  selected={selected?.objectID === artwork.objectID}
                  disabled={disabled}
                  onToggle={() =>
                    onSelect(
                      selected?.objectID === artwork.objectID ? null : artwork,
                    )
                  }
                />
              ))}
              {nextOffset !== null && (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={disabled || loadingMore}
                  className={`shrink-0 border border-dashed border-zinc-300 text-base leading-tight text-zinc-500 transition-colors hover:bg-white/60 disabled:opacity-40 ${TILE_SHAPE} ${GALLERY_FOCUS_RING}`}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
            <StripFade edge="left" hidden={atStart} />
            <StripFade edge="right" hidden={atEnd} />
          </div>
        )}
      </div>

      {selected && (
        // Named for a screen reader, which gets only the title otherwise and
        // no hint that this row is the chosen inspiration rather than a
        // caption. Sighted readers have the strip and the ✕ above to say so.
        <div
          role="group"
          aria-label={`Selected inspiration: ${selected.title}`}
          className="flex items-center gap-5 pl-1 pr-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium leading-6 text-zinc-900">
              {selected.title}
            </p>
            {/* Same size as the title now, so the difference has to be carried
                by weight and colour alone — medium zinc-900 over normal
                zinc-400 — rather than by shrinking the secondary line. */}
            <p className="truncate text-base leading-6 text-zinc-400">
              {[selected.artistDisplayName, selected.objectDate]
                .filter(Boolean)
                .join(" · ") || "The Met Open Access"}
            </p>
            {eligibility && !eligibility.eligible && (
              <p
                role="alert"
                className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-base leading-snug text-amber-900"
              >
                Generation is disabled for this artwork. {eligibility.message}
              </p>
            )}
          </div>
          {!selectedIsVisible && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              disabled={disabled}
              aria-label="Remove inspiration"
              className={`shrink-0 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
            >
              <X size={14} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={detailsOpen}
            aria-label="Artwork details"
            className={`shrink-0 rounded-full text-zinc-400 transition-colors hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
          >
            <Info size={iconSize("inline")} />
          </button>
        </div>
      )}

      {selected && (
        <MetArtworkDetails
          artwork={selected}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Content dissolving into the inset's surface, marking an edge you can scroll
 * past. Painted only where the strip actually overflows, so it reads as an
 * affordance rather than a rendering artefact.
 */
function StripFade({
  edge,
  hidden,
}: {
  edge: "left" | "right";
  hidden: boolean;
}) {
  return (
    <div
      aria-hidden
      // Never intercepts clicks: tiles stay pressable through the fade.
      className={`pointer-events-none absolute inset-y-0 w-10 transition-opacity duration-150 ${
        edge === "left" ? "left-0" : "right-0"
      } ${hidden ? "opacity-0" : "opacity-100"}`}
      style={{
        backgroundImage: `linear-gradient(to ${
          edge === "left" ? "right" : "left"
        }, ${STRIP_EDGE_FADE}, transparent)`,
      }}
    />
  );
}

/**
 * Wrapper and tile boxes match the loaded strip's, so the panel does not jump
 * when results replace the placeholders.
 */
function ThumbnailSkeletons() {
  return (
    <div className={`flex gap-2 overflow-hidden ${STRIP_PADDING}`}>
      <span className="sr-only">Searching The Met…</span>
      {Array.from({ length: SKELETON_TILES }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className={`shrink-0 animate-pulse bg-zinc-200/70 ${TILE_SHAPE} ${TILE_INSET_RING}`}
        />
      ))}
    </div>
  );
}

function ArtworkThumbnail({
  artwork,
  selected,
  disabled,
  onToggle,
}: {
  artwork: MetArtwork;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const src = openAccessImageUrl(artwork);
  if (!src) return null;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      title={artworkLabel(artwork)}
      // Selection and the white edge are both inset rings, so they occupy the
      // same box-shadow slot and swap rather than stack — and neither changes
      // the tile's footprint, so selecting one mid-scroll shifts nothing. The
      // focus ring is a separate outset ring, so a selected tile that is also
      // focused reads as both without the two fighting.
      className={`relative shrink-0 overflow-hidden bg-white shadow-lg transition-shadow disabled:opacity-40 ${TILE_SHAPE} ${GALLERY_FOCUS_RING} ${
        selected ? TILE_SELECTED_RING : `${TILE_INSET_RING} ${TILE_HOVER_RING}`
      }`}
    >
      {/* The alt text is the button's accessible name. */}
      <img
        src={src}
        alt={artworkLabel(artwork)}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {selected && (
        // Inside the button rather than beside it, so it cannot become a
        // nested control: pressing the mark is pressing the tile, which is
        // already what lifts the selection.
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-zinc-900 text-white"
        >
          <X size={10} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
