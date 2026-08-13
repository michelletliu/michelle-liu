"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LogoBackButton from "@/components/layout/LogoBackButton";
import { PAINTING_GALLERY_LOADING_PHRASES } from "@/components/RotatingLoadingText";
import GalleryRoom from "./GalleryRoom";
import GalleryThumbstick from "./GalleryThumbstick";
import { useGalleryCamera } from "./useGalleryCamera";
import {
  buildArtGalleryHangs,
  type ArtGalleryHang,
  type ArtGalleryHangSource,
} from "./artGalleryHangs";
import {
  createGalleryProjector,
  isSameWallHangSwitch,
  plaqueCaptionHideMs,
  plaqueCaptionPhase,
  plaqueWorldPoint,
  PLAQUE_CAPTION_FADE_MS,
  type ScreenPoint,
} from "./galleryPlaque";
import {
  frameBandsForStyle,
} from "./galleryFrameGeometry";
import {
  GALLERY_ZOOM_DEFAULT,
  GALLERY_ZOOM_STEP,
} from "./galleryPaintings";

export type PaintingGalleryPageProps = {
  pieces: ArtGalleryHangSource[];
};

/**
 * Fine Art 3D room — same physics as `/gallery`, but hangs are Michelle's
 * paintings. No generate, no download; lightbox-style metadata under focus.
 */
export default function PaintingGalleryPage({
  pieces,
}: PaintingGalleryPageProps) {
  const paintings = useMemo(() => buildArtGalleryHangs(pieces), [pieces]);

  if (paintings.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e4e4e4] text-zinc-500">
        <LogoBackButton href="/art" />
        <p className="text-sm">No paintings to show.</p>
      </div>
    );
  }

  return <PaintingGalleryRoom paintings={paintings} />;
}

function PaintingGalleryRoom({
  paintings,
}: {
  paintings: ArtGalleryHang[];
}) {
  // Prefer "Say It" on open (angled room view with neighbors); else middle of
  // the back wall — same one-point default as `/gallery`'s `back-2`.
  const initialFocusId = useMemo(() => {
    const sayIt = paintings.find(
      (p) => p.title?.trim().toLowerCase() === "say it",
    );
    if (sayIt) return sayIt.id;

    const back = paintings.filter((p) => p.wall === "back");
    if (back.length > 0) {
      return back[Math.floor((back.length - 1) / 2)]!.id;
    }
    return paintings[0]!.id;
  }, [paintings]);

  const {
    focusedId,
    pose,
    zoom,
    isFocusEasing,
    selectPainting,
    zoomBy,
    bindProps,
  } = useGalleryCamera({
    // Wall plaque is not a bottom UI band — leave framing to the hang alone.
    bottomOcclusionPx: 0,
    paintings,
    initialFocusId,
    // One step closer than Reve `/gallery` so Fine Art opens tighter on the hang.
    initialZoom: GALLERY_ZOOM_DEFAULT + GALLERY_ZOOM_STEP,
  });
  const { ref, ...pointerBindProps } = bindProps;

  const focused = paintings.find((p) => p.id === focusedId) ?? paintings[0];
  const project = useMemo(() => createGalleryProjector(), []);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  /**
   * Caption copy freezes while a hang-switch hide plays so the title does not
   * swap mid-pan. (Same-wall used to keep the live caption; on narrow mobile
   * that tracked the new hang to the viewport edge and collapsed.)
   */
  const captionFreezeRef = useRef(focused);
  /** Last on-screen plaque point — held in place while a hang-switch fade plays. */
  const settledPlaqueRef = useRef<ScreenPoint | null>(null);
  /**
   * Focus id before the current hang-switch — used to tell same-wall neighbor
   * steps from corner / wall-to-wall turns (shorter caption hide on flat walls).
   */
  const captionFromIdRef = useRef(focusedId);
  /**
   * True while the plaque should stay frozen/hidden. Same-wall clears before
   * the full camera ease; corners stay hidden until `isFocusEasing` ends.
   */
  const [captionSwitchHidden, setCaptionSwitchHidden] = useState(false);
  const captionHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  /** Hang ids whose wall textures have decoded — gates first-load caption. */
  const [loadedHangIds, setLoadedHangIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const onHangTextureLoad = useCallback((id: string) => {
    setLoadedHangIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      setRootEl(node);
      const bindRef = ref as (n: HTMLDivElement | null) => void;
      bindRef(node);
    },
    [ref],
  );

  useEffect(() => {
    if (!rootEl) return;
    const measure = () =>
      setViewport({ w: rootEl.clientWidth, h: rootEl.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(rootEl);
    return () => observer.disconnect();
  }, [rootEl]);

  // Same-wall neighbor steps hide the plaque briefly; corner turns keep the
  // full camera ease so the label does not chase a long pan.
  useEffect(() => {
    const clearHideTimer = () => {
      if (captionHideTimerRef.current !== null) {
        clearTimeout(captionHideTimerRef.current);
        captionHideTimerRef.current = null;
      }
    };

    if (!isFocusEasing) {
      clearHideTimer();
      setCaptionSwitchHidden(false);
      captionFromIdRef.current = focusedId;
      return;
    }

    // Same-wall can clear the hide before the camera ease ends; if this effect
    // re-runs while still easing on that same focus, do not hide again.
    if (captionFromIdRef.current === focusedId) {
      return clearHideTimer;
    }

    const from =
      paintings.find((p) => p.id === captionFromIdRef.current) ?? null;
    const to = paintings.find((p) => p.id === focusedId) ?? null;
    const sameWall = isSameWallHangSwitch(from, to);
    const hideMs = plaqueCaptionHideMs(sameWall);

    setCaptionSwitchHidden(true);
    clearHideTimer();

    if (sameWall) {
      captionHideTimerRef.current = setTimeout(() => {
        captionHideTimerRef.current = null;
        setCaptionSwitchHidden(false);
        captionFromIdRef.current = focusedId;
      }, hideMs);
    }

    return clearHideTimer;
  }, [isFocusEasing, focusedId, paintings]);

  const plaqueScreen: ScreenPoint | null = useMemo(() => {
    if (!focused) return null;
    const canvasBands = frameBandsForStyle("canvas");
    return project(
      plaqueWorldPoint(focused, {
        matWidth: canvasBands.matWidth,
        lipWidth: canvasBands.lipWidth,
      }),
      pose,
      zoom,
      viewport.w,
      viewport.h,
    );
  }, [focused, pose, zoom, viewport, project]);

  // Caption hide freezes copy against captionFreezeRef; zoom leaves this false.
  const isHangSwitch = captionSwitchHidden && Boolean(captionFreezeRef.current);

  const captionPainting = isHangSwitch ? captionFreezeRef.current : focused;
  if (!captionSwitchHidden && focused) {
    captionFreezeRef.current = focused;
  }

  const goBack = useCallback(() => {
    window.location.assign("/art");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack]);

  const livePlaqueVisible =
    Boolean(plaqueScreen?.visible) &&
    Number.isFinite(plaqueScreen?.x) &&
    Number.isFinite(plaqueScreen?.y);

  if (!isHangSwitch && livePlaqueVisible && plaqueScreen) {
    settledPlaqueRef.current = plaqueScreen;
  }

  const plaqueAnchor: ScreenPoint | null = isHangSwitch
    ? settledPlaqueRef.current
    : livePlaqueVisible
      ? plaqueScreen
      : settledPlaqueRef.current;

  const hasCaption = Boolean(
    captionPainting?.title || captionPainting?.detail,
  );
  const captionTextureReady = Boolean(
    captionPainting && loadedHangIds.has(captionPainting.id),
  );
  const showPlaque =
    hasCaption &&
    captionTextureReady &&
    plaqueAnchor &&
    Number.isFinite(plaqueAnchor.x) &&
    Number.isFinite(plaqueAnchor.y);

  const { opacity: plaqueOpacity } = plaqueCaptionPhase({
    isFocusEasing: isHangSwitch,
    liveVisible: livePlaqueVisible,
    textureReady: captionTextureReady,
  });

  return (
    <div
      ref={setRootRef}
      className="fixed inset-0 z-50 touch-none overflow-hidden bg-[#e4e4e4] text-zinc-900"
      {...pointerBindProps}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-32 md:block"
        style={{
          background:
            "linear-gradient(180deg, hsla(0,0%,100%,.5) 0%, hsla(0,0%,100%,.369) 19%, hsla(0,0%,100%,.271) 34%, hsla(0,0%,100%,.191) 47%, hsla(0,0%,100%,.139) 56.5%, hsla(0,0%,100%,.097) 65%, hsla(0,0%,100%,.063) 73%, hsla(0,0%,100%,.038) 80.2%, hsla(0,0%,100%,.021) 86.1%, hsla(0,0%,100%,.011) 91%, hsla(0,0%,100%,.004) 95.2%, hsla(0,0%,100%,.001) 98.2%, hsla(0,0%,100%,0) 100%)",
        }}
      />
      <div data-gallery-no-drag className="relative z-50">
        <LogoBackButton href="/art" />
      </div>
      <GalleryRoom
        pose={pose}
        zoom={zoom}
        focusedId={focusedId}
        paintings={paintings}
        onSelectPainting={selectPainting}
        imageFit="cover"
        frameStyle="canvas"
        loadingPhrases={PAINTING_GALLERY_LOADING_PHRASES}
        onHangTextureLoad={onHangTextureLoad}
      />
      {/*
        Wall plaque: HTML label at a projected world point under the frame.
        Position tracks the hang as the camera moves (real-room parallax);
        font size stays fixed in CSS px — only the anchor moves.
        Hang switches freeze copy + screen anchor and fade opacity; zoom keeps
        the live plaque. `w-max` avoids abspos shrink-to-fit collapsing the
        label into a column when the anchor sits near a viewport edge.
      */}
      {showPlaque && captionPainting && plaqueAnchor && (
        <div
          data-gallery-no-drag
          className="pointer-events-none absolute z-40 flex w-max max-w-[min(90vw,560px)] flex-col items-center px-2 text-center font-['Michelle',sans-serif] text-xs sm:text-sm tracking-[0.005em] font-normal leading-relaxed transition-opacity ease-out motion-reduce:transition-none"
          style={{
            left: plaqueAnchor.x,
            top: plaqueAnchor.y,
            transform: "translate(-50%, 0)",
            fontVariationSettings: "'opsz' 9",
            opacity: plaqueOpacity,
            transitionDuration: `${PLAQUE_CAPTION_FADE_MS}ms`,
          }}
          aria-hidden={plaqueOpacity === 0}
        >
          {captionPainting.title && (
            <p className="text-zinc-600">{captionPainting.title}</p>
          )}
          {captionPainting.detail && (
            <p className="text-[10px] sm:text-xs text-zinc-400">
              {captionPainting.detail}
            </p>
          )}
        </div>
      )}
      <GalleryThumbstick
        focusedId={focusedId}
        onSelect={selectPainting}
        onZoomBy={zoomBy}
        paintings={paintings}
      />
    </div>
  );
}
