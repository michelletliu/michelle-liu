"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { adjacentPaintingId } from "./galleryPaintings";
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
  /** Height of the mobile composer stack, including its bottom padding. */
  mobileComposerHeight: number;
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
};

/** Base and knob radii in px. Knob travel is their difference, less a margin. */
const BASE_RADIUS = 56;
const KNOB_RADIUS = 22;
const MAX_TRAVEL = BASE_RADIUS - KNOB_RADIUS - 5;
const BASE_BORDER = 1;
/**
 * Axis hint size.
 *
 * Sized against the band between the knob and the rim rather than against
 * the base as a whole, so the glyphs read as labels on the ring they sit in and
 * the knob stays the largest thing on the control.
 */
const ICON_SIZE = 15;
const GLYPH_WASH_SIZE = 26;
/**
 * Centres each glyph in the visible ring, measured from the knob's outer edge
 * to the base border's inner edge.
 *
 * The visible radial band is 33px: 55px inner base radius minus the 22px knob.
 * A 15px glyph leaves 18px, or exactly 9px of visible air on either side. The
 * 26px hover wash therefore begins 3.5px beyond each target's inner edge.
 */
const VISIBLE_RING_RADIUS = BASE_RADIUS - BASE_BORDER;
const GLYPH_RADIAL_CENTER = (KNOB_RADIUS + VISIBLE_RING_RADIUS) / 2;
const GLYPH_WASH_OFFSET =
  GLYPH_RADIAL_CENTER - KNOB_RADIUS - GLYPH_WASH_SIZE / 2;

/**
 * Where each axis button sits, and how much of the base it may claim.
 *
 * The base is 112px across with a 44px knob in the middle, which leaves a 34px
 * band per side. Each target stops at the knob's edge (AXIS_INSET from the
 * base's own edge) and reaches outward past the rim (AXIS_OUTSET) so the
 * pressable area is at least 44×44 without overlapping neighbours or the knob.
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
const AXIS_INSET = 34;
const AXIS_OUTSET = 10;

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

/** Moves only the glyph wash; the larger axis target geometry stays unchanged. */
const AXIS_GLYPH: Record<AxisName, string> = {
  left: "top-1/2 -translate-y-1/2",
  right: "top-1/2 -translate-y-1/2",
  top: "left-1/2 -translate-x-1/2",
  bottom: "left-1/2 -translate-x-1/2",
};

const AXIS_GLYPH_STYLE: Record<AxisName, React.CSSProperties> = {
  left: { right: GLYPH_WASH_OFFSET },
  right: { left: GLYPH_WASH_OFFSET },
  top: { bottom: GLYPH_WASH_OFFSET },
  bottom: { top: GLYPH_WASH_OFFSET },
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
      className={`group absolute rounded-lg ${GALLERY_FOCUS_RING}`}
    >
      <span
        aria-hidden
        style={AXIS_GLYPH_STYLE[axis]}
        className={`absolute grid size-[26px] place-items-center rounded-full text-zinc-500 transition-colors duration-150 group-hover:bg-zinc-900/[0.06] group-hover:text-zinc-700 group-active:bg-zinc-900/[0.12] motion-reduce:transition-none ${AXIS_GLYPH[axis]}`}
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
  mobileComposerHeight,
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
      onSelectRef.current(adjacentPaintingId(focusedIdRef.current, step));
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
       * Right edge, and never a right-hand corner: the info button holds the
       * top one, and the bottom one is where the action bar grows as its
       * results grid opens.
       *
       * The vertical anchor differs by width because the room does. Wide, the
       * hangs sit in a band across the middle and leave clear floor beneath
       * them, so the stick drops below the canvases rather than sitting
       * concentric with the right-hand one, where it read as a sticker stuck to
       * the painting. It is out of the bar's way there for a reason that does
       * not depend on the bar's height: from `lg` onward the centred
       * `max-w-lg` bar never reaches this column at all.
       *
       * Narrow, the room fills the viewport and there is no fixed clear floor:
       * the composer changes height as its picker opens. Its measured height
       * therefore drives the stick's bottom edge. The 24px addition leaves
       * 14px between the panel and the axis targets, which extend 10px beyond
       * the base. Moving the stick to the left also keeps it out of the fanned
       * cards that peek over the prompt bar's right shoulder by default.
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
       * The corner treatment starts at `lg`, not `md`. A 512px centred panel
       * leaves 256px per side at 1024px, enough for the base, its 10px target
       * overhang and the 64px edge inset with 70px still separating the two.
       * Below that breakpoint the measured-height narrow treatment keeps the
       * controls apart vertically instead of assuming they fit side by side.
       *
       * The narrow 0.75rem left inset keeps even the targets' 10px overhang
       * inside a 390px viewport while reclaiming as much clear room as possible.
       */
      style={
        {
          "--gallery-stick-bottom": `${Math.max(
            mobileComposerHeight + 24,
            112,
          )}px`,
        } as React.CSSProperties
      }
      className="pointer-events-none absolute bottom-[var(--gallery-stick-bottom)] left-3 z-40 lg:top-auto lg:right-16 lg:bottom-16 lg:left-auto"
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
        className={`pointer-events-auto relative touch-none select-none rounded-full border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors duration-150 motion-reduce:transition-none ${
          active ? "bg-white/85" : "bg-white/60"
        } ${GALLERY_FOCUS_RING}`}
      >
        {/* The four axes, now pressable as well as draggable. They were hints
            painted on a drag surface, which is why they were hard to click:
            there was nothing there to click. Each is a real button doing the
            same thing a push in its direction does. */}
        <AxisButton
          axis="left"
          label="Previous painting"
          onPress={() => onSelect(adjacentPaintingId(focusedId, -1))}
        >
          <ChevronLeft size={ICON_SIZE} />
        </AxisButton>
        <AxisButton
          axis="right"
          label="Next painting"
          onPress={() => onSelect(adjacentPaintingId(focusedId, 1))}
        >
          <ChevronRight size={ICON_SIZE} />
        </AxisButton>
        <AxisButton
          axis="top"
          label="Zoom in"
          onPress={() => onZoomBy(ZOOM_STEP)}
        >
          <Plus size={ICON_SIZE} />
        </AxisButton>
        <AxisButton
          axis="bottom"
          label="Zoom out"
          onPress={() => onZoomBy(-ZOOM_STEP)}
        >
          <Minus size={ICON_SIZE} />
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
