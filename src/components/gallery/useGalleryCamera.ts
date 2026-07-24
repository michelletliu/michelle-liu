"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
} from "react";
import {
  GALLERY_ZOOM_DEFAULT,
  GALLERY_ZOOM_STEP,
  adjacentPaintingId,
  clampGalleryZoom,
  lerpRoomPose,
  progressForPainting,
  roomPoseForPainting,
  type GalleryRoomPose,
} from "./galleryPaintings";
import {
  dragPastDeadzone,
  isGalleryNoDragTarget,
} from "./galleryPointer";

const EASE_MS = 780;
const SWITCH_THRESHOLD = 48;
/** Pinch / ctrl+wheel sensitivity (trackpad reports pinch as wheel+ctrl on macOS). */
const PINCH_ZOOM_SCALE = 0.01;

export type GalleryCameraBindProps = {
  ref: RefCallback<HTMLDivElement>;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

export {
  DRAG_DEADZONE_PX,
  dragPastDeadzone,
  isGalleryNoDragTarget,
} from "./galleryPointer";

/** Back hang keeps the opening view a centered one-point corridor. */
const DEFAULT_FOCUS = "back-1";

export function useGalleryCamera() {
  const [focusedId, setFocusedId] = useState(DEFAULT_FOCUS);
  const [pose, setPose] = useState<GalleryRoomPose>(() =>
    roomPoseForPainting(DEFAULT_FOCUS),
  );
  const [zoom, setZoom] = useState(GALLERY_ZOOM_DEFAULT);
  const [rootNode, setRootNode] = useState<HTMLDivElement | null>(null);

  const focusedIdRef = useRef(focusedId);
  const poseRef = useRef(pose);
  const zoomRef = useRef(zoom);
  const pendingDrag = useRef(false);
  const dragging = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastY = useRef(0);
  const switchAccum = useRef(0);
  const animFrame = useRef<number | null>(null);

  focusedIdRef.current = focusedId;
  poseRef.current = pose;
  zoomRef.current = zoom;

  const applyZoom = useCallback((next: number) => {
    const z = clampGalleryZoom(next);
    zoomRef.current = z;
    setZoom(z);
  }, []);

  const setRootRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setRootNode(node);
  }, []);

  const cancelEase = useCallback(() => {
    if (animFrame.current !== null) {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = null;
    }
  }, []);

  const easePoseTo = useCallback(
    (id: string) => {
      cancelEase();
      const from = poseRef.current;
      const to = roomPoseForPainting(id);
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / EASE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = lerpRoomPose(from, to, eased);
        poseRef.current = next;
        setPose(next);
        if (t < 1) {
          animFrame.current = requestAnimationFrame(tick);
        } else {
          animFrame.current = null;
        }
      };
      animFrame.current = requestAnimationFrame(tick);
    },
    [cancelEase],
  );

  const selectPainting = useCallback(
    (id: string) => {
      if (id === focusedIdRef.current) {
        easePoseTo(id);
        return;
      }
      focusedIdRef.current = id;
      setFocusedId(id);
      switchAccum.current = 0;
      easePoseTo(id);
    },
    [easePoseTo],
  );

  const stepFocus = useCallback(
    (direction: -1 | 1) => {
      const next = adjacentPaintingId(focusedIdRef.current, direction);
      if (next === focusedIdRef.current) return;
      selectPainting(next);
    },
    [selectPainting],
  );

  /** Scroll/drag accumulates until a threshold, then snaps to the next work. */
  const accumulateSwitch = useCallback(
    (delta: number) => {
      switchAccum.current += delta;
      if (switchAccum.current >= SWITCH_THRESHOLD) {
        switchAccum.current = 0;
        stepFocus(1);
      } else if (switchAccum.current <= -SWITCH_THRESHOLD) {
        switchAccum.current = 0;
        stepFocus(-1);
      }
    },
    [stepFocus],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isStep =
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp";

      if (isStep) {
        e.preventDefault();
        // Held arrows auto-repeat ~30x/sec, which fires many steps inside one
        // EASE_MS pose transition — focus races ahead and the camera never
        // arrives at the hangs in between, so they look skipped.
        if (e.repeat) return;
        stepFocus(e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable=true]")) return;

      // ⌘/Ctrl + / = zoom in; - zoom out; 0 reset
      if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") {
        e.preventDefault();
        applyZoom(zoomRef.current + GALLERY_ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
        e.preventDefault();
        applyZoom(zoomRef.current - GALLERY_ZOOM_STEP);
      } else if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault();
        applyZoom(GALLERY_ZOOM_DEFAULT);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyZoom, stepFocus]);

  useEffect(() => {
    const el = rootNode;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch is reported as wheel + ctrlKey in Chromium / Safari.
      if (e.ctrlKey || e.metaKey) {
        applyZoom(zoomRef.current - e.deltaY * PINCH_ZOOM_SCALE);
        return;
      }
      accumulateSwitch(e.deltaY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [accumulateSwitch, applyZoom, rootNode]);

  useEffect(() => {
    return () => cancelEase();
  }, [cancelEase]);

  const endPointer = useCallback((el: HTMLDivElement | null, pointerId: number) => {
    pendingDrag.current = false;
    dragging.current = false;
    pointerIdRef.current = null;
    if (!el) return;
    try {
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const bindProps: GalleryCameraBindProps = {
    ref: setRootRef,
    onPointerDown: (e) => {
      if (isGalleryNoDragTarget(e.target)) return;
      pendingDrag.current = true;
      dragging.current = false;
      pointerIdRef.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
      lastY.current = e.clientY;
    },
    onPointerMove: (e) => {
      if (pointerIdRef.current !== e.pointerId) return;

      if (pendingDrag.current && !dragging.current) {
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        if (!dragPastDeadzone(dx, dy)) return;
        pendingDrag.current = false;
        dragging.current = true;
        lastY.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }

      if (!dragging.current) return;
      const dy = e.clientY - lastY.current;
      lastY.current = e.clientY;
      accumulateSwitch(dy);
    },
    onPointerUp: (e) => {
      endPointer(e.currentTarget, e.pointerId);
    },
    onPointerCancel: (e) => {
      endPointer(e.currentTarget, e.pointerId);
    },
  };

  const progress = progressForPainting(focusedId);

  return { progress, focusedId, pose, zoom, selectPainting, bindProps };
}
