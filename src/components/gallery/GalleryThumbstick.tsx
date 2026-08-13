"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons/Chevron";
import { PlusIcon } from "@/components/library/icons";
import { ICON_STROKE_WIDTH } from "@/components/shared/iconSizes";
import { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import {
  GALLERY_PAINTINGS,
  adjacentPaintingId,
  type GalleryPainting,
} from "./galleryPaintings";
import {
  NAV_REPEAT_IDLE,
  ZOOM_STEP,
  type NavRepeatState,
  advanceNavRepeat,
  applyDeadZone,
  clampKnob,
  zoomDeltaFor,
} from "./thumbstickInput";

type GalleryThumbstickProps = {
  focusedId: string;
  onSelect: (id: string) => void;
  /**
   * The camera's clamped zoom path, called with a signed delta many times a
   * second. Clamping stays on the camera's side so the stick cannot dolly
   * through a wall or breach the near plane however hard it is pushed.
   *
   * Incremental rather than absolute deliberately. An absolute target would
   * have to be accumulated here, and an accumulator keeps winding past the
   * limit while the stick is held at a bound — so pulling back would spend
   * seconds unwinding before the camera moved. Reading the live clamped value
   * each frame means a bound is a wall, and reversing takes effect at once.
   */
  onZoomBy: (delta: number) => void;
  /**
   * When true, hide on viewports below `md` (768px) — e.g. while the composer
   * is maximized and would otherwise cover / peek behind the stick.
   * Desktop (`md+`) stays visible.
   */
  hideOnMobile?: boolean;
  /** Hang list for left/right stepping. Defaults to the blank 12-hang room. */
  paintings?: GalleryPainting[];
};

/**
 * Match the collapsed composer actions pill padding (`p-1` outside the
 * circular icon buttons). Ring air used to be ~6.5px on each side of a 26px
 * wash, which ballooned the outer disc; 4px pad + the same wash keeps the
 * stick compact (106px across, was 116). +/− share one CSS size so the
 * crossbar and minus stroke match optically; chevrons run larger.
 */
const GLYPH_BOX = 26;
const GLYPH_PAD = 4; // composer actions `p-1`
const KNOB_RADIUS = 19;
/** Ring band between knob edge and outer rim — glyphs sit centered in this. */
const RING_BAND = GLYPH_BOX + GLYPH_PAD * 2;
/** Base radius from knob + matched ring. */
const BASE_RADIUS = KNOB_RADIUS + RING_BAND;
const MAX_TRAVEL = BASE_RADIUS - KNOB_RADIUS - 5;
/**
 * Axis glyphs share one optical weight. Library `PlusIcon` draws nearly
 * edge-to-edge in its 24 viewBox; the chevron path is a much smaller mark,
 * so the same CSS size makes + look oversized. Chevrons run larger; +/− both
 * use 13px so the minus bar matches the plus crossbar (hit wash stays 26px).
 */
const AXIS_CROSS_ICON_CLASS = "block size-[13px] shrink-0";
const CHEVRON_SIZE = "20px";

function AxisMinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={AXIS_CROSS_ICON_CLASS}
      aria-hidden
    >
      <path
        // Same horizontal span as PlusIcon (2→22), sized identically so −
        // matches the + crossbar optically.
        d="M2 12H22"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Where each axis button sits, and how much of the base it may claim.
 *
 * The numbers are forced by the geometry rather than chosen. The base is
 * `BASE_RADIUS * 2` across with a `KNOB_RADIUS * 2` knob in the middle, which
 * leaves a `RING_BAND` band per side — wide enough that a `GLYPH_BOX` wash
 * can sit centred with `GLYPH_PAD` air to the knobs and the rim (same 4px
 * the composer actions pill uses). Each target still stops dead at the
 * knob's edge (`RING_BAND` from the base's own edge) and makes up the area
 * outwards, past the rim into empty room. That yields pressable area against
 * the glyph, no overlap between the four, and a knob whose drag region is
 * untouched — the one thing that must not be traded away, since dragging is
 * still the only way to zoom and step continuously.
 *
 * Each arm is pinned on both ends of its short side rather than given a length,
 * which is the difference between four targets that meet at the corners and
 * four that overlap there. Written as `bottom: -14; height: 41`, an arm's far
 * edge is derived from the padding box while its near edge is derived from the
 * border box, and the base's 1px rim puts the two 2px out of step — enough that
 * `Next painting` and `Zoom out` each claimed the same 2×2 corner and whichever
 * painted last took the press. Anchoring both ends to the same box removes the
 * discrepancy by construction instead of paying it off with a magic number.
 */
const AXIS_INSET = RING_BAND;
const AXIS_OUTSET = 14;

const AXIS_BOX: Record<AxisName, React.CSSProperties> = {
  left: {
    left: -AXIS_OUTSET,
    top: AXIS_INSET,
    bottom: AXIS_INSET,
    width: AXIS_INSET + AXIS_OUTSET,
  },
  right: {
    right: -AXIS_OUTSET,
    top: AXIS_INSET,
    bottom: AXIS_INSET,
    width: AXIS_INSET + AXIS_OUTSET,
  },
  top: {
    top: -AXIS_OUTSET,
    left: AXIS_INSET,
    right: AXIS_INSET,
    height: AXIS_INSET + AXIS_OUTSET,
  },
  bottom: {
    bottom: -AXIS_OUTSET,
    left: AXIS_INSET,
    right: AXIS_INSET,
    height: AXIS_INSET + AXIS_OUTSET,
  },
};

/** Centres each glyph in the ring band (equal pad to knob and outer rim). */
const AXIS_GLYPH: Record<AxisName, string> = {
  left: "top-1/2 -translate-y-1/2",
  right: "top-1/2 -translate-y-1/2",
  top: "left-1/2 -translate-x-1/2",
  bottom: "left-1/2 -translate-x-1/2",
};

const AXIS_GLYPH_INSET: Record<AxisName, React.CSSProperties> = {
  left: { right: GLYPH_PAD },
  right: { left: GLYPH_PAD },
  top: { bottom: GLYPH_PAD },
  bottom: { top: GLYPH_PAD },
};

type AxisName = "left" | "right" | "top" | "bottom";

/**
 * One axis of the stick, as a button.
 *
 * The hit area is invisible and larger than the mark; the wash on hover is
 * sized to the glyph instead, so the feedback lands where the eye is rather
 * than exposing how far the target really reaches. `stopPropagation` on
 * pointerdown is what keeps a press from also being read as the start of a
 * drag by the base underneath.
 */
function AxisButton({
  axis,
  label,
  onPress,
  children,
}: {
  axis: AxisName;
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onPress}
      style={AXIS_BOX[axis]}
      // Hit area stays the large arm; focus ring paints on the circular glyph
      // wash below so keyboard focus matches the mark (not the tall rect).
      className="group absolute gallery-focus focus-visible:outline-none"
    >
      <span
        aria-hidden
        style={{ ...AXIS_GLYPH_INSET[axis], width: GLYPH_BOX, height: GLYPH_BOX }}
        className={`absolute grid place-items-center rounded-full text-zinc-400 transition-colors duration-150 group-hover:bg-zinc-900/[0.06] group-hover:text-zinc-600 group-active:bg-zinc-900/[0.12] group-focus-visible:ring-2 group-focus-visible:ring-zinc-300 motion-reduce:transition-none ${AXIS_GLYPH[axis]}`}
      >
        {children}
      </span>
    </button>
  );
}

/**
 * Roblox-style thumbstick: push left or right to step between hangs, push up or
 * down to zoom, release to spring back.
 *
 * Drag-only, and since the on-screen arrow and zoom buttons were removed this
 * is the only pointer affordance for either. That is acceptable only because
 * the keyboard reaches both independently — arrow keys step between hangs and
 * ⌘/Ctrl with plus, minus or zero drives zoom, both bound in `useGalleryCamera`
 * and neither routed through this component. Anything added here that the
 * keyboard cannot also do would strand keyboard and assistive-tech users.
 */
export default function GalleryThumbstick({
  focusedId,
  onSelect,
  onZoomBy,
  hideOnMobile = false,
  paintings = GALLERY_PAINTINGS,
}: GalleryThumbstickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  /*
   * Everything the animation loop touches lives in refs. The loop outlives any
   * one render, and routing a 60Hz pointer stream through React state would
   * re-render the page every frame to move a knob a few pixels.
   */
  const pointerIdRef = useRef<number | null>(null);
  const vectorRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const navRef = useRef<NavRepeatState>(NAV_REPEAT_IDLE);

  const focusedIdRef = useRef(focusedId);
  focusedIdRef.current = focusedId;
  const paintingsRef = useRef(paintings);
  paintingsRef.current = paintings;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onZoomByRef = useRef(onZoomBy);
  onZoomByRef.current = onZoomBy;

  const moveKnob = useCallback((x: number, y: number, animate: boolean) => {
    const knob = knobRef.current;
    if (!knob) return;
    knob.style.transition = animate
      ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";
    knob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  /**
   * Return to rest.
   *
   * Wired to release, cancel, lost capture, window blur and tab hide alike.
   * Each of those on its own leaves a path where the pointer is gone but the
   * loop keeps walking through paintings, and a control that carries on
   * navigating after you let go is the one failure this must not have.
   */
  const endDrag = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    vectorRef.current = { x: 0, y: 0 };
    navRef.current = NAV_REPEAT_IDLE;

    const base = baseRef.current;
    const pointerId = pointerIdRef.current;
    if (base && pointerId !== null) {
      try {
        if (base.hasPointerCapture(pointerId)) {
          base.releasePointerCapture(pointerId);
        }
      } catch {
        /* the pointer is already gone; nothing to release */
      }
    }
    pointerIdRef.current = null;
    moveKnob(0, 0, true);
    setActive(false);
  }, [moveKnob]);

  useEffect(() => {
    if (hideOnMobile) endDrag();
  }, [hideOnMobile, endDrag]);

  const tick = useCallback((now: number) => {
    // Clamped so a backgrounded tab resuming after seconds does not cash in
    // one enormous frame as a burst of navigation.
    const deltaMs = Math.min(now - lastTickRef.current, 100);
    lastTickRef.current = now;
    const { x, y } = vectorRef.current;

    if (y !== 0) onZoomByRef.current(zoomDeltaFor(y, deltaMs));

    const { state, step } = advanceNavRepeat(navRef.current, x, deltaMs);
    navRef.current = state;
    if (step !== 0) {
      onSelectRef.current(
        adjacentPaintingId(focusedIdRef.current, step, paintingsRef.current),
      );
    }

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    // Capture so the drag survives the pointer leaving the base, which it will
    // constantly: the whole gesture is about pushing past the edge.
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    moveKnob(0, 0, false);
    lastTickRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const knob = clampKnob(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2),
      MAX_TRAVEL,
    );
    moveKnob(knob.x, knob.y, false);
    vectorRef.current = {
      x: applyDeadZone(knob.x / MAX_TRAVEL),
      y: applyDeadZone(knob.y / MAX_TRAVEL),
    };
  };

  useEffect(() => {
    if (!active) return;
    const onBlur = () => endDrag();
    const onVisibility = () => {
      if (document.hidden) endDrag();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, endDrag]);

  useEffect(() => endDrag, [endDrag]);

  return (
    <div
      data-gallery-no-drag
      // Persistent room furniture: nudging the view to see the wall you are
      // about to fill must not fold the composer away behind you.
      {...{ [KEEP_BAR_OPEN_ATTR]: "" }}
      /*
       * Right edge on wide screens, and never a right-hand corner: the info
       * button holds the top one, and the bottom one is where the action bar
       * grows as its results grid opens.
       *
       * The vertical anchor differs by width because the room does. Wide, the
       * hangs sit in a band across the middle and leave clear floor beneath
       * them, so the stick drops below the canvases rather than sitting
       * concentric with the right-hand one, where it read as a sticker stuck to
       * the painting. It is out of the bar's way there for a reason that does
       * not depend on the bar's height: the bar is centred and capped at
       * `max-w-xl`, so at this width it never reaches this column at all.
       *
       * Narrow, the composer takes the bottom edge and the picker can grow up
       * from it, so the stick becomes nearby room navigation: bottom-right, just
       * above the composer, and below the composer's own stack. That keeps it
       * reachable without letting it float over the modal picker contents.
       *
       * Wide, the right and bottom insets agree so the stick sits in its corner
       * squarely — a corner only looks deliberate when both of its gaps match.
       * They agree at 4rem rather than the 10rem they used to, because 10rem
       * squared the corner while leaving the stick out of line with the info
       * button above it: the two were the only chrome on this edge and stood
       * 96px apart, so the edge read as two unrelated controls instead of one
       * column. 4rem is the inset the info button and the logo already use, so
       * matching it settles both at once.
       *
       * Coming in also buys back room rather than costing it. The bar is
       * centred and capped at `max-w-xl`, so the further from centre the stick
       * sits the sooner it clears: at 10rem it was clear only above ~1080px and
       * sat squarely on top of the bar at 768–1024, which the previous version
       * of this note wrongly claimed could not happen. At 4rem it clears from
       * ~890px. Below that the two genuinely do not fit — 576px of bar leaves
       * 96px a side, and the stick needs ~134 — and it still overlaps until the
       * narrow treatment takes over.
       *
       * Narrow keeps its own smaller side inset, matched to the logo's optical
       * margin. The bottom value is the composer's padding plus its resting row
       * height plus a small breathing gap, with safe-area padding added so the
       * relationship survives mobile browser chrome.
       */
      className={`pointer-events-none absolute right-6 bottom-[calc(env(safe-area-inset-bottom)+7.25rem)] z-30 transition-opacity duration-200 ease-out motion-reduce:transition-none md:right-16 md:bottom-16 ${
        hideOnMobile ? "max-md:opacity-0" : ""
      }`}
    >
      <div
        ref={baseRef}
        role="group"
        aria-label="Thumbstick: drag left or right to move between paintings, up or down to zoom"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        style={{ width: BASE_RADIUS * 2, height: BASE_RADIUS * 2 }}
        className={`relative touch-none select-none rounded-full border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors duration-150 motion-reduce:transition-none ${
          hideOnMobile ? "max-md:pointer-events-none md:pointer-events-auto" : "pointer-events-auto"
        } ${active ? "bg-white/85" : "bg-white/60"} ${GALLERY_FOCUS_RING}`}
      >
        {/* The four axes, now pressable as well as draggable. They were hints
            painted on a drag surface, which is why they were hard to click:
            there was nothing there to click. Each is a real button doing the
            same thing a push in its direction does. */}
        <AxisButton
          axis="left"
          label="Previous painting"
          onPress={() =>
            onSelect(adjacentPaintingId(focusedId, -1, paintings))
          }
        >
          <ChevronLeftIcon size={CHEVRON_SIZE} />
        </AxisButton>
        <AxisButton
          axis="right"
          label="Next painting"
          onPress={() =>
            onSelect(adjacentPaintingId(focusedId, 1, paintings))
          }
        >
          <ChevronRightIcon size={CHEVRON_SIZE} />
        </AxisButton>
        <AxisButton
          axis="top"
          label="Zoom in"
          onPress={() => onZoomBy(ZOOM_STEP)}
        >
          <PlusIcon className={AXIS_CROSS_ICON_CLASS} />
        </AxisButton>
        <AxisButton
          axis="bottom"
          label="Zoom out"
          onPress={() => onZoomBy(-ZOOM_STEP)}
        >
          <AxisMinusIcon />
        </AxisButton>

        <div
          ref={knobRef}
          aria-hidden
          style={{
            width: KNOB_RADIUS * 2,
            height: KNOB_RADIUS * 2,
            marginLeft: -KNOB_RADIUS,
            marginTop: -KNOB_RADIUS,
          }}
          className="absolute left-1/2 top-1/2 rounded-full border border-black/10 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.16)]"
        />
      </div>
    </div>
  );
}
