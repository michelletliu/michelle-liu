"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { adjacentPaintingId } from "./galleryPaintings";
import {
  NAV_REPEAT_IDLE,
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
};

/** Base and knob radii in px. Knob travel is their difference, less a margin. */
const BASE_RADIUS = 46;
const KNOB_RADIUS = 19;
const MAX_TRAVEL = BASE_RADIUS - KNOB_RADIUS - 5;
/**
 * Axis hint size.
 *
 * Sized against the 27px band between the knob and the rim rather than against
 * the base as a whole, so the glyphs read as labels on the ring they sit in and
 * the knob stays the largest thing on the control.
 */
const ICON_SIZE = 15;

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
       * not depend on the bar's height: the bar is centred and capped at
       * `max-w-xl`, so at this width it never reaches this column at all.
       *
       * Narrow, the room fills the viewport and there is no clear floor left to
       * drop into, so the stick stays centred — the one band the bar cannot
       * reach even fully expanded. Some overlap with the room is unavoidable at
       * that width, which is what the translucent base and blur are for.
       *
       * Wide, the right and bottom insets are the same 10rem so the stick sits
       * in the corner squarely. They were 5rem and 10rem, and the stick read as
       * pushed up against the right edge — a corner only looks deliberate when
       * both of its gaps agree. Narrow keeps its own smaller inset: there is no
       * bottom gap to agree with when the stick is vertically centred, and
       * 10rem of a 390px viewport would put it over the middle of the room.
       */
      className="pointer-events-none absolute top-1/2 right-8 z-40 -translate-y-1/2 md:top-auto md:right-40 md:bottom-40 md:translate-y-0"
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
        {/* Axis hints. The same lucide glyphs as the arrow and zoom buttons
            rather than typographic characters, so the four are optically
            balanced with each other and carry the weight the rest of the
            gallery's controls do — a control with no label has only these to
            say what its axes are. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[7px] text-zinc-500"
        >
          <ChevronLeft
            size={ICON_SIZE}
            className="absolute left-0 top-1/2 -translate-y-1/2"
          />
          <ChevronRight
            size={ICON_SIZE}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          />
          <Plus
            size={ICON_SIZE}
            className="absolute left-1/2 top-0 -translate-x-1/2"
          />
          <Minus
            size={ICON_SIZE}
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
          />
        </span>

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
