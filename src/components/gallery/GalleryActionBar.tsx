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

export default function GalleryActionBar({
  generating,
  onGenerate,
}: GalleryActionBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<MetArtwork | null>(null);
  const [expanded, setExpanded] = useState(true);
  /*
   * Open from the start, so the strip's curated works are the first thing a
   * visitor sees rather than something they have to go looking for.
   */
  const [pickerOpen, setPickerOpen] = useState(true);

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
  const pendingFocus = useRef<"bar" | "pen" | null>(null);
  const reduceMotion = useReducedMotion();

  const blocked =
    inspiration !== null && !artworkEligibility(inspiration).eligible;

  /**
   * Focus follows the toggle into whichever control just appeared, so keyboard
   * users are never dropped back onto `<body>`.
   *
   * Applied from the ref callback rather than an effect keyed on `expanded`.
   * `AnimatePresence mode="wait"` holds the incoming control back until the
   * outgoing one has finished leaving, so by the time an effect could run
   * there is nothing mounted to focus yet — focus stayed on `<body>`, and the
   * next Escape went past the bar to the room's own handler and walked the
   * visitor out of the gallery.
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

  const expandBar = () => {
    pendingFocus.current = "bar";
    setExpanded(true);
  };

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
   * The shell's own movement, and the only thing that describes the change of
   * size. Everything else in the bar borrows this duration and curve so the
   * panel, the strip and the fanned cards read as one gesture rather than
   * three animations that happen to start together.
   */
  const shellTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  /**
   * Contents only fade. They used to arrive on their own `y` and `scale`,
   * which is what made the pen and the panel look like two separate things
   * changing places: the shell was going one way while its contents went
   * another. With the shell carrying all the movement, anything the contents
   * add is a second animation competing with it.
   */
  const contentFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0 : 0.12 },
  };

  /**
   * The collapse chevron, which steps down one level at a time: it puts the
   * inspiration strip away first, and folds the whole bar to the pen from
   * there. Two presses reach the pen, and the pointer and Escape paths above
   * go straight there for anyone who does not want the intermediate stop.
   */
  const collapseButton = (
    <button
      ref={focusOnMount("bar")}
      type="button"
      onClick={() => {
        if (!pickerOpen) {
          collapseBar(true);
          return;
        }
        // Hiding the strip moves this same button from the search row down
        // into the prompt row, which unmounts and remounts it. Without
        // reclaiming focus a keyboard press drops the visitor back to the
        // document body, one press away from the bar they were just in.
        pendingFocus.current = "bar";
        setPickerOpen(false);
      }}
      aria-expanded
      aria-controls={pickerOpen ? pickerId : barId}
      aria-label={pickerOpen ? "Hide inspiration" : "Collapse prompt bar"}
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
      // caps its own width so the bar stays a panel rather than a full-width
      // band, and anchors the resting stack below.
      className="pointer-events-auto relative flex w-full max-w-xl justify-center"
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
       * One shell for both states, rather than a circle that leaves and a
       * panel that arrives. `layout` interpolates the box — position, size and
       * the corner radius with it — so the pen grows into the panel instead of
       * the two crossfading past each other. The contents inside only fade,
       * which is the other half of the same fix: whatever they animate is an
       * animation running against the shell's.
       */}
      <motion.div
        layout
        transition={shellTransition}
        className={
          expanded
            ? "relative flex w-full flex-col gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
            : "relative size-10 rounded-full border border-black/10 bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md"
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <motion.div
              key="panel"
              // `layout="position"` moves this without stretching it, so the
              // fields inside keep their shape while the shell resizes around
              // them — the skew that otherwise gives a layout morph away.
              layout="position"
              {...contentFade}
              className="flex w-full flex-col gap-2"
            >
              {pickerOpen && (
                <div id={pickerId}>
                  <MetArtworkPicker
                    search={search}
                    selected={inspiration}
                    onSelect={setInspiration}
                    disabled={generating}
                    searchRowTrailing={collapseButton}
                  />
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
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
                  {/* With the strip put away the chevron has nowhere else to
                    live, and it is the only way back to the pen by pointer
                    short of clicking off the bar entirely. */}
                  {!pickerOpen && collapseButton}
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
          ) : (
            <motion.button
              key="pen"
              ref={focusOnMount("pen")}
              type="button"
              onClick={expandBar}
              aria-expanded={false}
              aria-controls={barId}
              aria-label="Open prompt bar"
              layout="position"
              {...contentFade}
              // Fills the shell rather than being one: the shell already draws
              // the circle, the border and the shadow, and it has to keep
              // drawing them while it grows into a panel.
              className={`absolute inset-0 grid cursor-pointer place-items-center rounded-full text-zinc-500 ${GALLERY_FOCUS_RING}`}
            >
              <SquarePen size={18} aria-hidden />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
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
