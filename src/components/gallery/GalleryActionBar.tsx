"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { ChevronDownIcon } from "@/components/Chevron";
import { CloseIcon } from "@/components/Close";
import Tooltip from "@/components/Tooltip";
import { iconSize } from "@/components/iconSizes";
import { PlusIcon, SquarePenIcon } from "@/components/library/icons";
import MetArtworkPicker from "./MetArtworkPicker";
import { isGalleryDialogOpen } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { stopGalleryKeys } from "./galleryInputGuards";
import { TILE_SHAPE, tileLayoutId } from "./galleryTile";
import {
  artworkEligibility,
  openAccessImageUrl,
  type MetArtwork,
} from "./metArtworks";
import { metImageTrimScale, metImageTrimStyle } from "./metImageMat";
import { useMetSearch } from "./useMetSearch";

function GalleryDownloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 4V15M7 10L12 15L17 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Marks a control that lives outside the bar but must not dismiss it.
 *
 * The thumbstick and the info button are the room's persistent furniture. Both
 * sit outside the bar, and both are things a visitor reaches for *while*
 * composing — nudging the view to see the wall they are about to fill, or
 * checking where the source images come from. Folding the composer away
 * underneath them would answer a question nobody asked.
 */
export const KEEP_BAR_OPEN_ATTR = "data-gallery-keep-bar-open";

/**
 * The resting stack's fan, back card first. The front one is square to the bar
 * and the rest lean out behind it, so the shape reads as a pile rather than a
 * row — and slicing from the end keeps that square card in place when The Met
 * gave us fewer than three works to show.
 */
const STACK_CARDS = [
  { rotate: 15, x: 54, y: 14, hoverY: -6, hoverRotate: 20 },
  { rotate: 6, x: 27, y: 8, hoverY: -9, hoverRotate: 3 },
  { rotate: 0, x: 0, y: 0, hoverY: -12, hoverRotate: -3 },
];

type GalleryActionBarProps = {
  generating: boolean;
  focusedId: string;
  canDownload?: boolean;
  openSignal?: number;
  onDownload?: () => void;
  onGenerate: (
    prompt: string,
    inspiration?: { objectID: number; title: string },
  ) => Promise<void>;
};

export default function GalleryActionBar({
  generating,
  focusedId,
  canDownload = false,
  openSignal = 0,
  onDownload,
  onGenerate,
}: GalleryActionBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<MetArtwork | null>(null);
  const [inspirationCanMinimize, setInspirationCanMinimize] = useState(false);
  const [inspirationMinimized, setInspirationMinimized] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addHovering, setAddHovering] = useState(false);
  // Flips true in submit before awaiting parent `onGenerate`, so the resting
  // Met chip cannot linger for a frame while `generating` catches up.
  const [submitPending, setSubmitPending] = useState(false);

  /*
   * The search lives here, above the collapse, and not inside the picker.
   * Collapsing unmounts the picker, so anything it owned — the query, the
   * results, the scroll position of the strip — would be thrown away and the
   * visitor would come back to an empty panel. Owning it at this level means
   * re-expanding restores exactly what was there.
   */
  const search = useMetSearch();

  const barId = useId();
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerToggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"bar" | "pen" | null>(null);
  const focusedIdRef = useRef(focusedId);
  const reduceMotion = useReducedMotion();

  const blocked =
    inspiration !== null && !artworkEligibility(inspiration).eligible;
  const isGenerating = generating || submitPending;
  const addDisabled = isGenerating || inspiration !== null;
  const addTooltip = isGenerating
    ? "Generating artwork"
    : inspiration
      ? "Remove artwork to add another"
      : "Get inspired by The Met";
  // Fan + empty "Find inspiration" chip — never while generating or while the
  // curated Met set is still hydrating (empty artworks would otherwise flash
  // the top-right text pill above Generate).
  const showRestingStack =
    expanded &&
    !pickerOpen &&
    !inspiration &&
    !isGenerating &&
    !search.curatedLoading;

  /**
   * Focus follows the toggle into whichever control just appeared, so keyboard
   * users are never dropped back onto `<body>`.
   *
   * Applied from the ref callback rather than an effect keyed on `expanded`.
   * Enter/exit shells share one centered grid cell and crossfade, so by the
   * time an effect keyed on `expanded` could run the incoming control may not
   * be mounted yet — focus stayed on `<body>`, and the next Escape went past
   * the bar to the room's own handler and walked the visitor out of the gallery.
   */
  const focusOnMount = useCallback(
    (target: "bar" | "pen") => (node: HTMLButtonElement | null) => {
      if (node && pendingFocus.current === target) {
        pendingFocus.current = null;
        node.focus();
      }
    },
    [],
  );

  /**
   * Fold the bar away to the pen.
   *
   * `moveFocus` is false for dismissals the pointer drove: the visitor has
   * already put their attention somewhere else in the room, and dragging focus
   * back to a button they did not press is the one thing that would make this
   * feel like an interruption. Keyboard dismissals do move it, because
   * otherwise focus is left on an element that no longer exists.
   */
  const collapseBar = useCallback((moveFocus: boolean) => {
    pendingFocus.current = moveFocus ? "pen" : null;
    setExpanded(false);
  }, []);

  /**
   * Stepped dismiss: picker → inspiration card → whole bar.
   *
   * With an inspiration selected, the first outside click / Escape tucks it
   * into the minimized peek rather than folding the composer away — that is
   * the "minimized mode" the fan and peek were built for. Full collapse only
   * happens once the card is already tucked (or there is no inspiration).
   * Generation still blocks folding the bar, so the Generating label stays
   * visible, but it does not block minimizing the inspiration card.
   */
  const dismissComposer = useCallback(
    (moveFocus: boolean) => {
      if (pickerOpen) {
        setPickerOpen(false);
        if (moveFocus) pickerToggleRef.current?.focus();
        return;
      }
      if (inspiration && !inspirationMinimized) {
        setInspirationCanMinimize(true);
        setInspirationMinimized(true);
        return;
      }
      if (isGenerating) return;
      collapseBar(moveFocus);
    },
    [
      pickerOpen,
      inspiration,
      inspirationMinimized,
      isGenerating,
      collapseBar,
    ],
  );

  const expandBar = () => {
    pendingFocus.current = "bar";
    setExpanded(true);
  };

  const selectInspiration = (artwork: MetArtwork | null) => {
    setInspiration(artwork);
    setInspirationCanMinimize(false);
    setInspirationMinimized(false);
    if (artwork) setPickerOpen(false);
  };

  useEffect(() => {
    if (openSignal === 0) return;
    pendingFocus.current = null;
    setExpanded(true);
  }, [openSignal]);

  useEffect(() => {
    if (focusedIdRef.current === focusedId) return;
    focusedIdRef.current = focusedId;
    setInspiration(null);
    setInspirationCanMinimize(false);
    setInspirationMinimized(false);
    setPickerOpen(false);
  }, [focusedId]);

  /**
   * A pointer landing anywhere else in the room dismisses one level.
   *
   * Bound to `pointerdown` rather than `click`, which settles the drag case
   * for free: a selection dragged out of a text field ends in a `pointerup`
   * outside the bar but began with a `pointerdown` inside it, and only the
   * latter is listened for.
   */
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (isGalleryDialogOpen()) return;
      const target = e.target as Element | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (target.closest(`[${KEEP_BAR_OPEN_ATTR}]`)) return;
      dismissComposer(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, dismissComposer]);

  /**
   * Escape dismisses one level, matching the info panel.
   *
   * Capture phase on `document`, which puts it ahead of both React's delegated
   * handlers and the room's own window-level Escape. That ordering is the
   * whole point: without it, `stopGalleryKeys` would blur the field, and the
   * next Escape would walk the visitor out of the gallery entirely.
   */
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isGalleryDialogOpen()) return;
      if (pickerOpen) {
        e.preventDefault();
        e.stopPropagation();
        setPickerOpen(false);
        pickerToggleRef.current?.focus();
        return;
      }
      const target = e.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();
      dismissComposer(true);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [expanded, pickerOpen, dismissComposer]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = prompt.trim();
    if (!next || isGenerating || blocked) return;
    setError(null);
    setSubmitPending(true);
    if (inspiration) setInspirationCanMinimize(true);
    try {
      await onGenerate(
        next,
        inspiration
          ? { objectID: inspiration.objectID, title: inspiration.title }
          : undefined,
      );
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setSubmitPending(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
   * COMPOSER MORPH STORYBOARD
   *
   *    0ms   shells share one centered grid cell
   *  280ms   outgoing shell scales 1 → 0.92 + fades (origin: center)
   *  280ms   incoming shell scales 0.92 → 1 + fades in (origin: center)
   *
   * The expanded prompt shell must not leave the focused input under a
   * compositor layer at rest: no residual scale, no backdrop-filter, no
   * nested opacity wrapper. Those make the native caret short and uneven.
   * `transformTemplate` drops scale when it hits 1; the shell is solid white
   * (blur was decorative-only on an opaque fill); contents are not wrapped in
   * a second opacity motion node.
   * ───────────────────────────────────────────────────────── */
  const shellTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

  /**
   * Uniform scale from center — never width/height layout morph — so fields
   * keep their shape. Both shells stack in one grid cell so growth reads as
   * expanding from the midpoint, not from the right edge.
   */
  const shellMotion = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0 },
        transition: shellTransition,
      }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.92 },
        transition: shellTransition,
      };

  /**
   * While scale is exactly 1, emit no transform so the prompt caret paints on
   * the device pixel grid. Any non-1 scale (enter/exit morph) keeps the matrix.
   */
  const shellTransformTemplate = (
    { scale }: { scale?: number | string },
    generated: string,
  ) => {
    const s = typeof scale === "number" ? scale : Number(scale);
    if (!Number.isFinite(s) || Math.abs(s - 1) < 0.001) return "none";
    return generated;
  };

  return (
    <div
      ref={rootRef}
      // The id lives on the wrapper, not the bar itself, so `aria-controls`
      // still resolves to a real element while the bar is collapsed away.
      id={barId}
      data-gallery-no-drag
      // Positioning belongs to the bottom stack in `GalleryPage`; this only
      // caps its own width so the bar stays a panel rather than a full-width
      // band, and anchors the resting stack below.
      className={`pointer-events-auto relative flex w-full justify-center ${
        inspiration ? "max-w-[720px]" : "max-w-[590px]"
      }`}
    >
      {/* A sibling of the panel rather than a child of it, because a child
          cannot be painted behind its own parent's background. */}
      <AnimatePresence initial={false}>
        {showRestingStack && (
          // Instant exit: a timed fade left the empty "Find inspiration" chip
          // (and the fan) visible over Generating…. Duration 0 clears it on the
          // same frame `showRestingStack` flips false.
          <motion.div
            key="stack"
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
          >
            <RestingStack
              artworks={search.artworks}
              controls={pickerId}
              transition={shellTransition}
              lifted={addHovering}
              onOpen={() => setPickerOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {expanded && pickerOpen && (
          <>
            <motion.div
              key="picker-overlay"
              // Above the composer shell (z-10): same-layer z-10 let the
              // generate bar paint over the dimmer and punch through the modal.
              className="fixed inset-0 z-30 bg-zinc-950/25"
              onClick={() => setPickerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              aria-hidden
            />
            <motion.div
              id={pickerId}
              key="picker"
              initial={{
                opacity: 0,
                y: reduceMotion ? 0 : 18,
                scale: reduceMotion ? 1 : 0.98,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: reduceMotion ? 0 : 12,
                scale: reduceMotion ? 1 : 0.98,
              }}
              transition={shellTransition}
              className="absolute bottom-[calc(100%+104px)] left-1/2 z-40 w-[min(90vw,690px)] -translate-x-1/2"
            >
              <MetArtworkPicker
                search={search}
                selected={inspiration}
                onSelect={selectInspiration}
                disabled={isGenerating}
                panel
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {expanded && !pickerOpen && inspiration && !inspirationMinimized && (
          <SelectedInspirationCard
            key="selected-inspiration"
            artwork={inspiration}
            canMinimize={inspirationCanMinimize}
            onMinimize={() => setInspirationMinimized(true)}
            onRemove={() => {
              setInspiration(null);
              setInspirationCanMinimize(false);
              setInspirationMinimized(false);
            }}
            transition={shellTransition}
          />
        )}
        {expanded && !pickerOpen && inspiration && inspirationMinimized && (
          <MinimizedInspirationPeek
            key="selected-inspiration-peek"
            artwork={inspiration}
            onRestore={() => setInspirationMinimized(false)}
            transition={shellTransition}
          />
        )}
      </AnimatePresence>
      {/*
       * Separate shells stacked on one centered grid cell. Morphing one
       * element between those aspect ratios creates a stretched lens; scale
       * from center keeps each shell at its final size while the midpoint
       * stays put (unlike a right-anchored width morph).
       */}
      <div className="relative z-10 grid w-full place-items-center">
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="panel"
              {...shellMotion}
              transformTemplate={shellTransformTemplate}
              style={{ transformOrigin: "center center" }}
              // Solid fill — no backdrop-blur. Blur on this node promotes a
              // compositor layer and shrinks/unevens the native caret.
              className="col-start-1 row-start-1 flex w-full flex-col gap-2 rounded-full border border-black/10 bg-white px-2.5 py-[9px] shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
            >
              <form onSubmit={submit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Tooltip label={addTooltip} position="top" offset={10}>
                    <button
                      ref={(node) => {
                        pickerToggleRef.current = node;
                        focusOnMount("bar")(node);
                      }}
                      type="button"
                      onPointerEnter={() => {
                        if (!addDisabled) setAddHovering(true);
                      }}
                      onPointerLeave={() => setAddHovering(false)}
                      onFocus={(e) => {
                        if (
                          !addDisabled &&
                          e.currentTarget.matches(":focus-visible")
                        ) {
                          setAddHovering(true);
                        }
                      }}
                      onBlur={() => setAddHovering(false)}
                      onClick={() => {
                        if (addDisabled) return;
                        setPickerOpen((open) => !open);
                      }}
                      aria-expanded={pickerOpen}
                      aria-controls={pickerId}
                      aria-label={
                        pickerOpen
                          ? "Hide inspiration picker"
                          : "Get inspired by The Met"
                      }
                      disabled={addDisabled}
                      className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors ${
                        addDisabled
                          ? "cursor-not-allowed bg-zinc-100/70 text-zinc-300"
                          : "cursor-pointer text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      } ${GALLERY_FOCUS_RING}`}
                    >
                      <PlusIcon className="size-[15px]" strokeWidth={1.25} />
                    </button>
                  </Tooltip>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={stopGalleryKeys}
                    placeholder="Describe your artwork…"
                    disabled={isGenerating}
                    // No inner focus ring — the outer composer pill is the
                    // surface. `gallery-focus` opts out of the unlayered
                    // global outline. Caret follows text metrics; even stroke
                    // needs no scaled/blurred/opacity ancestors at rest.
                    className="gallery-focus min-w-0 flex-1 rounded-full border-0 bg-transparent px-0 py-2 text-base leading-6 text-zinc-900 caret-zinc-900 outline-none ring-0 placeholder:text-zinc-300 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60"
                    aria-label="Artwork prompt"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim() || blocked}
                    className={`shrink-0 rounded-full bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                  >
                    {isGenerating ? (
                      <GeneratingLabel reduceMotion={Boolean(reduceMotion)} />
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>
                <p aria-live="polite" className="sr-only">
                  {isGenerating ? "Generating your image…" : ""}
                </p>
                {error && (
                  <p className="px-1 text-base text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-actions"
              {...shellMotion}
              style={{ transformOrigin: "center center" }}
              className="col-start-1 row-start-1 inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md"
            >
              <Tooltip label="Open prompt" position="top" offset={10}>
                <button
                  ref={focusOnMount("pen")}
                  type="button"
                  onClick={expandBar}
                  aria-expanded={false}
                  aria-controls={barId}
                  aria-label="Open prompt bar"
                  className={`grid size-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
                >
                  <SquarePenIcon className="size-[18px]" />
                </button>
              </Tooltip>
              {canDownload && onDownload && (
                <Tooltip label="Download image" position="top" offset={10}>
                  <button
                    type="button"
                    onClick={onDownload}
                    aria-label="Download the generated image on this canvas"
                    className={`grid size-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
                  >
                    <GalleryDownloadIcon className="size-[18px]" />
                  </button>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Cycles the trailing dots on the submit label while a generation runs. */
function GeneratingLabel({ reduceMotion }: { reduceMotion: boolean }) {
  const [dots, setDots] = useState(3);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setDots((count) => (count % 3) + 1);
    }, 420);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const ellipsis = reduceMotion ? "…" : ".".repeat(dots);
  return (
    <span aria-label="Generating">
      Generating
      <span className="inline-block w-[1.25em] text-left">{ellipsis}</span>
    </span>
  );
}

function SelectedInspirationCard({
  artwork,
  canMinimize,
  onMinimize,
  onRemove,
  transition,
}: {
  artwork: MetArtwork;
  canMinimize: boolean;
  onMinimize: () => void;
  onRemove: () => void;
  transition: Transition;
}) {
  const src = openAccessImageUrl(artwork);
  const meta = [artwork.artistDisplayName, artwork.objectDate]
    .filter(Boolean)
    .join(" · ");
  const titleRef = useRef<HTMLParagraphElement>(null);
  // Short titles center against the thumb; wrapping titles top-align so
  // multi-line Hokusai-length names don't float oddly mid-card.
  const [titleWraps, setTitleWraps] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      setTitleWraps(
        Number.isFinite(lineHeight) && lineHeight > 0
          ? el.scrollHeight > lineHeight + 1
          : el.scrollHeight > el.clientHeight,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [artwork.objectID, artwork.title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.985 }}
      transition={transition}
      className={`absolute bottom-[calc(100%-14px)] left-1/2 z-0 flex w-[calc(100%-38px)] -translate-x-1/2 gap-4 rounded-t-[34px] rounded-b-none border border-black/10 bg-white/95 px-4 pt-4 pb-6 pr-12 text-left shadow-[0_12px_28px_rgba(0,0,0,0.10)] backdrop-blur-md ${
        titleWraps ? "items-start" : "items-center"
      }`}
    >
      {src && (
        <span className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-white shadow-md">
          <motion.img
            layoutId={tileLayoutId(artwork.objectID)}
            src={src}
            alt=""
            aria-hidden
            decoding="async"
            transition={transition}
            style={metImageTrimStyle(artwork.objectID)}
            className="size-full object-cover"
          />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm leading-tight text-zinc-400">Inspired by</p>
        <p
          ref={titleRef}
          className="mt-1.5 line-clamp-3 text-base font-medium leading-snug text-zinc-900"
        >
          {artwork.title}
        </p>
        {meta && (
          <p className="mt-0.5 truncate text-base leading-snug text-zinc-500">
            {meta}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={canMinimize ? onMinimize : onRemove}
        aria-label={canMinimize ? "Minimize inspiration" : "Remove inspiration"}
        className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:bg-zinc-200/70 ${GALLERY_FOCUS_RING}`}
      >
        {canMinimize ? (
          <ChevronDownIcon size={iconSize("inline")} />
        ) : (
          <CloseIcon size="14px" />
        )}
      </button>
    </motion.div>
  );
}

function MinimizedInspirationPeek({
  artwork,
  onRestore,
  transition,
}: {
  artwork: MetArtwork;
  onRestore: () => void;
  transition: Transition;
}) {
  const src = openAccessImageUrl(artwork);
  if (!src) return null;

  return (
    <motion.button
      type="button"
      onClick={onRestore}
      aria-label={`Show inspiration: ${artwork.title}`}
      initial={{ opacity: 0, y: 10, scale: 0.98, rotate: -3 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: -3 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, rotate: -3 }}
      transition={transition}
      className={`absolute bottom-[calc(100%-34px)] left-10 z-0 rounded-[18px] ${GALLERY_FOCUS_RING}`}
    >
      <span className="block size-24 overflow-hidden rounded-[18px] border-2 border-white/20 shadow-lg">
        <motion.img
          layoutId={tileLayoutId(artwork.objectID)}
          src={src}
          alt=""
          aria-hidden
          decoding="async"
          transition={transition}
          style={metImageTrimStyle(artwork.objectID)}
          className="size-full object-cover"
        />
      </span>
    </motion.button>
  );
}

/**
 * The inspiration strip, put away.
 *
 * A few works fanned above the bar's shoulder, half tucked behind it: enough
 * to say what pressing it would open, while giving the prompt row the whole
 * panel. Falls back to a labelled glyph when The Met gave us nothing to show,
 * so the search field is still one press away on a bad network.
 */
function RestingStack({
  artworks,
  controls,
  transition,
  lifted,
  onOpen,
}: {
  artworks: MetArtwork[];
  controls: string;
  transition: Transition;
  lifted: boolean;
  onOpen: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const seen = new Set<number>();
  const cards = artworks
    .map((artwork) => ({ artwork, src: openAccessImageUrl(artwork) }))
    .filter((card): card is { artwork: MetArtwork; src: string } => {
      if (!card.src || seen.has(card.artwork.objectID)) return false;
      seen.add(card.artwork.objectID);
      return true;
    })
    .slice(0, STACK_CARDS.length);

  if (cards.length === 0) {
    // No top-right "Find inspiration in The Met" text chip. While curated
    // data is loading or Met returned nothing, the composer's + still opens
    // the picker — a floating label above Generate only confused loading /
    // generating states.
    return null;
  }

  const fan = STACK_CARDS.slice(STACK_CARDS.length - cards.length);

  return (
    /*
     * The fan's placement lives on this wrapper and not on the tooltip.
     *
     * Passing `absolute …` to `Tooltip`'s `className` looks like it should
     * work and silently does not: the component composes `clsx('relative
     * inline-flex', className)`, and since both utilities sit in the same
     * Tailwind layer it is stylesheet order, not class order, that settles the
     * tie — `relative` wins. The fan therefore stayed in flow as a 154px flex
     * item, sitting beside the panel instead of above it and shouldering the
     * panel 77px off-centre, while `bottom-full` and `right-6` did nothing at
     * all and the stray `translate-y-8` pushed the cards through the bottom of
     * the viewport.
     *
     * Wrapping instead of overriding also leaves the tooltip the positioning
     * context it needs: its bubble is absolutely placed against `relative
     * inline-flex`, so taking that away to make room for our own placement
     * would have unmoored the bubble in the act of anchoring the cards.
     */
    <div className="absolute bottom-[calc(100%-2.95rem)] left-6 overflow-visible">
      {/* Reuses the site's tooltip rather than growing a gallery-only one.
          Hover is the component's own; `forceOpen` is how focus gets the same
          hint, since the shared tooltip has no focus path of its own and this
          is the seam it offers. Nothing has to dismiss it on expand — the
          whole fan unmounts at that point, and the tooltip goes with it. */}
      <Tooltip
        label="Get inspired by The Met"
        position="top"
        // Anchor matches the tile box (`h-25` = `size-25` cards). A taller
        // hit target left empty air above the fan, so offset alone could not
        // close the gap without going negative. Overflow stays visible so
        // rotate / hover lift still paint above the box.
        offset={10}
        forceOpen={focused}
      >
        <button
          type="button"
          onClick={onOpen}
          onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
          onBlur={() => setFocused(false)}
          aria-expanded={false}
          aria-controls={controls}
          className={`group relative h-25 w-[154px] overflow-visible rounded-xl ${GALLERY_FOCUS_RING}`}
        >
          <span className="sr-only">Find inspiration in The Met</span>
          <span className="absolute inset-0 block overflow-visible">
            {/* Painted back to front, so the first work in the strip — the most
              recognisable one — is the square card on top of the pile. */}
            {[...cards].reverse().map(({ artwork, src }, i) => {
              const { rotate, x, y, hoverY, hoverRotate } = fan[i]!;
              const trimScale = metImageTrimScale(artwork.objectID);
              // Rotate/lift the clip box itself. Putting overflow-hidden on a
              // non-rotated parent (with rotate on the img) axis-aligned the
              // clip and sliced the fan tops into a hard horizontal edge.
              const restTransform = "rotate(var(--rest-rotate))";
              const hoverTransform =
                "translateY(var(--hover-y)) rotate(var(--hover-rotate))";
              return (
                <motion.span
                  // The same id the strip tile carries, so this card and that
                  // tile are one node to framer-motion and it moves between the
                  // two layouts instead of one fading out as the other fades in.
                  layoutId={tileLayoutId(artwork.objectID)}
                  key={artwork.objectID}
                  transition={transition}
                  style={{ x, y }}
                  className="absolute bottom-0 left-0 block overflow-visible"
                >
                  <span
                    style={
                      {
                        "--rest-rotate": `${rotate}deg`,
                        "--hover-rotate": `${hoverRotate}deg`,
                        "--hover-y": `${hoverY}px`,
                        "--rest-transform": restTransform,
                        "--hover-transform": hoverTransform,
                      } as React.CSSProperties
                    }
                    className={`block overflow-hidden border-2 border-white/20 bg-white shadow-lg transition-transform duration-200 ease-out ${
                      lifted
                        ? "[transform:var(--hover-transform)]"
                        : "[transform:var(--rest-transform)]"
                    } group-hover:[transform:var(--hover-transform)] group-focus-visible:[transform:var(--hover-transform)] motion-reduce:transition-none motion-reduce:[transform:var(--rest-transform)] ${TILE_SHAPE}`}
                  >
                    <img
                      src={src}
                      alt=""
                      aria-hidden
                      decoding="async"
                      style={
                        trimScale > 1
                          ? { transform: `scale(${trimScale})` }
                          : undefined
                      }
                      className="size-full object-cover"
                    />
                  </span>
                </motion.span>
              );
            })}
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
