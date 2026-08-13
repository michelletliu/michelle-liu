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
  GALLERY_PAINTINGS,
  GALLERY_ZOOM_DEFAULT,
  GALLERY_ZOOM_MAX,
  GALLERY_ZOOM_MIN,
  GALLERY_ZOOM_STEP,
  adjacentPaintingId,
  clampGalleryZoom,
  easeWithPanel,
  framedRoomPose,
  lerpRoomPose,
  progressForPainting,
  roomPoseForPainting,
  type GalleryFraming,
  type GalleryPainting,
  type GalleryRoomPose,
} from "./galleryPaintings";
import {
  dragPastDeadzone,
  isGalleryNoDragTarget,
} from "./galleryPointer";

const EASE_MS = 780;
/** Zoom steps are small and arrive in bursts, so they settle much faster. */
const ZOOM_EASE_MS = 220;
/**
 * The action bar's own expand/collapse duration. Reframing for it is a
 * response to that movement, so it runs on its span and its curve.
 */
const FRAMING_EASE_MS = 320;
const SWITCH_THRESHOLD = 48;
/** Pinch / ctrl+wheel sensitivity (trackpad reports pinch as wheel+ctrl on macOS). */
const PINCH_ZOOM_SCALE = 0.01;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Tracks an element's rendered height.
 *
 * The gallery's bottom bar changes height in three ways — folded to its pen,
 * open on the prompt row, open with the results grid above it — and each of
 * those hides a different amount of the room. Measuring is what lets the
 * camera answer the panel that is actually on screen instead of the tallest
 * one it might be.
 */
export function useMeasuredHeight(): {
  ref: RefCallback<HTMLElement>;
  height: number;
} {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);

  const ref = useCallback<RefCallback<HTMLElement>>((next) => {
    setNode(next);
  }, []);

  useEffect(() => {
    if (!node) {
      setHeight(0);
      return;
    }
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, height };
}

export type GalleryCameraOptions = {
  /**
   * Height in CSS px of the UI band covering the bottom of the viewport. The
   * camera drops by however much of the focused frame that band is hiding.
   */
  bottomOcclusionPx?: number;
  /** Hang list for focus stepping and poses. Defaults to the blank 12-hang room. */
  paintings?: GalleryPainting[];
  /** Initial focused hang id. Defaults to the middle back hang. */
  initialFocusId?: string;
  /** Initial zoom factor. Clamped; defaults to GALLERY_ZOOM_DEFAULT. */
  initialZoom?: number;
};

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
  /**
   * True while the camera is easing between hangs after a focus change.
   * Zoom-only and framing reframes leave this false so UI (e.g. plaques)
   * can stay put during those moves.
   */
  isFocusEasing: boolean;
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

export function useGalleryCamera({
  bottomOcclusionPx = 0,
  paintings = GALLERY_PAINTINGS,
  initialFocusId,
  initialZoom,
}: GalleryCameraOptions = {}): GalleryCamera {
  const paintingsRef = useRef(paintings);
  paintingsRef.current = paintings;

  const startFocus =
    initialFocusId && paintings.some((p) => p.id === initialFocusId)
      ? initialFocusId
      : paintings.find((p) => p.id === DEFAULT_FOCUS)?.id ??
        paintings[0]?.id ??
        DEFAULT_FOCUS;

  const startZoom = clampGalleryZoom(
    initialZoom ?? GALLERY_ZOOM_DEFAULT,
  );

  const [focusedId, setFocusedId] = useState(startFocus);
  const [pose, setPose] = useState<GalleryRoomPose>(() =>
    roomPoseForPainting(
      startFocus,
      startZoom,
      paintings,
    ),
  );
  const [zoom, setZoomState] = useState(startZoom);
  const [isFocusEasing, setIsFocusEasing] = useState(false);
  const [rootNode, setRootNode] = useState<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const focusedIdRef = useRef(focusedId);
  const poseRef = useRef(pose);
  const zoomRef = useRef(zoom);
  const focusEasingRef = useRef(false);
  const framingRef = useRef<GalleryFraming | null>(null);
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
  /*
   * A measured viewport is what makes any of this mean anything: the offset is
   * a share of the viewport, so without one there is no scale to read the
   * panel's pixels against, and no shape to frame the room to.
   *
   * The bar is allowed to be zero here. It once had to be real too, back when
   * the bottom offset was all this carried and a zero bar made the whole
   * object moot; the stand-off now frames against the viewport's shape as
   * well, and that is worth knowing whether or not anything covers it.
   */
  framingRef.current =
    viewportHeight > 0
      ? {
          viewportHeightPx: viewportHeight,
          viewportWidthPx: viewportWidth,
          occlusionPx: bottomOcclusionPx,
        }
      : null;

  const setRootRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setRootNode(node);
  }, []);

  const cancelEase = useCallback(() => {
    if (animFrame.current !== null) {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = null;
    }
  }, []);

  const setFocusEasing = useCallback((next: boolean) => {
    if (focusEasingRef.current === next) return;
    focusEasingRef.current = next;
    setIsFocusEasing(next);
  }, []);

  const easePoseTo = useCallback(
    (
      id: string,
      zoomLevel: number,
      durationMs: number = EASE_MS,
      ease: (t: number) => number = easeOutCubic,
      options?: { focusChange?: boolean },
    ) => {
      cancelEase();
      const focusChange = options?.focusChange === true;
      // Zoom / framing eases clear any in-flight focus transition so plaques
      // do not stay hidden after a cancelled hang-to-hang move.
      setFocusEasing(focusChange);

      const from = poseRef.current;
      // Every target the camera is ever given already carries the framing
      // offset, so a reframe blends into a focus change or a zoom rather than
      // arriving as a second animation on top of one.
      const to = framedRoomPose(
        id,
        zoomLevel,
        framingRef.current,
        paintingsRef.current,
      );

      // Guards the reduced-motion path, where `(now - start) / 0` is Infinity
      // on any later frame but NaN on a frame that lands on the same
      // millisecond — and a NaN pose spreads into the camera matrix and
      // renders nothing at all.
      if (durationMs <= 0) {
        poseRef.current = to;
        setPose(to);
        if (focusChange) setFocusEasing(false);
        return;
      }

      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const next = lerpRoomPose(from, to, ease(t));
        poseRef.current = next;
        setPose(next);
        if (t < 1) {
          animFrame.current = requestAnimationFrame(tick);
        } else {
          animFrame.current = null;
          if (focusChange) setFocusEasing(false);
        }
      };
      animFrame.current = requestAnimationFrame(tick);
    },
    [cancelEase, setFocusEasing],
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
      easePoseTo(id, zoomRef.current, EASE_MS, easeOutCubic, {
        focusChange: true,
      });
    },
    [easePoseTo],
  );

  const stepFocus = useCallback(
    (direction: -1 | 1) => {
      const next = adjacentPaintingId(
        focusedIdRef.current,
        direction,
        paintingsRef.current,
      );
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
      /*
       * The room's fields also stop propagation before this listener is
       * reached, so this is the second of two guards. It is worth keeping both
       * now that zoom answers to bare punctuation: a field that is ever added
       * without the propagation guard would otherwise zoom the camera every
       * time someone typed a hyphen or a zero into it.
       */
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable=true]")) return;

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

      /*
       * Zoom: bare + / − / 0, and ⌘/Ctrl + = / − / 0. Claiming the modifier
       * chords stops browser page-zoom from blowing up the HTML chrome
       * (thumbstick, seal) while the canvas stays the same size — in the
       * room, those keys mean camera dolly, not document scale.
       */
      if (e.altKey) return;

      const withZoomMod = e.metaKey || e.ctrlKey;
      const zoomIn =
        e.key === "+" ||
        e.key === "=" ||
        e.code === "NumpadAdd" ||
        (withZoomMod && e.code === "Equal");
      const zoomOut =
        e.key === "-" ||
        e.key === "_" ||
        e.code === "NumpadSubtract" ||
        (withZoomMod && e.code === "Minus");
      const zoomReset =
        e.key === "0" ||
        e.code === "Numpad0" ||
        (withZoomMod && e.code === "Digit0");

      // Ignore unrelated ⌘/Ctrl chords (copy, reload, etc.).
      if (withZoomMod && !zoomIn && !zoomOut && !zoomReset) return;

      if (zoomIn) {
        e.preventDefault();
        zoomBy(GALLERY_ZOOM_STEP);
      } else if (zoomOut) {
        e.preventDefault();
        zoomBy(-GALLERY_ZOOM_STEP);
      } else if (zoomReset) {
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

  /** The room fills this element, so its box is the viewport's. */
  useEffect(() => {
    const el = rootNode;
    if (!el) return;
    const measure = () => {
      setViewportHeight(el.clientHeight);
      setViewportWidth(el.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootNode]);

  /*
   * Reframe when the bottom bar or the viewport changes size, and only then.
   *
   * Keyed on the two measurements rather than on the offset they produce, which
   * also moves with focus and zoom — and those already run eases of their own
   * that a second one starting in the same frame would cut short.
   */
  const framingSettled = useRef(false);
  useEffect(() => {
    if (!framingSettled.current) {
      framingSettled.current = true;
      return;
    }
    easePoseTo(
      focusedIdRef.current,
      zoomRef.current,
      prefersReducedMotion() ? 0 : FRAMING_EASE_MS,
      easeWithPanel,
    );
  }, [bottomOcclusionPx, viewportHeight, viewportWidth, easePoseTo]);

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

  const progress = progressForPainting(focusedId, paintings);

  return {
    progress,
    focusedId,
    pose,
    zoom,
    isFocusEasing,
    canZoomIn: zoom < GALLERY_ZOOM_MAX - ZOOM_EPSILON,
    canZoomOut: zoom > GALLERY_ZOOM_MIN + ZOOM_EPSILON,
    selectPainting,
    setZoom,
    zoomBy,
    bindProps,
  };
}
