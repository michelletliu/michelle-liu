"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
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
import { ChevronDown, Images, SquarePen } from "lucide-react";
import Tooltip from "@/components/Tooltip";
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
import { useMetSearch } from "./useMetSearch";

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
  { rotate: 15, x: 54, y: 14 },
  { rotate: 6, x: 27, y: 8 },
  { rotate: 0, x: 0, y: 0 },
];

type GalleryActionBarProps = {
  generating: boolean;
  onGenerate: (
    prompt: string,
    inspiration?: { objectID: number; title: string },
  ) => Promise<void>;
};

/** Opens the composer from outside — double-clicking a painting uses this. */
export type GalleryActionBarHandle = {
  expand: () => void;
};

const GalleryActionBar = forwardRef<
  GalleryActionBarHandle,
  GalleryActionBarProps
>(function GalleryActionBar({ generating, onGenerate }, ref) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<MetArtwork | null>(null);
  const [expanded, setExpanded] = useState(true);
  /*
   * Start with the compact fan peeking over the prompt. The full strip remains
   * one press away through `RestingStack`, without making the first view carry
   * the search row and artwork carousel.
   */
  const [pickerOpen, setPickerOpen] = useState(false);

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
  const promptRef = useRef<HTMLInputElement>(null);
  const pendingFocus = useRef<"bar" | "pen" | null>(null);
  const reduceMotion = useReducedMotion();

  const blocked =
    inspiration !== null && !artworkEligibility(inspiration).eligible;

  /**
   * Focus follows the toggle into whichever control just appeared, so keyboard
   * users are never dropped back onto `<body>`.
   *
   * Applied from the ref callback rather than an effect keyed on `expanded`.
   * Enter/exit shells crossfade, so by the time an effect keyed on `expanded`
   * could run the incoming control may not be mounted yet — focus stayed on
   * `<body>`, and the next Escape went past the bar to the room's own handler
   * and walked the visitor out of the gallery.
   */
  const focusOnMount = useCallback(
    (target: "bar" | "pen") => (node: HTMLElement | null) => {
      if (target === "bar") {
        promptRef.current = node instanceof HTMLInputElement ? node : null;
      }
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

  const expandBar = useCallback(() => {
    if (expanded) {
      promptRef.current?.focus();
      return;
    }
    pendingFocus.current = "bar";
    setExpanded(true);
  }, [expanded]);

  useImperativeHandle(ref, () => ({ expand: expandBar }), [expandBar]);

  /**
   * A pointer landing anywhere else in the room folds the bar away.
   *
   * Bound to `pointerdown` rather than `click`, which settles the drag case
   * for free: a selection dragged out of a text field ends in a `pointerup`
   * outside the bar but began with a `pointerdown` inside it, and only the
   * latter is listened for.
   */
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      // While a generation runs the bar holds the only words about it — the
      // button's label, the live region, and whatever error comes back. The
      // shimmer on the canvas says something is happening; it cannot say that
      // it failed.
      if (generating) return;
      // A dialog is itself outside the bar. It is also the thing being used.
      if (isGalleryDialogOpen()) return;
      const target = e.target as Element | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (target.closest(`[${KEEP_BAR_OPEN_ATTR}]`)) return;
      collapseBar(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, generating, collapseBar]);

  /**
   * Escape folds the bar away, matching the info panel.
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
      const target = e.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();
      collapseBar(true);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [expanded, collapseBar]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = prompt.trim();
    if (!next || generating || blocked) return;
    setError(null);
    try {
      await onGenerate(
        next,
        inspiration
          ? { objectID: inspiration.objectID, title: inspiration.title }
          : undefined,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  /**
   * Shared timing for the pen↔panel shell crossfade and the resting stack.
   * Scale is uniform from center — never width/height layout morph — so the
   * fields keep their shape instead of stretching through intermediate sizes.
   */
  const shellTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

  const shellMotion = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0 },
        transition: shellTransition,
      }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: shellTransition,
      };

  /**
   * Panel contents blur in/out once. Kept ≤6px and limited to the small
   * surface so it stays a short reveal, not a continuous paint cost.
   */
  const contentReveal = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, filter: "blur(6px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(6px)" },
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      };

  /**
   * Puts the inspiration strip away. The bar itself folds to the pen via
   * click-outside or Escape — no chevron on the prompt row.
   */
  const hideInspirationButton = (
    <button
      type="button"
      onClick={() => {
        setPickerOpen(false);
        // The prompt stays mounted under the strip, so focus it before this
        // button unmounts with the search row — otherwise the press leaves
        // the visitor on `<body>`.
        promptRef.current?.focus();
      }}
      aria-expanded
      aria-controls={pickerId}
      aria-label="Hide inspiration"
      // A small rounded rectangle rather than the ghost button's medium
      // circle, which at `size-10` was the largest and roundest thing in a row
      // of 38px rounded-xl controls and read as a different family of object.
      // `rounded-lg` lands on the same squircle family as the field and the
      // Search button beside it. The box is 32px against their 38px, but the
      // padding is what shrank — the glyph is the same 16px, and `py-1.5`
      // keeps the pressable area taller than the ink.
      className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent px-1.5 py-1.5 text-zinc-400 transition-colors duration-200 ease-out hover:bg-zinc-900/5 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
    >
      <ChevronDown size={16} aria-hidden />
    </button>
  );

  return (
    <div
      ref={rootRef}
      // The id lives on the wrapper, not the bar itself, so `aria-controls`
      // still resolves to a real element while the bar is collapsed away.
      id={barId}
      data-gallery-no-drag
      // Positioning belongs to the bottom stack in `GalleryPage`; this only
      // caps its own width so the bar stays a compact panel rather than a
      // full-width tray. `mx-auto` makes the viewport centring explicit while
      // `w-full` still fills the page wrapper's 16px mobile insets.
      className="pointer-events-auto relative mx-auto flex w-full max-w-lg justify-center"
    >
      {/* A sibling of the panel rather than a child of it, because a child
          cannot be painted behind its own parent's background. */}
      <AnimatePresence initial={false}>
        {expanded && !pickerOpen && (
          <RestingStack
            key="stack"
            artworks={search.artworks}
            controls={pickerId}
            transition={shellTransition}
            onOpen={() => setPickerOpen(true)}
          />
        )}
      </AnimatePresence>
      {/*
       * Separate shells stacked on one grid cell, crossfading with uniform
       * scale from center. Layout morph stretched the fields through every
       * intermediate width; this keeps each shell at its final size.
       */}
      <div className="relative grid w-full place-items-center">
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="panel"
              {...shellMotion}
              style={{ transformOrigin: "center center" }}
              className="col-start-1 row-start-1 flex w-full flex-col gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
            >
              <motion.div
                {...contentReveal}
                className="flex w-full flex-col gap-2"
              >
                {pickerOpen && (
                  <div id={pickerId}>
                    <MetArtworkPicker
                      search={search}
                      selected={inspiration}
                      onSelect={setInspiration}
                      disabled={generating}
                      searchRowTrailing={hideInspirationButton}
                    />
                  </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={focusOnMount("bar")}
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={stopGalleryKeys}
                      // No painting id here: `back-2` is internal plumbing and
                      // reads as leaked debug output. Phrased to pair with the
                      // picker's "Search The Met for inspiration…" above it.
                      placeholder={
                        inspiration
                          ? "Describe your subject…"
                          : "Describe the art you want…"
                      }
                      disabled={generating}
                      // No resting border. On a white card that would leave the
                      // field with no edge at all, so the definition moves to a
                      // faint zinc wash — enough to read as a well you can type
                      // into, without drawing a second rectangle inside the panel.
                      // The focus ring is untouched and is now the only boundary
                      // that ever appears, which is what it was competing with.
                      className={`min-w-0 flex-1 rounded-xl border-0 bg-zinc-100/70 px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 ${GALLERY_FOCUS_RING}`}
                      aria-label="Artwork prompt"
                    />
                    <button
                      type="submit"
                      disabled={generating || !prompt.trim() || blocked}
                      className={`shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                    >
                      {generating ? "Generating…" : "Generate"}
                    </button>
                  </div>
                  <p aria-live="polite" className="sr-only">
                    {generating ? "Generating your image…" : ""}
                  </p>
                  {error && (
                    <p className="px-1 text-base text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="pen"
              ref={focusOnMount("pen")}
              type="button"
              onClick={expandBar}
              aria-expanded={false}
              aria-controls={barId}
              aria-label="Open prompt bar"
              {...shellMotion}
              style={{ transformOrigin: "center center" }}
              className={`col-start-1 row-start-1 grid size-10 cursor-pointer place-items-center rounded-full border border-black/10 bg-white/90 text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md ${GALLERY_FOCUS_RING}`}
            >
              <SquarePen size={18} aria-hidden />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default GalleryActionBar;

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
  onOpen,
}: {
  artworks: MetArtwork[];
  controls: string;
  transition: Transition;
  onOpen: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const cards = artworks
    .map((artwork) => ({ artwork, src: openAccessImageUrl(artwork) }))
    .filter((card): card is { artwork: MetArtwork; src: string } =>
      Boolean(card.src),
    )
    .slice(0, STACK_CARDS.length);

  if (cards.length === 0) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={false}
        aria-controls={controls}
        className={`absolute bottom-full right-4 mb-1 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/90 px-2.5 py-1.5 text-xs text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
      >
        <Images size={14} aria-hidden />
        Find inspiration in The Met
      </button>
    );
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
    <div className="absolute right-6 bottom-[calc(100%-2rem)]">
      {/* Reuses the site's tooltip rather than growing a gallery-only one.
          Hover is the component's own; `forceOpen` is how focus gets the same
          hint, since the shared tooltip has no focus path of its own and this
          is the seam it offers. Nothing has to dismiss it on expand — the
          whole fan unmounts at that point, and the tooltip goes with it. */}
      <Tooltip
        label="Get inspired"
        position="top"
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
          // One control, so one lift: the fan opens the picker as a whole, and
          // three cards rising independently would argue with that. `group` is
          // what lets the inner wrapper move for both hover and focus.
          className={`group relative h-25 w-[154px] rounded-xl ${GALLERY_FOCUS_RING}`}
        >
          <span className="sr-only">Find inspiration in The Met</span>
          {/*
           * The lift lives here rather than on the cards, which are mid-flight
           * between layouts whenever the picker opens: a transform on a node
           * framer-motion is projecting fights the projection and lands the
           * cards in the wrong place. On a plain wrapper it is just CSS, and
           * the cards keep their own coordinates.
           */}
          <span className="absolute inset-0 block transition-transform duration-200 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none">
            {/* Painted back to front, so the first work in the strip — the most
              recognisable one — is the square card on top of the pile. */}
            {[...cards].reverse().map(({ artwork, src }, i) => {
              const { rotate, x, y } = fan[i]!;
              return (
                <motion.img
                  // The same id the strip tile carries, so this card and that
                  // tile are one node to framer-motion and it moves between the
                  // two layouts instead of one fading out as the other fades in.
                  layoutId={tileLayoutId(artwork.objectID)}
                  key={artwork.objectID}
                  src={src}
                  alt=""
                  aria-hidden
                  decoding="async"
                  transition={transition}
                  style={{ rotate, x, y }}
                  className={`absolute bottom-0 left-0 border-2 border-white/20 bg-white object-cover shadow-lg ${TILE_SHAPE}`}
                />
              );
            })}
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
