"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons/Chevron";
import { CloseIcon } from "@/components/icons/Close";
import {
  FieldInput,
  FieldLeadingIcon,
  FieldShell,
  SearchMagnifierIcon,
  fieldIconSlotClassName,
} from "@/components/shared/FieldInput";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import Tooltip from "@/components/shared/Tooltip";
import { LoadingText } from "@/components/shared/LoadingSpinner";
import { Info } from "@/components/icons/Info";
import { iconSize, ICON_STROKE_WIDTH } from "@/components/shared/iconSizes";
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
import { curatedFirstOpenObjectIds, curatedImageSize } from "./metCurated";
import { metImageTrimStyle } from "./metImageMat";
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

const API_INFO_LABEL =
  "Search The Met Collection API for public-domain Open Access artworks";
/**
 * The pale card this tip has always worn, over `.tooltip`'s dark pill. Every
 * declaration `.tooltip` also sets needs `!` — that rule is unlayered, so it
 * outranks plain utilities (same trick as the composer's Met tip).
 */
const API_INFO_TIP_SURFACE =
  "max-w-[200px] border !border-black/10 !whitespace-normal !rounded-xl !bg-white !py-2 !pl-3 !pr-2.5 !font-normal !text-zinc-500 leading-snug shadow-[0_8px_24px_rgba(0,0,0,0.12)]";

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
/**
 * Loaded carousel and its loading skeleton share this footprint.
 * Fixed (not min) so intrinsic/undecoded images cannot stretch the panel.
 */
const PANEL_CAROUSEL_HEIGHT = "h-[220px] shrink-0 overflow-hidden";
/**
 * Title/artist caption under the panel carousel — same slot while loading.
 * 2× text-base/leading-normal title + gap-0.5 + 1× artist ≈ 74px.
 * min/max defeat flex `min-height: auto` growth from long titles.
 */
const PANEL_CAPTION_HEIGHT =
  "h-[74px] min-h-[74px] max-h-[74px] shrink-0 overflow-hidden";
/** Carousel + gap-5 + caption — fixed so skeleton ↔ loaded never jumps. */
const PANEL_BODY_HEIGHT = "h-[314px] shrink-0";
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
/** Horizontal finger / pointer travel before a pan steps the carousel. */
const PANEL_SWIPE_STEP = 48;
const PANEL_SWIPE_DEADZONE = 12;

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
  const [searchFocused, setSearchFocused] = useState(false);
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
    if (artworks.length < 2) return;
    setActiveIndex(
      (index) => (index + delta + artworks.length) % artworks.length,
    );
  };

  /*
   * Popup carousel: ←/→ step artworks. Capture on window so the room's hang-
   * stepping arrows never see the key. Skip while the search field (or any
   * text control) owns focus — caret movement stays with the input.
   */
  useEffect(() => {
    if (!panel || disabled || artworks.length < 2) return;
    const length = artworks.length;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setActiveIndex((index) => (index + delta + length) % length);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [panel, disabled, artworks.length]);

  return (
    <div
      className={
        panel
          ? // Fixed body (314) + search row + gap-54 + padding — no min-h that
            // left empty air under skeletons and made loading read taller.
            "flex flex-col gap-[54px] rounded-[26px] border border-black/10 bg-white px-2.5 pt-2.5 pb-10 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
          : "flex flex-col gap-3 rounded-[10px] bg-black/5 px-4 py-2.5"
      }
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        {panel ? (
          // DS FieldShell — pill + focus-within zinc border (system Inputs matrix).
          // Trailing control: clear (X) only while focused with text; info otherwise.
          <div className="relative min-w-0 flex-1">
            <FieldShell tone="muted" className="gap-2.5 rounded-full">
              <FieldLeadingIcon>
                <SearchMagnifierIcon size="15px" />
              </FieldLeadingIcon>
              <FieldInput
                type="search"
                value={queryText}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={stopGalleryKeys}
                placeholder="Search The Met API for inspiration…"
                disabled={disabled}
                aria-label="Search The Met collection"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                // WebKit paints a heavy native clear glyph on type=search;
                // suppress it so the trailing control stays the only right affordance.
                // `gallery-focus` opts the bare input out of the global
                // `*:focus-visible` outline so FieldShell's focus-within
                // zinc border is the only focus treatment (DS Inputs matrix).
                className="gallery-focus pr-1 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {searchFocused && queryText.trim().length > 0 ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  disabled={disabled}
                  // Prevent blur-before-click so the clear action fires while
                  // the X is still mounted (focus would otherwise flip to info).
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearQuery}
                  className={`${fieldIconSlotClassName} mr-1.5 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                >
                  <CloseIcon size="15px" />
                </button>
              ) : (
                // Shared Tooltip owns show/fade — a one-off panel anchored to
                // this wrapper sat a full pill-height too low and stayed up
                // after a click. `top` clears the pill and the tiles below it.
                <Tooltip
                  label={API_INFO_LABEL}
                  position="top"
                  offset={8}
                  // Match the previous instant reveal rather than the 400ms
                  // hover default: this ⓘ is the only route to the copy.
                  delay={0}
                  showOnClick
                  showOnFocus
                  // Reaches past the panel's own top-right corner, and the
                  // picker is a transformed overlay — portal so the tip
                  // collides with the viewport instead of its card.
                  portal
                  contentClassName={API_INFO_TIP_SURFACE}
                >
                  <button
                    type="button"
                    aria-label="About The Met API"
                    // The button lives inside FieldShell, whose `:focus-within`
                    // paints the pill's focus border — taking focus on click
                    // would make the info tap read as a search focus. Keyboard
                    // tabbing still focuses it (and still shows the border).
                    onMouseDown={(e) => e.preventDefault()}
                    className={`${fieldIconSlotClassName} mr-1.5 text-zinc-400 transition-colors hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
                  >
                    <Info size="15px" />
                  </button>
                </Tooltip>
              )}
            </FieldShell>
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
          // Fixed 220 + gap-5 + 74 — skeleton and loaded share one box; no
          // justify-center that floated a short hand in a taller min-height.
          panel ? `${PANEL_BODY_HEIGHT} justify-start gap-5` : "gap-3"
        }`}
      >
        {showSkeletons &&
          (panel ? (
            <PanelCarouselSkeleton predictCurated={mode === "curated"} />
          ) : (
            <ThumbnailSkeletons />
          ))}

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
                  {loadingMore ? <LoadingText /> : "Load more"}
                </button>
              )}
            </div>
            <StripFade edge="left" hidden={atStart} panel={panel} />
            <StripFade edge="right" hidden={atEnd} panel={panel} />
          </div>
        )}

        {panel && (showSkeletons || showStrip) && (
          // Always the same caption slot — empty while skeletons, filled when
          // metadata is ready — so title/artist never jump the panel height.
          <div
            role={displayedArtwork ? "group" : undefined}
            aria-hidden={displayedArtwork ? undefined : true}
            aria-label={
              displayedArtwork
                ? `Selected inspiration: ${displayedArtwork.title}`
                : undefined
            }
            className={`flex items-start gap-3 px-6 text-center ${PANEL_CAPTION_HEIGHT}`}
          >
            {displayedArtwork ? (
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="line-clamp-2 text-base font-medium leading-normal text-zinc-900">
                  {displayedArtwork.title}
                </p>
                {/* Same size as the title now, so the difference has to be carried
                    by weight and colour alone — medium zinc-900 over normal
                    zinc-400 — rather than by shrinking the secondary line. */}
                <p className="truncate text-base leading-normal text-zinc-400">
                  {[
                    displayedArtwork.artistDisplayName,
                    displayedArtwork.objectDate,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "The Met Open Access"}
                </p>
                {eligibility && !eligibility.eligible && (
                  <p
                    role="alert"
                    className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-base leading-snug text-amber-900"
                  >
                    Generation is disabled for this artwork.{" "}
                    {eligibility.message}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {displayedArtwork && !panel && (
        // Named for a screen reader, which gets only the title otherwise and
        // no hint that this row is the chosen inspiration rather than a
        // caption. Sighted readers have the strip and the ✕ above to say so.
        <div
          role="group"
          aria-label={`Selected inspiration: ${displayedArtwork.title}`}
          className="flex items-center gap-5 pl-1 pr-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium leading-normal text-zinc-900">
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
          {!selectedIsVisible && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              disabled={disabled}
              aria-label="Remove inspiration"
              className={`shrink-0 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
            >
              <CloseIcon size="14px" />
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
            <Info size="15px" />
          </button>
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

function PanelCarouselSkeleton({
  predictCurated = false,
}: {
  /** Use first-open curated aspects so the hand does not jump when images arrive. */
  predictCurated?: boolean;
}) {
  const firstOpen = predictCurated ? curatedFirstOpenObjectIds() : null;
  const activeSize = firstOpen
    ? panelArtworkSizeFromNatural(
        curatedImageSize(firstOpen[2]!),
        PANEL_TILE[0],
      )
    : {
        width: PANEL_TILE[0].maxWidth,
        height: PANEL_TILE[0].height,
      };
  const sizes: Record<
    (typeof PANEL_OFFSETS)[number],
    { width: number; height: number }
  > = {
    [-2]: firstOpen
      ? panelArtworkSizeFromNatural(
          curatedImageSize(firstOpen[0]!),
          PANEL_TILE[-2],
        )
      : { width: 52, height: PANEL_TILE[-2].height },
    [-1]: firstOpen
      ? panelArtworkSizeFromNatural(
          curatedImageSize(firstOpen[1]!),
          PANEL_TILE[-1],
        )
      : { width: 128, height: PANEL_TILE[-1].height },
    0: activeSize,
    1: firstOpen
      ? panelArtworkSizeFromNatural(
          curatedImageSize(firstOpen[3]!),
          PANEL_TILE[1],
        )
      : { width: 88, height: PANEL_TILE[1].height },
    2: firstOpen
      ? panelArtworkSizeFromNatural(
          curatedImageSize(firstOpen[4]!),
          PANEL_TILE[2],
        )
      : { width: 66, height: PANEL_TILE[2].height },
  };

  return (
    <div
      className={`relative flex items-center justify-center ${PANEL_CAROUSEL_HEIGHT}`}
    >
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

function panelArtworkSizeFromNatural(
  natural: { width: number; height: number } | undefined,
  slot: (typeof PANEL_TILE)[(typeof PANEL_OFFSETS)[number]],
) {
  const fallbackAspect = slot.maxWidth / slot.height;
  const aspect =
    natural && natural.height > 0 ? natural.width / natural.height : fallbackAspect;
  if (aspect >= 1) {
    const width = Math.min(slot.maxWidth, slot.height * aspect);
    return { width, height: width / aspect };
  }
  return { width: slot.height * aspect, height: slot.height };
}

function panelArtworkSize(
  artwork: MetArtwork,
  dimensions: Record<number, { width: number; height: number }>,
  slot: (typeof PANEL_TILE)[(typeof PANEL_OFFSETS)[number]],
) {
  // Prefer a live measure, then curated `primaryImageSmall` sizes so the
  // first-open hand (Monet Family at −1, etc.) does not open on the slot's
  // maxWidth/height ratio and morph when the JPEG arrives.
  const natural =
    dimensions[artwork.objectID] ?? curatedImageSize(artwork.objectID);
  return panelArtworkSizeFromNatural(natural, slot);
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
  const rootRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const wheelRemainderRef = useRef(0);
  const wheelLockedUntilRef = useRef(0);
  const swipeRemainderRef = useRef(0);
  const swipeLockedUntilRef = useRef(0);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    armed: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
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

  /*
   * Native non-passive wheel so preventDefault / stopPropagation beat the
   * room root's hang-stepping listener (React's onWheel runs too late).
   */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || artworks.length < 2 || disabled) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const now = performance.now();
      if (now < wheelLockedUntilRef.current) return;
      wheelRemainderRef.current += delta;
      if (Math.abs(wheelRemainderRef.current) < PANEL_WHEEL_STEP) return;
      const direction = wheelRemainderRef.current > 0 ? 1 : -1;
      wheelRemainderRef.current = 0;
      wheelLockedUntilRef.current = now + PANEL_WHEEL_COOLDOWN_MS;
      onMoveRef.current(direction);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [artworks.length, disabled]);

  const endPointer = (el: HTMLDivElement, pointerId: number) => {
    const session = pointerRef.current;
    if (session?.id === pointerId && session.armed) {
      suppressClickRef.current = true;
    }
    pointerRef.current = null;
    swipeRemainderRef.current = 0;
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || artworks.length < 2) return;
    // Chevrons own their clicks; don't turn a press on them into a pan.
    if ((e.target as Element | null)?.closest?.("[data-panel-chevron]")) return;
    pointerRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      armed: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const session = pointerRef.current;
    if (!session || session.id !== e.pointerId) return;

    if (!session.armed) {
      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      if (Math.hypot(dx, dy) < PANEL_SWIPE_DEADZONE) return;
      // Vertical-dominant pans leave the carousel alone.
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerRef.current = null;
        return;
      }
      session.armed = true;
      session.lastX = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const delta = session.lastX - e.clientX;
    session.lastX = e.clientX;
    const now = performance.now();
    if (now < swipeLockedUntilRef.current) return;
    swipeRemainderRef.current += delta;
    if (Math.abs(swipeRemainderRef.current) < PANEL_SWIPE_STEP) return;
    const direction = swipeRemainderRef.current > 0 ? 1 : -1;
    swipeRemainderRef.current = 0;
    swipeLockedUntilRef.current = now + PANEL_WHEEL_COOLDOWN_MS;
    onMoveRef.current(direction);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id !== e.pointerId) return;
    endPointer(e.currentTarget, e.pointerId);
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id !== e.pointerId) return;
    endPointer(e.currentTarget, e.pointerId);
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center ${PANEL_CAROUSEL_HEIGHT}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
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
        data-panel-chevron
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
                  // Pin size in the style attribute so undecoded JPEGs cannot
                  // inflate the abspos tile (and scrollHeight) before Motion
                  // writes width/height from `animate`.
                  width: size.width,
                  height: size.height,
                  zIndex: slot.z,
                  left: "50%",
                  top: "50%",
                }}
                className={`absolute overflow-hidden bg-white shadow-lg hover:opacity-90 disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
              >
                <img
                  src={src}
                  alt={artworkLabel(artwork)}
                  width={Math.round(size.width)}
                  height={Math.round(size.height)}
                  // Visible carousel slots are all on-screen; lazy deferral left
                  // Monet Family as a white max-aspect box until decode.
                  loading="eager"
                  decoding="async"
                  fetchPriority={Math.abs(distance) <= 1 ? "high" : "auto"}
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
                  // Scale past baked-in Met black mats; parent clips overflow.
                  style={metImageTrimStyle(artwork.objectID)}
                  className="h-full w-full object-fill"
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <button
        type="button"
        data-panel-chevron
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
        style={metImageTrimStyle(artwork.objectID)}
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
          <CloseIcon size={iconSize("xs")} strokeWidth={ICON_STROKE_WIDTH} />
        </span>
      )}
    </motion.button>
  );
}
