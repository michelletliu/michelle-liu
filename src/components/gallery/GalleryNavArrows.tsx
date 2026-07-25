"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { GALLERY_ZOOM_STEP, adjacentPaintingId } from "./galleryPaintings";

type GalleryNavArrowsProps = {
  focusedId: string;
  onSelect: (id: string) => void;
  /** The camera's clamped zoom path; the buttons never clamp themselves. */
  onZoomBy: (delta: number) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
};

/**
 * On-screen equivalent of the arrow keys and the zoom shortcuts, which are
 * otherwise the only way to move through the room and are undiscoverable.
 *
 * Rendered as the first child of the bottom-centre stack in `GalleryPage`, so
 * it sits directly on top of the action bar and stays there as the bar grows a
 * results grid or shrinks to its pen icon — no fixed offset to keep in sync.
 */
export default function GalleryNavArrows({
  focusedId,
  onSelect,
  onZoomBy,
  canZoomIn,
  canZoomOut,
}: GalleryNavArrowsProps) {
  /*
   * The same helper the keyboard handler steps with, so the two orders cannot
   * drift apart, and it wraps at both ends so neither arrow is ever dead.
   *
   * No click throttle: the camera ease cancels any in-flight tween and starts
   * a fresh one from wherever the camera currently is, so rapid clicks retarget
   * smoothly instead of queueing.
   */
  const step = (direction: -1 | 1) => {
    onSelect(adjacentPaintingId(focusedId, direction));
  };

  const buttonClass = ghostIconButtonClass(
    "sm",
    `text-zinc-500 hover:text-zinc-900 active:bg-zinc-900/10 disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none ${GALLERY_FOCUS_RING}`,
  );

  return (
    <nav
      aria-label="Gallery navigation"
      data-gallery-no-drag
      className="pointer-events-auto flex justify-center"
    >
      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous painting"
          className={buttonClass}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next painting"
          className={buttonClass}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
        <span aria-hidden className="mx-0.5 h-4 w-px bg-black/10" />
        {/* Disabled rather than hidden at the bounds: a control that vanishes
            shifts the two beside it, and the gap is the clearest way to say the
            camera is already as close or as far as it goes. */}
        <button
          type="button"
          onClick={() => onZoomBy(-GALLERY_ZOOM_STEP)}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          className={buttonClass}
        >
          <Minus size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onZoomBy(GALLERY_ZOOM_STEP)}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          className={buttonClass}
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
