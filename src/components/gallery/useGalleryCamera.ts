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
  GALLERY_ZOOM_MAX,
  GALLERY_ZOOM_MIN,
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
/** Zoom steps are small and arrive in bursts, so they settle much faster. */
const ZOOM_EASE_MS = 220;
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

export type GalleryCamera = {
  /** Tour progress of the focused hang, in [0, 1]. */
  progress: number;
  focusedId: string;
  pose: GalleryRoomPose;
  /** Current zoom factor, always within [GALLERY_ZOOM_MIN, GALLERY_ZOOM_MAX]. */
  zoom: number;
  /** False once zoom sits at its limit, so a control can dim instead of no-op. */
  canZoomIn: boolean;
  canZoomOut: boolean;
  selectPainting: (id: string) => void;
  /**
   * Zoom to an absolute factor. Clamped, so any continuous input — a
   * thumbstick, a slider — can push raw values at it every frame.
   */
  setZoom: (zoom: number) => void;
  /** Zoom by an increment from wherever zoom currently sits. Clamped too. */
  zoomBy: (delta: number) => void;
  bindProps: GalleryCameraBindProps;
};

/**
 * Guards the ends of the range against float drift, so a control disables
 * exactly when the last step has landed rather than one step late.
 */
const ZOOM_EPSILON = 1e-6;

/**
 * Middle back hang: the camera stands square to whichever hang is focused, so
 * only the middle of an end wall opens on the room's centerline — the centered
 * one-point view the entrance is meant to give.
 */
const DEFAULT_FOCUS = "back-2";

export function useGalleryCamera(): GalleryCamera {
  const [focusedId, setFocusedId] = useState(DEFAULT_FOCUS);
  const [pose, setPose] = useState<GalleryRoomPose>(() =>
    roomPoseForPainting(DEFAULT_FOCUS, GALLERY_ZOOM_DEFAULT),
  );
  const [zoom, setZoomState] = useState(GALLERY_ZOOM_DEFAULT);
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
    (id: string, zoomLevel: number, durationMs: number = EASE_MS) => {
      cancelEase();
      const from = poseRef.current;
      const to = roomPoseForPainting(id, zoomLevel);
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
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

  /**
   * The single way zoom ever changes, for the trackpad, the keyboard and any
   * on-screen control alike: clamp first, then dolly the eye to match, because
   * zoom moves the viewer rather than only narrowing the lens. Clamping here
   * rather than at each call site is what keeps the camera inside the room and
   * off the near plane no matter what a caller asks for.
   */
  const setZoom = useCallback(
    (next: number) => {
      const z = clampGalleryZoom(next);
      if (z === zoomRef.current) return;
      zoomRef.current = z;
      setZoomState(z);
      easePoseTo(focusedIdRef.current, z, ZOOM_EASE_MS);
    },
    [easePoseTo],
  );

  const zoomBy = useCallback(
    (delta: number) => setZoom(zoomRef.current + delta),
    [setZoom],
  );

  const selectPainting = useCallback(
    (id: string) => {
      if (id === focusedIdRef.current) {
        easePoseTo(id, zoomRef.current);
        return;
      }
      focusedIdRef.current = id;
      setFocusedId(id);
      switchAccum.current = 0;
      easePoseTo(id, zoomRef.current);
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
        zoomBy(GALLERY_ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
        e.preventDefault();
        zoomBy(-GALLERY_ZOOM_STEP);
      } else if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault();
        setZoom(GALLERY_ZOOM_DEFAULT);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setZoom, stepFocus, zoomBy]);

  useEffect(() => {
    const el = rootNode;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch is reported as wheel + ctrlKey in Chromium / Safari.
      if (e.ctrlKey || e.metaKey) {
        zoomBy(-e.deltaY * PINCH_ZOOM_SCALE);
        return;
      }
      accumulateSwitch(e.deltaY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [accumulateSwitch, rootNode, zoomBy]);

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

  return {
    progress,
    focusedId,
    pose,
    zoom,
    canZoomIn: zoom < GALLERY_ZOOM_MAX - ZOOM_EPSILON,
    canZoomOut: zoom > GALLERY_ZOOM_MIN + ZOOM_EPSILON,
    selectPainting,
    setZoom,
    zoomBy,
    bindProps,
  };
}
