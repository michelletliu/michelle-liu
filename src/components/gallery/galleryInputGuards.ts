"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * Keep keystrokes inside a gallery text field.
 *
 * The gallery binds arrow keys (step to the next hang) and Escape (leave for
 * home) on `window`. React delegates its listeners lower down the bubble path,
 * so stopping propagation here means the room's global handlers never see keys
 * that were meant for the input. Escape blurs instead, so a second Escape with
 * the field unfocused still exits the room.
 */
export function stopGalleryKeys(e: KeyboardEvent<HTMLElement>): void {
  e.stopPropagation();
  if (e.key === "Escape") {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

/**
 * Let a scrollable element inside the room scroll normally.
 *
 * The camera's wheel handler lives on the room's root element and calls
 * `preventDefault()` on everything, so a nested scroller would step paintings
 * instead of scrolling. This listener is attached to the scroller itself, which
 * bubbles first, and stops the event before the room ever sees it.
 */
export function useWheelIsolation<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", onWheel);
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return ref;
}

/**
 * A scroller inside the room that reports whether it is parked at either end.
 *
 * Callers use the flags to fade the edges only where content is actually cut
 * off — a fade that is always painted reads as a rendering artefact rather than
 * an affordance. Includes the wheel isolation above, since anything scrollable
 * in the room needs it.
 *
 * `contentKey` should change whenever the content does, so the measurement is
 * retaken after results replace skeletons and the tiles reflow.
 */
export function useScrollEdges<T extends HTMLElement>(
  contentKey: unknown,
  axis: "x" | "y" = "y",
) {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const horizontal = axis === "x";
      const scrolled = horizontal ? el.scrollLeft : el.scrollTop;
      const overflow = horizontal
        ? el.scrollWidth - el.clientWidth
        : el.scrollHeight - el.clientHeight;
      // Sub-pixel layout means the scroll offset rarely lands exactly on an
      // extreme, and a right-to-left strip reports it negative.
      const slack = 2;
      const travelled = Math.abs(scrolled);
      setEdges({
        atStart: travelled <= slack,
        atEnd: overflow <= slack || travelled >= overflow - slack,
      });
    };

    const onWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", onWheel);
    el.addEventListener("scroll", measure, { passive: true });

    // Catches the panel resizing and the tiles rewrapping within it.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    measure();

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [contentKey, axis]);

  return { ref, ...edges };
}
