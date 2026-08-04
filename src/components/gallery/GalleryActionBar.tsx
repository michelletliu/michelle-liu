"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { CloseIcon } from "@/components/icons/Close";
import {
  FILM_DOT_STYLE,
  GALLERY_LOADING_PHRASES,
  RotatingLoadingText,
} from "@/components/RotatingLoadingText";
import Tooltip from "@/components/shared/Tooltip";
import { PlusIcon, SquarePenIcon } from "@/components/library/icons";
import MetArtworkPicker from "./MetArtworkPicker";
import {
  COMPOSER_MORPH_MS,
  COMPOSER_MORPH_STYLE,
  type ComposerPanelId,
} from "./composerMorphStyles";
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

/**
 * Resting one-line height matches prod’s single-line `<input>` chrome:
 * `leading-6` (24) + `py-2` (8+8) under `box-border`.
 */
const PROMPT_MIN_HEIGHT_PX = 40;
/** Cap wrapped prompt height (~7 lines at text-base / leading-6). */
const PROMPT_MAX_HEIGHT_PX = 168;
/** Ignore sub-pixel scrollHeight noise so empty/short text stays one line. */
const PROMPT_WRAP_SLACK_PX = 2;
/**
 * Ignore cols-sized / pre-layout widths when caching the single-line text slot.
 * A ~40px field makes the empty placeholder wrap and inflate scrollHeight,
 * which would falsely lock the stacked multiline layout.
 */
const PROMPT_MIN_SLOT_WIDTH_PX = 120;
/**
 * Multiline prompt: inset text to the + glyph (size-10 button, 15px icon with
 * viewBox padding) — a few px past the button’s geometric left edge.
 */
const PROMPT_MULTILINE_PL = "pl-[14px]";

/** Last successful generate for a canvas — restores the composer on edit. */
export type PaintingGenerationContext = {
  prompt: string;
  inspiration: MetArtwork | null;
};

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
  { rotate: 15, x: 54, y: 14, hoverY: -4, hoverRotate: 20 },
  { rotate: 6, x: 27, y: 8, hoverY: -6, hoverRotate: 3 },
  // Front tile: CCW tip angles the top edge left (bottom-right lifts NE).
  { rotate: -6, x: 0, y: 0, hoverY: -8, hoverRotate: -9 },
];

type GalleryActionBarProps = {
  generating: boolean;
  focusedId: string;
  /** Last successful generate for the focused canvas, if any. */
  generationContext?: PaintingGenerationContext;
  canDownload?: boolean;
  openSignal?: number;
  onDownload?: () => void;
  onGenerate: (prompt: string, inspiration?: MetArtwork) => Promise<void>;
  /** True while the maximized composer shell is showing (not pen / generating pill). */
  onExpandedChange?: (expanded: boolean) => void;
};

export default function GalleryActionBar({
  generating,
  focusedId,
  generationContext,
  canDownload = false,
  openSignal = 0,
  onDownload,
  onGenerate,
  onExpandedChange,
}: GalleryActionBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<MetArtwork | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  // True while the pointer is over + or the revealed Met stack (or while + is
  // :focus-visible). Gates stack roll-up + Met tooltip — not composer expand.
  const [addHovering, setAddHovering] = useState(false);
  // After a pointer (or programmatic) expand, + can mount under a stationary
  // cursor and would fire enter as if hovered — flashing the stack/tooltip.
  // Hold until the pointer actually moves; keyboard focus-visible stays allowed.
  const [metHoverArmed, setMetHoverArmed] = useState(true);
  // Bridges the gap between + (inside the shell) and the fan (above it) so the
  // stack doesn't roll down the instant the pointer leaves the + hit target.
  const metChromeLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
  const morphRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const panelRefs = useRef(new Map<ComposerPanelId, HTMLDivElement>());
  const morphSettled = useRef(false);
  const pickerToggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"bar" | "pen" | null>(null);
  const focusedIdRef = useRef(focusedId);
  const generationContextRef = useRef(generationContext);
  generationContextRef.current = generationContext;
  const reduceMotion = useReducedMotion();
  const [morphSize, setMorphSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [morphInstant, setMorphInstant] = useState(true);
  const [morphSettledFlag, setMorphSettledFlag] = useState(true);
  /** Soft radius only once the prompt actually wraps past one line. */
  const [promptMultiline, setPromptMultiline] = useState(false);
  /** Brief shell height ease for the single ↔ multiline layout switch. */
  const [multilineMorphing, setMultilineMorphing] = useState(false);
  /** Text width available in the single-line `+ | text | Generate` row. */
  const singleLineSlotWidthRef = useRef(0);
  const promptMultilineRef = useRef(false);
  promptMultilineRef.current = promptMultiline;

  // Drop a previous canvas's in-flight submit latch as soon as focus moves, so
  // `submitPending` from canvas A cannot paint "Generating…" on canvas B for a
  // frame (or longer) while A's await is still running.
  const [submitFocusId, setSubmitFocusId] = useState(focusedId);
  if (focusedId !== submitFocusId) {
    setSubmitFocusId(focusedId);
    if (submitPending) setSubmitPending(false);
  }

  const blocked =
    inspiration !== null && !artworkEligibility(inspiration).eligible;
  const isGenerating = generating || submitPending;
  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  // Generating must never paint the expanded composer shell — including when
  // navigating onto a hang mid-run, when `generating` flips true while open,
  // or if expand somehow races submit. Force the minimized Generating pill.
  if (isGenerating && expanded) {
    setExpanded(false);
    setPickerOpen(false);
    if (pendingFocus.current === "bar") pendingFocus.current = null;
  }

  const addDisabled = isGenerating || inspiration !== null;
  const addTooltip = isGenerating
    ? "Generating artwork"
    : inspiration
      ? "Remove artwork to add another"
      : "Get inspired by The Met";

  /** Grow the prompt with wrapped lines; stay one line until content needs more. */
  const resizePromptField = useCallback(() => {
    const el = promptRef.current;
    if (!el) return;
    // Floor at the prod single-line height. Avoid `height: 0` — that inflates
    // scrollHeight via padding and leaves the empty field too tall.
    // Measure only after layout has a real flex width; a cols-sized intrinsic
    // width underestimates wrap and leaves bottom-heavy empty space.
    el.style.height = `${PROMPT_MIN_HEIGHT_PX}px`;
    // Force a layout read so scrollHeight matches the current used width.
    void el.offsetWidth;

    const value = el.value;
    // Cache only a plausible single-line text slot (ignore cols=1 intrinsic).
    if (
      !promptMultilineRef.current &&
      el.clientWidth >= PROMPT_MIN_SLOT_WIDTH_PX
    ) {
      singleLineSlotWidthRef.current = el.clientWidth;
    }

    // Placeholder-only must stay the one-line `+ | prompt | Generate` row.
    // Empty scrollHeight still reflects a wrapping placeholder when the field
    // is briefly narrow — that must never flip us into the stacked layout.
    if (!value) {
      el.style.height = `${PROMPT_MIN_HEIGHT_PX}px`;
      el.style.overflowY = "hidden";
      setPromptMultiline(false);
      return;
    }

    // Wrap detection must use the single-line row's text slot — full-width
    // multiline layout is wider and would unwrap, oscillating the mode.
    const slotW = singleLineSlotWidthRef.current;
    const hasNewline = value.includes("\n");
    let wrapped = hasNewline;
    if (!wrapped) {
      const measureW =
        slotW >= PROMPT_MIN_SLOT_WIDTH_PX
          ? slotW
          : el.clientWidth >= PROMPT_MIN_SLOT_WIDTH_PX
            ? el.clientWidth
            : 0;
      if (measureW > 0) {
        const prevWidth = el.style.width;
        el.style.width = `${measureW}px`;
        void el.offsetWidth;
        wrapped =
          el.scrollHeight > PROMPT_MIN_HEIGHT_PX + PROMPT_WRAP_SLACK_PX;
        el.style.width = prevWidth;
        void el.offsetWidth;
      }
      // Layout not ready — stay single-line rather than false-positive.
    }

    const scroll = el.scrollHeight;
    const next = wrapped
      ? Math.min(scroll, PROMPT_MAX_HEIGHT_PX)
      : PROMPT_MIN_HEIGHT_PX;
    el.style.height = `${next}px`;
    el.style.overflowY = scroll > PROMPT_MAX_HEIGHT_PX ? "auto" : "hidden";
    setPromptMultiline(wrapped);
  }, []);

  useLayoutEffect(() => {
    if (!expanded) {
      setPromptMultiline(false);
      setMultilineMorphing(false);
      return;
    }
    // Measure at the expanded target width (--composer-expanded-w), not the
    // animating shell width, so wrap/height stay stable for the whole morph.
    resizePromptField();
    const el = promptRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let prevW = el.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w === prevW) return;
      prevW = w;
      resizePromptField();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, prompt, promptMultiline, resizePromptField]);

  // Ease shell height when crossing the single ↔ multiline layout threshold.
  // Per-line growth while already multiline stays instant (data-settled).
  const prevPromptMultiline = useRef(promptMultiline);
  useLayoutEffect(() => {
    if (prevPromptMultiline.current === promptMultiline) return;
    prevPromptMultiline.current = promptMultiline;
    if (!expanded || reduceMotion || morphInstant) return;
    setMultilineMorphing(true);
    setMorphSettledFlag(false);
    const ms = 300;
    const t = window.setTimeout(() => setMultilineMorphing(false), ms);
    return () => window.clearTimeout(t);
  }, [promptMultiline, expanded, reduceMotion, morphInstant]);

  const onPromptKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    stopGalleryKeys(e);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && prompt.trim() && !blocked) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  // Fan stays mounted (tucked below the clip) while eligible — never while
  // generating or while curated Met data is still hydrating. Roll-up reveal
  // is gated on addHovering (+ hover / :focus-visible), not on expand alone.
  const canShowRestingStack =
    expanded &&
    !pickerOpen &&
    !inspiration &&
    !isGenerating &&
    !search.curatedLoading;

  const clearMetChromeLeave = useCallback(() => {
    if (metChromeLeaveTimer.current == null) return;
    clearTimeout(metChromeLeaveTimer.current);
    metChromeLeaveTimer.current = null;
  }, []);

  const enterMetChrome = useCallback(() => {
    clearMetChromeLeave();
    if (metHoverArmed) setAddHovering(true);
  }, [clearMetChromeLeave, metHoverArmed]);

  const leaveMetChrome = useCallback(() => {
    clearMetChromeLeave();
    metChromeLeaveTimer.current = setTimeout(() => {
      setAddHovering(false);
      metChromeLeaveTimer.current = null;
    }, 140);
  }, [clearMetChromeLeave]);

  useEffect(() => () => clearMetChromeLeave(), [clearMetChromeLeave]);

  /**
   * Focus follows the toggle into whichever panel just became active.
   *
   * Panels stay mounted (Drawesome-style), so a ref-on-mount callback would
   * never re-fire on expand/collapse. Drive focus from `activePanel` instead.
   *
   * "bar" lands on the prompt (no chrome ring — textarea opts out of the
   * gallery focus treatment). Never focus the + toggle on expand: that painted
   * a focus-visible ring and force-opened the Met tooltip as if the visitor
   * had tabbed there.
   */
  const focusComposerTarget = useCallback((target: "bar" | "pen") => {
    if (target === "bar") {
      promptRef.current?.focus({ preventScroll: true });
      return;
    }
    const panel = panelRefs.current.get(
      isGeneratingRef.current ? "generating" : "actions",
    );
    panel?.querySelector("button")?.focus();
  }, []);

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
   * Stepped dismiss: picker → whole bar.
   *
   * Inspiration stays selected across collapse; only the composer shell folds
   * to the pen / Generating / download pill. Re-expanding restores the full
   * SelectedInspirationCard when a work is still chosen — there is no
   * intermediate artwork-peek state. Generation always uses the minimized
   * pill (never an expanded shell mid-run).
   */
  const dismissComposer = useCallback(
    (moveFocus: boolean) => {
      if (pickerOpen) {
        setPickerOpen(false);
        if (moveFocus) pickerToggleRef.current?.focus();
        return;
      }
      collapseBar(moveFocus);
    },
    [pickerOpen, collapseBar],
  );

  const selectInspiration = (artwork: MetArtwork | null) => {
    setInspiration(artwork);
    if (artwork) setPickerOpen(false);
  };

  const openInspirationPicker = useCallback(() => {
    search.refreshCurated();
    setPickerOpen(true);
  }, [search.refreshCurated]);

  const toggleInspirationPicker = useCallback(() => {
    setPickerOpen((open) => {
      if (!open) search.refreshCurated();
      return !open;
    });
  }, [search.refreshCurated]);

  /**
   * Apply the last successful generate for a canvas (or blank if none).
   * Used when switching hangs and when opening the composer to edit.
   */
  const applyGenerationContext = useCallback(
    (context: PaintingGenerationContext | undefined) => {
      if (context) {
        setPrompt(context.prompt);
        setInspiration(context.inspiration);
      } else {
        setPrompt("");
        setInspiration(null);
      }
      setPickerOpen(false);
    },
    [],
  );

  const expandBar = (e?: { detail?: number }) => {
    // Stay on the Generating pill while a run is in flight — never reopen
    // the full composer shell mid-generate.
    if (isGeneratingRef.current) return;
    // Pointer expand must not steal focus onto + / the prompt — that painted a
    // focus-visible ring (and opened the Met tooltip via addHovering) as if the
    // visitor had tabbed in. Keyboard activation still needs a landing place
    // once the pen goes inert; the prompt has no chrome ring.
    const fromKeyboard = e != null && e.detail === 0;
    pendingFocus.current = fromKeyboard ? "bar" : null;
    if (!fromKeyboard && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Clear any leftover reveal, and (for pointer expand) disarm Met hover so
    // chrome that morphs under the cursor cannot auto-open the stack / tooltip.
    clearMetChromeLeave();
    setAddHovering(false);
    if (!fromKeyboard) setMetHoverArmed(false);
    applyGenerationContext(generationContextRef.current);
    setExpanded(true);
  };

  useEffect(() => {
    if (openSignal === 0) return;
    pendingFocus.current = null;
    clearMetChromeLeave();
    setAddHovering(false);
    setMetHoverArmed(false);
    // Only keyed on openSignal — generationContext updates after a successful
    // generate must not re-expand the bar we just folded to the Generating pill.
    // Mid-run: stay collapsed on the Generating pill (never expand).
    if (isGeneratingRef.current) {
      setExpanded(false);
      setPickerOpen(false);
      return;
    }
    applyGenerationContext(generationContextRef.current);
    setExpanded(true);
  }, [openSignal, applyGenerationContext, clearMetChromeLeave]);

  // Re-arm Met hover chrome after the first real pointer move post-expand.
  useEffect(() => {
    if (metHoverArmed) return;
    const arm = () => setMetHoverArmed(true);
    window.addEventListener("pointermove", arm, { once: true });
    return () => window.removeEventListener("pointermove", arm);
  }, [metHoverArmed]);

  useEffect(() => {
    if (focusedIdRef.current === focusedId) return;
    focusedIdRef.current = focusedId;
    // Drop the previous hang's draft; load this hang's stored generate if any.
    // Preserve expand/collapse across switches only when the incoming hang is
    // idle — a generating hang always forces the minimized Generating pill.
    setError(null);
    setPickerOpen(false);
    applyGenerationContext(generationContextRef.current);
    if (isGeneratingRef.current) {
      setExpanded(false);
      if (pendingFocus.current === "bar") pendingFocus.current = null;
    }
  }, [focusedId, applyGenerationContext]);

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
      const target = e.target;
      if (!(target instanceof Element)) return;
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
    const paintingId = focusedId;
    setError(null);
    setSubmitPending(true);
    setPickerOpen(false);
    // Fold to the Generating pill immediately — same collapsed shell as an
    // outside click, so the room stays clear while the canvas shimmers.
    // Don't move focus onto the pill: that paints a focus-visible ring flash
    // right as "Generating…" appears. Blur instead; keyboard users can Tab
    // to the pill later.
    collapseBar(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    try {
      await onGenerate(next, inspiration ?? undefined);
      // Keep prompt + inspiration so re-expanding to edit shows the same
      // context; parent also stores them keyed by painting id.
    } catch (err) {
      // Only surface errors on the canvas that kicked off this run — navigating
      // away mid-flight should not dump another hang's failure onto the new one.
      if (focusedIdRef.current === paintingId) {
        setError(err instanceof Error ? err.message : "Generation failed");
        pendingFocus.current = "bar";
        setExpanded(true);
      }
    } finally {
      if (focusedIdRef.current === paintingId) {
        setSubmitPending(false);
      }
    }
  };

  // Generating wins over expanded — the full shell must never be the active
  // panel while a run is in flight (render-time force-collapse is the primary
  // guard; this is defense in depth for one-frame races).
  const activePanel: ComposerPanelId = isGenerating
    ? "generating"
    : expanded
      ? "expanded"
      : "actions";

  const composerMaximized = activePanel === "expanded";
  useEffect(() => {
    onExpandedChange?.(composerMaximized);
  }, [composerMaximized, onExpandedChange]);

  /* ─────────────────────────────────────────────────────────
   * COMPOSER MORPH (Drawesome MorphBar)
   *
   * One continuous shell animates width/height to the active panel's
   * measured size. Panels stay mounted, stack in the clip, and cross-fade
   * with blur + scale. Swapping two differently-sized shells (old approach)
   * read as a double-exposure; this is one object changing shape.
   *
   * After the size settle, the expanded panel drops filter/scale so the
   * native caret isn't painted through a compositor layer.
   * ───────────────────────────────────────────────────────── */
  const shellTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: COMPOSER_MORPH_MS.expand / 1000,
        ease: [0.22, 0.9, 0.16, 1] as const,
      };

  useLayoutEffect(() => {
    const measure = () => {
      const panel = panelRefs.current.get(activePanel);
      const root = rootRef.current;
      if (!panel || !root) return;
      const expandedW = root.clientWidth;
      if (activePanel === "expanded") {
        setMorphSize({ w: expandedW, h: panel.scrollHeight });
      } else {
        setMorphSize({ w: panel.scrollWidth, h: panel.scrollHeight });
      }
    };

    measure();
    const armId = requestAnimationFrame(() => {
      morphSettled.current = true;
      setMorphInstant(false);
    });

    const panel = panelRefs.current.get(activePanel);
    const root = rootRef.current;
    if (!panel || typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(armId);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    if (root) ro.observe(root);
    return () => {
      cancelAnimationFrame(armId);
      ro.disconnect();
    };
  }, [activePanel, canDownload, error, inspiration, isGenerating, prompt, promptMultiline]);

  // When the active panel flips, drop settled in the same render pass so the
  // first painted frame never applies caret-safe `transition: none` to the
  // incoming expanded panel (that froze opacity/scale at 1 and skipped the
  // blur cross-fade).
  const [settledForPanel, setSettledForPanel] = useState(activePanel);
  if (settledForPanel !== activePanel) {
    setSettledForPanel(activePanel);
    if (!reduceMotion && !morphInstant) {
      setMorphSettledFlag(false);
    }
  }

  // Restore caret-safe styles after the width/height transition settles.
  useEffect(() => {
    if (reduceMotion || morphInstant || morphSettledFlag) {
      if (reduceMotion || morphInstant) setMorphSettledFlag(true);
      return;
    }
    const shell = morphRef.current;
    if (!shell) {
      setMorphSettledFlag(true);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setMorphSettledFlag(true);
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== shell) return;
      if (e.propertyName !== "width" && e.propertyName !== "height") return;
      finish();
    };
    shell.addEventListener("transitionend", onEnd);
    const fallbackMs =
      activePanel === "expanded"
        ? COMPOSER_MORPH_MS.expand + 40
        : COMPOSER_MORPH_MS.collapse + 40;
    const fallback = window.setTimeout(finish, fallbackMs);
    return () => {
      shell.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [activePanel, morphInstant, morphSettledFlag, reduceMotion]);

  const setPanelRef = useCallback(
    (id: ComposerPanelId) => (node: HTMLDivElement | null) => {
      if (node) panelRefs.current.set(id, node);
      else panelRefs.current.delete(id);
    },
    [],
  );

  useLayoutEffect(() => {
    for (const [id, el] of panelRefs.current) {
      if (id === activePanel) el.removeAttribute("inert");
      else el.setAttribute("inert", "");
    }
  }, [activePanel]);

  // Panels are always mounted — move focus after the active one flips.
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    focusComposerTarget(target);
  }, [activePanel, focusComposerTarget]);

  const expandedSoftRadius =
    activePanel === "expanded" && promptMultiline;
  // Target width for the expanded panel — fixed for the whole morph so the
  // prompt lays out at final size while the shell unfurls around it.
  const expandedWidth = rootRef.current?.clientWidth ?? morphSize?.w ?? 0;
  // Stack clip must match the shell's bottom corners (stadium or soft 28)
  // or cards/shadows paint in the crescent under the rounded edge.
  const composerClipRadius = expandedSoftRadius
    ? 28
    : morphSize
      ? morphSize.h / 2
      : 29;
  const morphStyle: CSSProperties =
    morphSize === null
      ? { visibility: "hidden", borderRadius: 9999 }
      : {
          width: morphSize.w,
          height: morphSize.h,
          // Stadium like prod while one line; soft radius only when wrapped.
          borderRadius: expandedSoftRadius ? 28 : 9999,
          ["--composer-expanded-w" as string]: `${expandedWidth || morphSize.w}px`,
          transition:
            reduceMotion || morphInstant || !morphSettled.current
              ? "none"
              : undefined,
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
      className="pointer-events-auto relative flex w-full max-w-[590px] justify-center"
      style={
        {
          ["--composer-clip-radius" as string]: `${composerClipRadius}px`,
        } as CSSProperties
      }
    >
      <style>{FILM_DOT_STYLE}</style>
      <style>{COMPOSER_MORPH_STYLE}</style>
      {/* A sibling of the panel rather than a child of it, because a child
          cannot be painted behind its own parent's background. */}
      <AnimatePresence initial={false}>
        {canShowRestingStack && (
          // Keep the fan mounted while eligible so leave can roll down instead
          // of popping off. Instant unmount when eligibility ends (generate /
          // picker / inspiration) so it never lingers over Generating….
          // z-0 under the opaque morph (z-10) so the pill body covers the fan;
          // RestingStack's rounded clip kills the corner-crescent leak.
          <motion.div
            key="stack"
            className="pointer-events-none absolute inset-0 z-0"
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
          >
            <RestingStack
              artworks={search.artworks}
              controls={pickerId}
              revealed={addHovering}
              tooltipArmed={metHoverArmed}
              reduceMotion={Boolean(reduceMotion)}
              onOpen={openInspirationPicker}
              onPointerEnter={enterMetChrome}
              onPointerLeave={leaveMetChrome}
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
        {expanded && !pickerOpen && inspiration && (
          <SelectedInspirationCard
            key="selected-inspiration"
            artwork={inspiration}
            onChangeInspiration={openInspirationPicker}
            onClearInspiration={() => setInspiration(null)}
            transition={shellTransition}
          />
        )}
      </AnimatePresence>
      {/*
       * One shell, measured size, clipped panels — Drawesome MorphBar.
       * Content cross-fades inside; the chrome never swaps for a second pill.
       */}
      <div
        ref={morphRef}
        className="gallery-composer-morph relative z-10 rounded-full"
        data-reduce-motion={reduceMotion || undefined}
        data-instant={morphInstant || undefined}
        data-settled={morphSettledFlag && !multilineMorphing ? "" : undefined}
        data-morph-to={activePanel}
        data-multiline={
          activePanel === "expanded" && promptMultiline ? "" : undefined
        }
        data-multiline-morph={multilineMorphing ? "" : undefined}
        style={morphStyle}
      >
        <div className="gallery-composer-morph__clip">
          <ComposerMorphPanel
            id="expanded"
            active={activePanel === "expanded"}
            setRef={setPanelRef}
          >
            <form onSubmit={submit} className="flex flex-col">
              {/*
                Single-line: + | prompt | Generate (one row).
                Multiline: prompt full-width on top (left-aligned with +);
                footer row keeps + left / Generate right (ChatGPT-style).
                Grid keeps the textarea mounted across the mode switch.
              */}
              <LayoutGroup id="gallery-composer-prompt">
                <div
                  className={`grid px-2.5 py-[9px] ${
                    promptMultiline
                      ? "grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-end gap-x-2 gap-y-1"
                      : "grid-cols-[auto_1fr_auto] items-center gap-x-1"
                  }`}
                >
                  <motion.div
                    layout={!reduceMotion}
                    className={
                      promptMultiline
                        ? "col-start-1 row-start-2"
                        : "col-start-1 row-start-1"
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.28,
                            ease: [0.19, 1, 0.22, 1],
                          }
                    }
                  >
                    {canShowRestingStack ? (
                      // Met tip lives on RestingStack (portaled above the fan);
                      // overflow:hidden on the morph shell would clip it here.
                      <button
                        ref={pickerToggleRef}
                        type="button"
                        onPointerEnter={enterMetChrome}
                        onPointerLeave={leaveMetChrome}
                        onFocus={(e) => {
                          if (e.currentTarget.matches(":focus-visible")) {
                            clearMetChromeLeave();
                            setAddHovering(true);
                          }
                        }}
                        onBlur={() => {
                          clearMetChromeLeave();
                          setAddHovering(false);
                        }}
                        onClick={toggleInspirationPicker}
                        aria-expanded={pickerOpen}
                        aria-controls={pickerId}
                        aria-label={
                          pickerOpen
                            ? "Hide inspiration picker"
                            : "Get inspired by The Met"
                        }
                        className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
                      >
                        <PlusIcon className="size-[15px]" strokeWidth={1.25} />
                      </button>
                    ) : (
                      <Tooltip
                        label={addTooltip}
                        position="top"
                        offset={10}
                        portal
                        disabled={!metHoverArmed}
                      >
                        <button
                          ref={pickerToggleRef}
                          type="button"
                          onPointerEnter={() => {
                            if (metHoverArmed && !addDisabled) enterMetChrome();
                          }}
                          onPointerLeave={leaveMetChrome}
                          onFocus={(e) => {
                            if (
                              !addDisabled &&
                              e.currentTarget.matches(":focus-visible")
                            ) {
                              clearMetChromeLeave();
                              setAddHovering(true);
                            }
                          }}
                          onBlur={() => {
                            clearMetChromeLeave();
                            setAddHovering(false);
                          }}
                          onClick={() => {
                            if (addDisabled) return;
                            toggleInspirationPicker();
                          }}
                          aria-expanded={pickerOpen}
                          aria-controls={pickerId}
                          aria-label={
                            pickerOpen
                              ? "Hide inspiration picker"
                              : "Get inspired by The Met"
                          }
                          disabled={addDisabled}
                          className={`grid size-10 shrink-0 place-items-center rounded-full bg-transparent transition-colors ${
                            addDisabled
                              ? "cursor-not-allowed text-zinc-300"
                              : "cursor-pointer text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                          } ${GALLERY_FOCUS_RING}`}
                        >
                          <PlusIcon
                            className="size-[15px]"
                            strokeWidth={1.25}
                          />
                        </button>
                      </Tooltip>
                    )}
                  </motion.div>
                  {/*
                    Wrapper owns grid growth. Textareas keep a cols-based
                    intrinsic size that can refuse to fill the row; the wrapper
                    + w-full forces wrap at the real + → Generate gap (single)
                    or full composer width (multiline).
                  */}
                  <div
                    className={
                      promptMultiline
                        ? "col-span-3 row-start-1 min-w-0"
                        : "col-start-2 row-start-1 min-w-0"
                    }
                  >
                    <textarea
                      ref={promptRef}
                      rows={1}
                      cols={1}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={onPromptKeyDown}
                      onWheel={(e) => e.stopPropagation()}
                      placeholder="Describe your artwork…"
                      disabled={isGenerating}
                      // No inner focus ring — the outer composer pill is the
                      // surface. Single-row with + / Generate until content wraps;
                      // resizePromptField grows height only then. Enter submits.
                      className={`gallery-focus box-border block min-h-10 w-full resize-none overflow-hidden break-words border-0 bg-transparent py-2 text-base leading-6 text-zinc-900 caret-zinc-900 outline-none ring-0 placeholder:text-zinc-300 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60 [overflow-wrap:anywhere] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                        promptMultiline
                          ? `${PROMPT_MULTILINE_PL} pr-0`
                          : "px-0"
                      }`}
                      aria-label="Artwork prompt"
                    />
                  </div>
                  <motion.div
                    layout={!reduceMotion}
                    className={
                      promptMultiline
                        ? "col-start-3 row-start-2"
                        : "col-start-3 row-start-1"
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.28,
                            ease: [0.19, 1, 0.22, 1],
                          }
                    }
                  >
                    <button
                      type="submit"
                      disabled={isGenerating || !prompt.trim() || blocked}
                      className={`shrink-0 rounded-full bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                    >
                      {isGenerating ? (
                        <GeneratingLabel
                          reduceMotion={Boolean(reduceMotion)}
                        />
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </motion.div>
                </div>
              </LayoutGroup>
              <p aria-live="polite" className="sr-only">
                {isGenerating ? "Generating your image…" : ""}
              </p>
              {error && (
                <p className="px-3 pb-2 text-base text-red-600" role="alert">
                  {error}
                </p>
              )}
            </form>
          </ComposerMorphPanel>

          <ComposerMorphPanel
            id="generating"
            active={activePanel === "generating"}
            setRef={setPanelRef}
          >
            <div className="inline-flex items-center gap-1 p-1 text-zinc-700">
              <div
                role="status"
                aria-live="polite"
                className="rounded-full px-4 py-2 text-sm font-medium"
              >
                <GeneratingLabel reduceMotion={Boolean(reduceMotion)} />
              </div>
            </div>
          </ComposerMorphPanel>

          <ComposerMorphPanel
            id="actions"
            active={activePanel === "actions"}
            setRef={setPanelRef}
          >
            <div className="flex items-center gap-1 p-1 leading-none text-zinc-500">
              <Tooltip label="Open prompt" position="top" offset={10} portal>
                <button
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
                <Tooltip label="Download image" position="top" offset={10} portal>
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
            </div>
          </ComposerMorphPanel>
        </div>
      </div>
    </div>
  );
}

function ComposerMorphPanel({
  id,
  active,
  setRef,
  children,
}: {
  id: ComposerPanelId;
  active: boolean;
  setRef: (id: ComposerPanelId) => (node: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={setRef(id)}
      data-kind={id}
      data-active={active || undefined}
      aria-hidden={active ? undefined : true}
      className="gallery-composer-morph__panel"
    >
      {children}
    </div>
  );
}

/** Rotating quirky phrases + DS film-dot-pulse — same cadence as Film. */
function GeneratingLabel({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <RotatingLoadingText
      phrases={GALLERY_LOADING_PHRASES}
      reduceMotion={reduceMotion}
      aria-label="Generating"
    />
  );
}

function SelectedInspirationCard({
  artwork,
  onChangeInspiration,
  onClearInspiration,
  transition,
}: {
  artwork: MetArtwork;
  onChangeInspiration: () => void;
  onClearInspiration: () => void;
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
      className={`absolute bottom-[calc(100%-6px)] left-1/2 z-0 flex w-[calc(100%-38px)] -translate-x-1/2 gap-4 rounded-t-[34px] rounded-b-none border border-black/5 bg-white/95 px-4 pt-4 pb-5 pr-12 text-left shadow-soft backdrop-blur-md ${
        titleWraps ? "items-start" : "items-center"
      }`}
    >
      {src && (
        <button
          type="button"
          onClick={onChangeInspiration}
          aria-label="Change inspiration"
          className={`size-24 shrink-0 cursor-pointer overflow-hidden rounded-[18px] bg-white shadow-md transition-opacity hover:opacity-90 ${GALLERY_FOCUS_RING}`}
        >
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
        </button>
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
          <p className="truncate text-base leading-snug text-zinc-500">
            {meta}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClearInspiration}
        aria-label="Remove inspiration"
        className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:bg-zinc-200/70 ${GALLERY_FOCUS_RING}`}
      >
        <CloseIcon size="14px" strokeWidth={1.25} />
      </button>
    </motion.div>
  );
}

/**
 * The inspiration strip, put away — a fan that rolls up from behind the
 * composer when the + is hovered / :focus-visible.
 *
 * Stays mounted while the composer is eligible so leave can roll down; stays
 * open while the pointer is over the fan so cards remain clickable. Instantly
 * unmounted when eligibility ends (generate / picker / selection).
 */
function RestingStack({
  artworks,
  controls,
  revealed,
  tooltipArmed,
  reduceMotion,
  onOpen,
  onPointerEnter,
  onPointerLeave,
}: {
  artworks: MetArtwork[];
  controls: string;
  revealed: boolean;
  /** False while expand-under-cursor would flash the Met tip. */
  tooltipArmed: boolean;
  reduceMotion: boolean;
  onOpen: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
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
    // While curated data is loading or Met returned nothing, the composer's
    // + still opens the picker — no empty fan.
    return null;
  }

  const fan = STACK_CARDS.slice(STACK_CARDS.length - cards.length);
  // Short lift — clear the rounded bottom clip; resting y is 0–14.
  const rollPx = reduceMotion ? 0 : 42;
  const showMetTip = revealed && tooltipArmed;

  return (
    /*
     * Clip shell matches the composer footprint (`left-0 right-0`) with the
     * same bottom corner radius as the pill. A flat `overflow-hidden` bottom
     * left crescents under the stadium curve where cards/shadows could peek;
     * rounding the clip to `--composer-clip-radius` cuts those crescents.
     * Headroom (`+9rem`) lets the fan + hover lift paint upward. Fan origin
     * sits at `left-2.5` with the + inset so lean/shadow stay inside the clip.
     * Stack stays z-0 under the opaque morph (z-10) for body occlusion.
     */
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 h-[calc(100%+9rem)] overflow-hidden"
      style={{
        borderBottomLeftRadius: "var(--composer-clip-radius, 1.8125rem)",
        borderBottomRightRadius: "var(--composer-clip-radius, 1.8125rem)",
      }}
    >
      <Tooltip
        label="Get inspired by The Met"
        position="top"
        // Nudge above the fan a bit more than the default stack gap.
        offset={16}
        // forceOpen is otherwise instant; 2× Tooltip hover default (400→800).
        delay={800}
        portal
        // Stack clip + morph shell both overflow:hidden — portal to body.
        // forceOpen tracks +/fan hover so the tip sits above the images.
        disabled={!tooltipArmed}
        forceOpen={showMetTip}
        className={`absolute bottom-[calc(100%-2.95rem-9rem)] left-2.5 ${
          revealed ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <button
            type="button"
            onClick={onOpen}
            onFocus={(e) =>
              setFocused(e.currentTarget.matches(":focus-visible"))
            }
            onBlur={() => setFocused(false)}
            aria-expanded={false}
            aria-controls={controls}
            aria-hidden={!revealed && !focused}
            tabIndex={revealed ? 0 : -1}
            className={`group relative h-25 w-[154px] overflow-visible rounded-xl ${GALLERY_FOCUS_RING}`}
          >
            <span className="sr-only">Find inspiration in The Met</span>
            <span className="absolute inset-0 block overflow-visible">
              {/* Painted back to front, so the first work in the strip — the most
                recognisable one — is the square card on top of the pile. */}
              {[...cards].reverse().map(({ artwork, src }, i) => {
                const { rotate, x, y, hoverY, hoverRotate } = fan[i]!;
                const trimScale = metImageTrimScale(artwork.objectID);
                // Hover lift stays on the clip box; fan angle is on motion so
                // enter can rotate from a flat stack into the resting fan.
                // Overflow-hidden must ride the rotated ancestor (motion.span)
                // or axis-aligned clipping shears the fan tops.
                const hoverDelta = hoverRotate - rotate;
                // Near-zero stagger — one cohesive fan, not a cascade.
                const stagger = 0.008 * (revealed ? i : fan.length - 1 - i);
                return (
                  <motion.span
                    // The same id the strip tile carries, so this card and that
                    // tile are one node to framer-motion and it moves between the
                    // two layouts instead of one fading out as the other fades in.
                    layoutId={tileLayoutId(artwork.objectID)}
                    key={artwork.objectID}
                    initial={false}
                    animate={{
                      x,
                      y: revealed ? y : y + rollPx,
                      rotate: revealed ? rotate : 0,
                      opacity: revealed ? 1 : 0,
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.18,
                            ease: [0.22, 0.9, 0.16, 1],
                            delay: stagger,
                          }
                    }
                    className="absolute bottom-0 left-0 block overflow-visible"
                  >
                    <span
                      style={
                        {
                          "--hover-y": `${hoverY}px`,
                          "--hover-delta": `${hoverDelta}deg`,
                          // Lift only while revealed so motion can own fan rotate-in.
                          "--lift-transform": "translateY(var(--hover-y))",
                          "--hover-transform":
                            "translateY(var(--hover-y)) rotate(var(--hover-delta))",
                        } as CSSProperties
                      }
                      className={`block overflow-hidden border-2 border-white/20 bg-white shadow-lg transition-transform duration-200 ease-out ${
                        revealed
                          ? "[transform:var(--lift-transform)]"
                          : "[transform:none]"
                      } group-hover:[transform:var(--hover-transform)] group-focus-visible:[transform:var(--hover-transform)] motion-reduce:transition-none motion-reduce:[transform:none] ${TILE_SHAPE}`}
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
        </div>
      </Tooltip>
    </div>
  );
}
