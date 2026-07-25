"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Images, SquarePen } from "lucide-react";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
import MetArtworkPicker from "./MetArtworkPicker";
import { isGalleryDialogOpen } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { stopGalleryKeys } from "./galleryInputGuards";
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

  const motionProps = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
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
      className={ghostIconButtonClass(
        "md",
        `text-zinc-400 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`,
      )}
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
      {expanded && !pickerOpen && (
        <RestingStack
          artworks={search.artworks}
          controls={pickerId}
          onOpen={() => setPickerOpen(true)}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="bar"
            {...motionProps}
            className="relative flex w-full flex-col gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
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
                  className={`min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 ${GALLERY_FOCUS_RING}`}
                  aria-label="Artwork prompt"
                />
                <button
                  type="submit"
                  disabled={generating || !prompt.trim() || blocked}
                  className={`shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
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
                <p className="px-1 text-xs text-red-600" role="alert">
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
            {...motionProps}
            className={ghostIconButtonClass(
              "md",
              `border border-black/10 bg-white/90 text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md hover:bg-white ${GALLERY_FOCUS_RING}`,
            )}
          >
            <SquarePen size={18} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
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
  onOpen,
}: {
  artworks: MetArtwork[];
  controls: string;
  onOpen: () => void;
}) {
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
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-controls={controls}
      // Anchored above the panel's right shoulder and pushed back down into
      // it, so the fan reads as tucked behind the bar rather than floating.
      className={`absolute bottom-full right-6 h-25 w-[154px] translate-y-8 rounded-md ${GALLERY_FOCUS_RING}`}
    >
      <span className="sr-only">Find inspiration in The Met</span>
      {/* Painted back to front, so the first work in the strip — the most
          recognisable one — is the square card on top of the pile. */}
      {[...cards].reverse().map(({ artwork, src }, i) => {
        const { rotate, x, y } = fan[i]!;
        return (
          <img
            key={artwork.objectID}
            src={src}
            alt=""
            aria-hidden
            decoding="async"
            style={{ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)` }}
            className="absolute bottom-0 left-0 size-25 rounded-md border-2 border-white/20 bg-white object-cover shadow-lg"
          />
        );
      })}
    </button>
  );
}
