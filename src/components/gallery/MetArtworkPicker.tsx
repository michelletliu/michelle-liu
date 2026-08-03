"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Chevron";
import { CloseIcon } from "@/components/Close";
import {
  FieldInput,
  FieldLeadingIcon,
  FieldShell,
  SearchMagnifierIcon,
  fieldIconSlotClassName,
} from "@/components/FieldInput";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
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
  tileLayoutId,
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
const PANEL_OFFSETS = [-2, -1, 0, 1, 2] as const;
const PANEL_TILE: Record<
  (typeof PANEL_OFFSETS)[number],
  {
    height: number;
    maxWidth: number;
    opacity: number;
    radius: number;
    z: number;
  }
> = {
  [-2]: { height: 80, maxWidth: 72, opacity: 0.35, radius: 4, z: 0 },
  [-1]: { height: 100, maxWidth: 128, opacity: 1, radius: 5, z: 10 },
  0: { height: 160, maxWidth: 234, opacity: 1, radius: 2, z: 20 },
  1: { height: 100, maxWidth: 128, opacity: 1, radius: 5, z: 10 },
  2: { height: 60, maxWidth: 78, opacity: 0.35, radius: 3, z: 0 },
};
const PANEL_INNER_GAP = 28;
const PANEL_OUTER_GAP = 24;
const PANEL_WHEEL_STEP = 45;
const PANEL_WHEEL_COOLDOWN_MS = 260;

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
  panel?: boolean;
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
  panel = false,
}: MetArtworkPickerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [apiInfoOpen, setApiInfoOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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

  const displayedArtwork =
    panel && artworks.length > 0 ? artworks[activeIndex] ?? null : selected;
  const eligibility = displayedArtwork ? artworkEligibility(displayedArtwork) : null;
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

  useEffect(() => {
    if (artworks.length === 0) return;
    const selectedIndex =
      selected === null
        ? -1
        : artworks.findIndex((a) => a.objectID === selected.objectID);
    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }
    setActiveIndex((index) =>
      Math.min(index, Math.max(artworks.length - 1, 0)),
    );
  }, [artworks, selected]);

  const movePanelCarousel = (delta: number) => {
    if (artworks.length === 0) return;
    const next = (activeIndex + delta + artworks.length) % artworks.length;
    if (next === activeIndex) return;
    setActiveIndex(next);
  };

  return (
    <div
      className={
        panel
          ? "flex min-h-[400px] flex-col gap-[54px] rounded-[26px] border border-black/10 bg-white px-2.5 pt-2.5 pb-10 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
          : "flex flex-col gap-3 rounded-[10px] bg-black/5 px-4 py-2.5"
      }
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        {panel ? (
          // DS FieldShell — pill + focus-within zinc border (system Inputs matrix).
          <div className="relative min-w-0 flex-1">
            <FieldShell tone="muted" className="gap-2.5">
              <FieldLeadingIcon>
                <SearchMagnifierIcon size="15px" />
              </FieldLeadingIcon>
              <FieldInput
                type="search"
                value={queryText}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={stopGalleryKeys}
                placeholder="Search The Met API for inspiration…"
                disabled={disabled}
                aria-label="Search The Met collection"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                // WebKit paints a heavy native clear glyph on type=search;
                // suppress it so the trailing ⓘ stays the only right affordance.
                // `gallery-focus` opts the bare input out of the global
                // `*:focus-visible` outline so FieldShell's focus-within
                // zinc border is the only focus treatment (DS Inputs matrix).
                className="gallery-focus pr-1 [&::-webkit-search-cancel-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="About The Met API"
                aria-expanded={apiInfoOpen}
                onClick={() => setApiInfoOpen((open) => !open)}
                className={`${fieldIconSlotClassName} mr-1.5 text-zinc-400 transition-colors hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
              >
                <Info size="15px" />
              </button>
            </FieldShell>
            {apiInfoOpen && (
              <div
                role="tooltip"
                className="absolute right-0 top-[calc(100%+8px)] z-40 w-80 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm leading-snug text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                Searches The Met Collection API for public-domain Open Access
                artworks.
              </div>
            )}
          </div>
        ) : (
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
        )}
        {!panel && (
          <button
            type="submit"
            disabled={disabled || !queryText.trim() || status === "loading"}
            className={`h-[38px] shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
          >
            Search
          </button>
        )}
        {searchRowTrailing}
      </form>

      {/* One polite region covers pending / empty / failed search so a screen
          reader hears each state change without nested live regions. */}
      <div
        aria-live="polite"
        className={`flex flex-col empty:hidden ${
          panel ? "min-h-[208px] justify-center gap-5" : "gap-3"
        }`}
      >
        {showSkeletons &&
          (panel ? <PanelCarouselSkeleton /> : <ThumbnailSkeletons />)}

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

        {showStrip && panel && (
          <PanelArtworkCarousel
            artworks={artworks}
            selected={selected}
            disabled={disabled}
            activeIndex={activeIndex}
            onMove={movePanelCarousel}
            onPick={(artwork, index) => {
              setActiveIndex(index);
              onSelect(artwork);
            }}
          />
        )}

        {showStrip && !panel && (
          // Pulls back the scroller's shadow padding so the strip still
          // reaches the inset's edge and slides under the fade, rather than
          // stopping short of it with four pixels of gutter showing.
          <div className={`relative ${panel ? "" : STRIP_BLEED}`}>
            <div
              ref={stripRef}
              role="group"
              aria-label={
                mode === "curated"
                  ? "Suggested artworks from The Met"
                  : "Met artwork results"
              }
              className={`flex gap-2 overflow-x-auto overscroll-contain ${
                panel
                  ? "h-[132px] items-center px-8 py-2"
                  : `${STRIP_PADDING} ${STRIP_SHADOW_CLIP}`
              }`}
            >
              {artworks.map((artwork) => (
                <ArtworkThumbnail
                  key={artwork.objectID}
                  artwork={artwork}
                  selected={selected?.objectID === artwork.objectID}
                  disabled={disabled}
                  onToggle={() => onSelect(artwork)}
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
            <StripFade edge="left" hidden={atStart} panel={panel} />
            <StripFade edge="right" hidden={atEnd} panel={panel} />
          </div>
        )}
      </div>

      {displayedArtwork && (
        // Named for a screen reader, which gets only the title otherwise and
        // no hint that this row is the chosen inspiration rather than a
        // caption. Sighted readers have the strip and the ✕ above to say so.
        <div
          role="group"
          aria-label={`Selected inspiration: ${displayedArtwork.title}`}
          className={
            panel
              ? // Fixed slot height keeps the panel from jumping; items-start +
                // natural title height keep title→artist gap identical for 1-
                // and 2-line titles (min-h on the title was centering short
                // titles in a 2-line box and opening a fake gap).
                "flex h-[74px] items-start gap-3 px-6 text-center"
              : "flex items-center gap-5 pl-1 pr-3"
          }
        >
          <div
            className={`min-w-0 flex-1 ${panel ? "flex flex-col gap-0.5" : ""}`}
          >
            <p
              className={`text-base font-medium leading-normal text-zinc-900 ${
                panel ? "line-clamp-2" : "truncate"
              }`}
            >
              {displayedArtwork.title}
            </p>
            {/* Same size as the title now, so the difference has to be carried
                by weight and colour alone — medium zinc-900 over normal
                zinc-400 — rather than by shrinking the secondary line. */}
            <p className="truncate text-base leading-normal text-zinc-400">
              {[displayedArtwork.artistDisplayName, displayedArtwork.objectDate]
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
          {!panel && !selectedIsVisible && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              disabled={disabled}
              aria-label="Remove inspiration"
              className={`shrink-0 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
            >
              <CloseIcon size={iconSize("inline")} />
            </button>
          )}
          {!panel && (
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
          )}
        </div>
      )}

      {selected && !panel && (
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
  panel = false,
}: {
  edge: "left" | "right";
  hidden: boolean;
  panel?: boolean;
}) {
  return (
    <div
      aria-hidden
      // Never intercepts clicks: tiles stay pressable through the fade.
      className={`pointer-events-none absolute inset-y-0 transition-opacity duration-150 ${
        panel ? "w-16" : "w-10"
      } ${
        edge === "left" ? "left-0" : "right-0"
      } ${hidden ? "opacity-0" : "opacity-100"}`}
      style={{
        backgroundImage: `linear-gradient(to ${
          edge === "left" ? "right" : "left"
        }, ${panel ? "white" : STRIP_EDGE_FADE}, transparent)`,
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

function PanelCarouselSkeleton() {
  const activeSize = {
    width: PANEL_TILE[0].maxWidth,
    height: PANEL_TILE[0].height,
  };
  const sizes: Record<
    (typeof PANEL_OFFSETS)[number],
    { width: number; height: number }
  > = {
    [-2]: { width: 52, height: PANEL_TILE[-2].height },
    [-1]: { width: 128, height: PANEL_TILE[-1].height },
    0: activeSize,
    1: { width: 88, height: PANEL_TILE[1].height },
    2: { width: 66, height: PANEL_TILE[2].height },
  };

  return (
    <div className="relative flex h-[220px] items-center justify-center overflow-hidden">
      <span className="sr-only">Searching The Met…</span>
      {PANEL_OFFSETS.map((distance) => {
        const slot = PANEL_TILE[distance];
        const size = sizes[distance];
        const neighborSize =
          Math.abs(distance) === 2
            ? sizes[(distance > 0 ? 1 : -1) as -1 | 1]
            : undefined;
        return (
          <div
            key={distance}
            aria-hidden
            className="absolute left-1/2 top-1/2 animate-pulse bg-zinc-200/70 shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
            style={{
              width: size.width,
              height: size.height,
              borderRadius: slot.radius + 2,
              opacity: slot.opacity,
              zIndex: slot.z,
              transform: `translate3d(calc(-50% + ${panelArtworkX(
                distance,
                size,
                activeSize,
                neighborSize,
              )}px), -50%, 0)`,
            }}
          />
        );
      })}
    </div>
  );
}

function panelArtworkSize(
  artwork: MetArtwork,
  dimensions: Record<number, { width: number; height: number }>,
  slot: (typeof PANEL_TILE)[(typeof PANEL_OFFSETS)[number]],
) {
  const natural = dimensions[artwork.objectID];
  const fallbackAspect = slot.maxWidth / slot.height;
  const aspect =
    natural && natural.height > 0 ? natural.width / natural.height : fallbackAspect;
  if (aspect >= 1) {
    const width = Math.min(slot.maxWidth, slot.height * aspect);
    return { width, height: width / aspect };
  }
  return { width: slot.height * aspect, height: slot.height };
}

function panelIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function panelArtworkX(
  distance: (typeof PANEL_OFFSETS)[number],
  size: { width: number; height: number },
  activeSize: { width: number; height: number },
  neighborSize?: { width: number; height: number },
) {
  if (distance === 0) return 0;
  const direction = distance > 0 ? 1 : -1;
  const innerX = activeSize.width / 2 + PANEL_INNER_GAP + size.width / 2;
  if (Math.abs(distance) === 1) return direction * innerX;
  const firstNeighborWidth = neighborSize?.width ?? PANEL_TILE[direction].maxWidth;
  return (
    direction *
    (activeSize.width / 2 +
      PANEL_INNER_GAP +
      firstNeighborWidth +
      PANEL_OUTER_GAP +
      size.width / 2)
  );
}

/**
 * Prefer the slot closest to center when a short result set would place the
 * same artwork in two offsets — otherwise React keys collide and Motion
 * remounts instead of morphing.
 */
function uniquePanelSlots<T extends { artwork: MetArtwork; distance: number }>(
  items: T[],
): T[] {
  const best = new Map<number, T>();
  for (const item of items) {
    const prev = best.get(item.artwork.objectID);
    if (!prev || Math.abs(item.distance) < Math.abs(prev.distance)) {
      best.set(item.artwork.objectID, item);
    }
  }
  return [...best.values()].sort((a, b) => a.distance - b.distance);
}

const PANEL_MORPH_EASE = [0.4, 0, 0.2, 1] as const;

function PanelArtworkCarousel({
  artworks,
  selected,
  disabled,
  activeIndex,
  onMove,
  onPick,
}: {
  artworks: MetArtwork[];
  selected: MetArtwork | null;
  disabled: boolean;
  activeIndex: number;
  onMove: (delta: number) => void;
  onPick: (artwork: MetArtwork, index: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const wheelRemainderRef = useRef(0);
  const wheelLockedUntilRef = useRef(0);
  const [dimensions, setDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});
  const visibleOffsets: readonly (typeof PANEL_OFFSETS)[number][] =
    artworks.length === 1 ? ([0] as const) : PANEL_OFFSETS;
  const visible = uniquePanelSlots(
    visibleOffsets.map((distance) => {
      const index = panelIndex(activeIndex + distance, artworks.length);
      return {
        artwork: artworks[index]!,
        index,
        distance,
      };
    }),
  );
  const sizedVisible = visible.map((item) => {
    const slot = PANEL_TILE[item.distance as (typeof PANEL_OFFSETS)[number]];
    return {
      ...item,
      slot,
      size: panelArtworkSize(item.artwork, dimensions, slot),
    };
  });
  const activeSize =
    sizedVisible.find((item) => item.distance === 0)?.size ??
    panelArtworkSize(artworks[activeIndex] ?? artworks[0]!, dimensions, PANEL_TILE[0]);
  const morphTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: PANEL_MORPH_EASE };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (artworks.length < 2) return;
    e.preventDefault();
    e.stopPropagation();
    const now = performance.now();
    if (now < wheelLockedUntilRef.current) return;
    wheelRemainderRef.current +=
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(wheelRemainderRef.current) < PANEL_WHEEL_STEP) return;
    const direction = wheelRemainderRef.current > 0 ? 1 : -1;
    wheelRemainderRef.current = 0;
    wheelLockedUntilRef.current = now + PANEL_WHEEL_COOLDOWN_MS;
    onMove(direction);
  };

  return (
    <div
      className="relative flex h-[220px] items-center justify-center overflow-x-hidden overflow-y-visible"
      onWheel={onWheel}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-[160px] -translate-y-1/2"
        style={{
          backgroundImage:
            "linear-gradient(90deg, white 0%, rgba(255,255,255,0.94) 8%, rgba(255,255,255,0) 23%, rgba(255,255,255,0) 77%, rgba(255,255,255,0.94) 92%, white 100%)",
        }}
      />
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={disabled || artworks.length < 2}
        aria-label="Previous inspiration"
        className={ghostIconButtonClass(
          "sm",
          `absolute left-1.5 top-1/2 z-40 -translate-y-1/2 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-700 active:bg-zinc-200/80 disabled:opacity-30 ${GALLERY_FOCUS_RING}`,
        )}
      >
        <ChevronLeftIcon size="15px" />
      </button>
      <div
        role="group"
        aria-label="Met artwork inspiration carousel"
        className="relative z-20 h-full w-full px-10"
      >
        <AnimatePresence initial={false}>
          {sizedVisible.map(({ distance, index, artwork, slot, size }) => {
            const src = openAccessImageUrl(artwork);
            if (!src) return null;
            const neighborSize =
              Math.abs(distance) === 2
                ? sizedVisible.find(
                    (item) => item.distance === (distance > 0 ? 1 : -1),
                  )?.size
                : undefined;
            // Center with animated x (not instant marginLeft) so width morphs
            // don't yank the tile sideways while Motion interpolates size.
            const x =
              panelArtworkX(distance, size, activeSize, neighborSize) -
              size.width / 2;
            return (
              <motion.button
                key={artwork.objectID}
                type="button"
                aria-pressed={selected?.objectID === artwork.objectID}
                disabled={disabled}
                onClick={() => onPick(artwork, index)}
                title={artworkLabel(artwork)}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        x: x + (distance === 0 ? 0 : distance > 0 ? 36 : -36),
                        width: size.width,
                        height: size.height,
                        borderRadius: slot.radius,
                      }
                }
                animate={{
                  opacity: slot.opacity,
                  x,
                  y: "-50%",
                  width: size.width,
                  height: size.height,
                  borderRadius: slot.radius,
                }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        x: x + (distance > 0 ? 36 : -36),
                      }
                }
                transition={morphTransition}
                style={{
                  zIndex: slot.z,
                  left: "50%",
                  top: "50%",
                }}
                className={`absolute overflow-hidden bg-white shadow-lg hover:opacity-90 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
              >
                <img
                  src={src}
                  alt={artworkLabel(artwork)}
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setDimensions((current) =>
                      current[artwork.objectID]
                        ? current
                        : {
                            ...current,
                            [artwork.objectID]: {
                              width: img.naturalWidth,
                              height: img.naturalHeight,
                            },
                          },
                    );
                  }}
                  className="h-full w-full object-fill"
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={disabled || artworks.length < 2}
        aria-label="Next inspiration"
        className={ghostIconButtonClass(
          "sm",
          `absolute right-1.5 top-1/2 z-40 -translate-y-1/2 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-700 active:bg-zinc-200/80 disabled:opacity-30 ${GALLERY_FOCUS_RING}`,
        )}
      >
        <ChevronRightIcon size="15px" />
      </button>
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
    <motion.button
      layoutId={tileLayoutId(artwork.objectID)}
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
          <CloseIcon size={iconSize("meta")} strokeWidth={3} />
        </span>
      )}
    </motion.button>
  );
}
