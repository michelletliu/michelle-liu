"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CloseIcon } from "@/components/Close";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { stopGalleryKeys, useScrollEdges } from "./galleryInputGuards";
import {
  artworkEligibility,
  openAccessImageUrl,
  type MetArtwork,
} from "./metArtworks";
import { useMetSearch } from "./useMetSearch";

type MetArtworkPickerProps = {
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
  selected,
  onSelect,
  disabled = false,
  searchRowTrailing,
}: MetArtworkPickerProps) {
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    status,
    artworks,
    error,
    nextOffset,
    loadingMore,
    query: activeQuery,
    matchMode,
    search,
    loadMore,
    reset,
  } = useMetSearch();

  const {
    ref: stripRef,
    atStart,
    atEnd,
  } = useScrollEdges<HTMLDivElement>(artworks.length);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    void search(query);
  };

  const onClearQuery = () => {
    setQuery("");
    reset();
    inputRef.current?.focus();
  };

  const eligibility = selected ? artworkEligibility(selected) : null;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={stopGalleryKeys}
            placeholder="Search The Met for inspiration…"
            disabled={disabled}
            aria-label="Search The Met collection"
            // `type="search"` paints a heavy accent-coloured native clear glyph
            // in WebKit. Suppress it and use the design system's Close mark, so
            // the affordance matches every other dismiss control on the site.
            className={`w-full rounded-xl border border-zinc-200 bg-white py-2 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 [&::-webkit-search-cancel-button]:appearance-none ${
              query ? "pr-9" : "pr-3"
            } ${GALLERY_FOCUS_RING}`}
          />
          {query && (
            <button
              type="button"
              onClick={onClearQuery}
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
          disabled={disabled || !query.trim() || status === "loading"}
          className={`shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
        >
          {status === "loading" ? "Searching…" : "Search"}
        </button>
        {searchRowTrailing}
      </form>

      {/* One polite region covers pending / empty / failed search so a screen
          reader hears each state change without nested live regions. */}
      <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {status === "loading" && <ThumbnailSkeletons />}

        {status === "error" && (
          <p className="px-1 text-xs text-red-600">
            {error}{" "}
            <button
              type="button"
              onClick={() => void search(activeQuery)}
              className={`rounded-sm underline underline-offset-2 hover:text-red-700 ${GALLERY_FOCUS_RING}`}
            >
              Try again
            </button>
          </p>
        )}

        {status === "success" && artworks.length === 0 && (
          <p className="px-1 text-xs leading-snug text-zinc-500">
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

        {status === "success" && artworks.length > 0 && (
          <div className="relative rounded-xl">
            <div
              ref={stripRef}
              role="group"
              aria-label="Met artwork results"
              // Roughly two and a half rows: enough to browse a page at a
              // glance, and the clipped third row is itself a scroll cue.
              // The padding keeps focus rings from being shorn off by the
              // overflow, since `overflow-y-auto` clips the x axis too.
              className="max-h-[11.5rem] overflow-y-auto overscroll-contain p-1.5"
            >
              <div className="flex flex-wrap gap-2">
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
                    className={`h-16 w-16 shrink-0 rounded-lg border border-dashed border-zinc-300 text-[11px] leading-tight text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            </div>
            <ScrollFade edge="top" hidden={atStart} />
            <ScrollFade edge="bottom" hidden={atEnd} />
          </div>
        )}
      </div>

      {selected && (
        <SelectedArtworkCard
          artwork={selected}
          detailsId={detailsId}
          detailsOpen={detailsOpen}
          onToggleDetails={() => setDetailsOpen((open) => !open)}
          onClear={() => onSelect(null)}
          blockedMessage={
            eligibility && !eligibility.eligible ? eligibility.message : null
          }
          disabled={disabled}
        />
      )}
    </div>
  );
}

/**
 * Content dissolving into the bar's surface, marking an edge you can scroll
 * past. `from-white` is the bar's own `bg-white/90`, so it reads as the panel
 * swallowing the tiles rather than as a grey band laid over them.
 */
function ScrollFade({
  edge,
  hidden,
}: {
  edge: "top" | "bottom";
  hidden: boolean;
}) {
  return (
    <div
      aria-hidden
      // Never intercepts clicks: tiles stay pressable through the fade.
      className={`pointer-events-none absolute inset-x-0 h-7 transition-opacity duration-150 ${
        edge === "top"
          ? "top-0 rounded-t-xl bg-gradient-to-b"
          : "bottom-0 rounded-b-xl bg-gradient-to-t"
      } from-white to-transparent ${hidden ? "opacity-0" : "opacity-100"}`}
    />
  );
}

/**
 * Wrapper and tile boxes match the loaded grid's, so the panel does not jump
 * when results replace the placeholders.
 */
function ThumbnailSkeletons() {
  return (
    <div className="flex flex-wrap gap-2 overflow-hidden p-1.5">
      <span className="sr-only">Searching The Met…</span>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="h-16 w-16 shrink-0 animate-pulse rounded-lg border border-black/10 bg-zinc-200/70"
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
      // Selection is a border and focus is a ring, so the two never fight over
      // the same box-shadow when a selected thumbnail is also focused.
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 transition-[border-color] disabled:opacity-40 ${GALLERY_FOCUS_RING} ${
        selected
          ? "border-2 border-zinc-900"
          : "border border-black/10 hover:border-zinc-400"
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
        <span
          aria-hidden
          className="absolute bottom-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-zinc-900 text-[9px] font-bold text-white"
        >
          ✓
        </span>
      )}
    </button>
  );
}

function SelectedArtworkCard({
  artwork,
  detailsId,
  detailsOpen,
  onToggleDetails,
  onClear,
  blockedMessage,
  disabled,
}: {
  artwork: MetArtwork;
  detailsId: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onClear: () => void;
  blockedMessage: string | null;
  disabled: boolean;
}) {
  const src = openAccessImageUrl(artwork);

  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-2">
      <div className="flex items-center gap-2">
        {src && (
          <img
            src={src}
            alt={artworkLabel(artwork)}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-900">
            Inspired by {artwork.title}
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            {[artwork.artistDisplayName, artwork.objectDate]
              .filter(Boolean)
              .join(" · ") || "The Met Open Access"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          className={`shrink-0 rounded-lg px-2 py-1 text-[11px] text-zinc-600 transition-colors hover:bg-zinc-100 ${GALLERY_FOCUS_RING}`}
        >
          {detailsOpen ? "Hide details" : "Details"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className={`shrink-0 rounded-lg px-2 py-1 text-[11px] text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
        >
          Clear
        </button>
      </div>

      {blockedMessage && (
        <p
          role="alert"
          className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900"
        >
          Generation is disabled for this artwork. {blockedMessage}
        </p>
      )}

      {detailsOpen && (
        <dl
          id={detailsId}
          className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] leading-snug text-zinc-600"
        >
          <DetailRow label="Title" value={artwork.title} />
          <DetailRow label="Artist" value={artwork.artistDisplayName} />
          <DetailRow label="Date" value={artwork.objectDate} />
          <DetailRow label="Medium" value={artwork.medium} />
          <DetailRow label="Department" value={artwork.department} />
          <DetailRow label="Rights" value={artwork.rightsAndReproduction} />
          {artwork.objectURL && (
            <>
              <dt className="text-zinc-400">Source</dt>
              <dd className="min-w-0">
                <a
                  href={artwork.objectURL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="break-all underline underline-offset-2 hover:text-zinc-900"
                >
                  View on metmuseum.org
                </a>
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="min-w-0 text-zinc-600">{value}</dd>
    </>
  );
}
