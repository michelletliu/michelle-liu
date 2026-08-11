"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LogoBackButton from "@/components/layout/LogoBackButton";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { SendIcon } from "@/components/library/icons";
import { warmWorkPage } from "@/components/shared/doorwayWarm";
import { navigateHomeWithScrollReturn } from "@/components/shared/homeScrollReturn";
import GalleryActionBar, { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import GalleryInfoButton from "./GalleryInfoButton";
import GalleryRoom from "./GalleryRoom";
import GallerySaveDialog from "./GallerySaveDialog";
import GalleryThumbstick from "./GalleryThumbstick";
import { downloadImage, generatedImageFilename } from "./downloadImage";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { ICON_STROKE_WIDTH } from "@/components/shared/iconSizes";
import { GALLERY_PAINTINGS } from "./galleryPaintings";
import type { MetArtwork } from "./metArtworks";
import { resolveShimmerHues, type ShimmerHues } from "./shimmerPalette";
import { useGalleryCamera, useMeasuredHeight } from "./useGalleryCamera";

/** Last successful generate for a canvas — restores the composer on edit. */
export type PaintingGenerationContext = {
  prompt: string;
  inspiration: MetArtwork | null;
};

export type GalleryPageMode = "edit" | "view";

export type GalleryPageProps = {
  mode?: GalleryPageMode;
  /** Preloaded hang images (data URLs or https), keyed by painting id. */
  initialImageById?: Record<string, string>;
  /** Met titles for download filenames on shared views. */
  initialInspirationTitles?: Record<string, string>;
  /** Shared gallery display name (view mode). */
  galleryName?: string;
  /** Who made the shared gallery (view mode attribution). */
  galleryCreator?: string;
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
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function GalleryPage({
  mode = "edit",
  initialImageById,
  initialInspirationTitles,
  galleryName,
  galleryCreator,
}: GalleryPageProps) {
  /** Hard nav home — soft push waits on WebGL dispose and feels broken. */
  const goHome = useCallback(() => {
    warmWorkPage();
    navigateHomeWithScrollReturn("/");
  }, []);
  const isView = mode === "view";
  /*
   * The bottom stack covers the foot of the room, and the action bar inside it
   * changes height as it opens, so how much of the focused frame is hidden is
   * something only the rendered bar can answer. The camera drops by whatever
   * this measures rather than by a number picked for one of its states.
   */
  const bottomStack = useMeasuredHeight();
  const { focusedId, pose, zoom, selectPainting, zoomBy, bindProps } =
    useGalleryCamera({ bottomOcclusionPx: bottomStack.height });
  const { ref, ...pointerBindProps } = bindProps;

  const [imageById, setImageById] = useState<Record<string, string>>(
    () => initialImageById ?? {},
  );
  /** Met titles for download filenames (shared view + edit session). */
  const [inspirationTitleById, setInspirationTitleById] = useState<
    Record<string, string>
  >(() => initialInspirationTitles ?? {});
  /**
   * Prompt + Met inspiration per canvas. Download filenames read the title;
   * the action bar hydrates from the full record when editing a hang.
   */
  const [generationById, setGenerationById] = useState<
    Record<string, PaintingGenerationContext>
  >({});
  const [generatingIds, setGeneratingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [composerOpenSignal, setComposerOpenSignal] = useState(0);
  /** Matches action-bar maximized shell; edit mode starts expanded. */
  const [composerExpanded, setComposerExpanded] = useState(!isView);
  const [saveOpen, setSaveOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  /**
   * Hues for in-flight shimmers, keyed by painting id so concurrent gens keep
   * their own palette when the visitor steps between canvases.
   */
  const [shimmerHuesById, setShimmerHuesById] = useState<
    Record<string, ShimmerHues | null>
  >({});
  /**
   * Monotonic stamp per generate kickoff. Extraction is deliberately not
   * awaited, so a slow read can still be outstanding when that generation ends
   * and another begins on the same canvas. Stamping each request and dropping
   * superseded ones keeps hues with their own run.
   */
  const shimmerRequestByIdRef = useRef<Record<string, number>>({});

  const paintings = useMemo(
    () =>
      GALLERY_PAINTINGS.map((painting) => ({
        ...painting,
        imageUrl: imageById[painting.id] ?? painting.imageUrl,
      })),
    [imageById],
  );

  const filledHangCount = Object.keys(imageById).length;
  const canSave = !isView && filledHangCount >= 1;

  const saveHangs = useMemo(
    () =>
      Object.entries(imageById).map(([paintingId, imageUrl]) => ({
        paintingId,
        imageUrl,
        inspirationTitle:
          generationById[paintingId]?.inspiration?.title ||
          inspirationTitleById[paintingId] ||
          undefined,
      })),
    [imageById, generationById, inspirationTitleById],
  );

  const onGenerate = useCallback(
    async (prompt: string, inspiration?: MetArtwork) => {
      const paintingId = focusedId;
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.add(paintingId);
        return next;
      });
      // Deliberately not awaited. The shimmer opens on its default hues and
      // eases onto the artwork's when they land, because making the canvas
      // wait on an image decode to start animating would trade the whole point
      // of the shimmer for a detail almost nobody would notice arriving late.
      const shimmerRequest =
        (shimmerRequestByIdRef.current[paintingId] ?? 0) + 1;
      shimmerRequestByIdRef.current[paintingId] = shimmerRequest;
      setShimmerHuesById((prev) => ({ ...prev, [paintingId]: null }));
      if (inspiration) {
        void resolveShimmerHues(inspiration.objectID).then((hues) => {
          if (shimmerRequestByIdRef.current[paintingId] !== shimmerRequest) {
            return;
          }
          setShimmerHuesById((prev) => ({ ...prev, [paintingId]: hues }));
        });
      }
      try {
        const res = await fetch("/api/gallery/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            paintingId,
            inspirationObjectID: inspiration?.objectID,
          }),
        });
        const data = (await res.json()) as {
          imageUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.imageUrl) {
          throw new Error(data.error || "Generation failed");
        }
        setImageById((prev) => ({ ...prev, [paintingId]: data.imageUrl! }));
        setGenerationById((prev) => ({
          ...prev,
          [paintingId]: {
            prompt,
            inspiration: inspiration ?? null,
          },
        }));
        if (inspiration?.title) {
          setInspirationTitleById((prev) => ({
            ...prev,
            [paintingId]: inspiration.title,
          }));
        }
      } finally {
        // Runs on failure too, so a canvas never keeps shimmering after an error.
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(paintingId);
          return next;
        });
        setShimmerHuesById((prev) => {
          if (!(paintingId in prev)) return prev;
          const { [paintingId]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [focusedId],
  );

  const onDownload = useCallback(() => {
    const imageUrl = imageById[focusedId];
    if (!imageUrl) return;
    void downloadImage(
      imageUrl,
      generatedImageFilename({
        inspirationTitle:
          generationById[focusedId]?.inspiration?.title ??
          inspirationTitleById[focusedId] ??
          null,
        imageUrl,
      }),
    );
  }, [focusedId, imageById, generationById, inspirationTitleById]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        goHome();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goHome]);

  const canDownload = Boolean(imageById[focusedId]);

  return (
    <div
      ref={ref}
      // z-50: above site-wide body::before top gradient (globals.css z-40).
      // Without this, the fixed+overflow shell composites as one layer under
      // the fade, so even z-50 chrome (Save / info / seal) looks washed out.
      className="fixed inset-0 z-50 touch-none overflow-hidden bg-[#e4e4e4] text-zinc-900"
      {...pointerBindProps}
    >
      {/*
        body::before is now under this shell, so recreate the same desktop
        vignette here: above the room (z-10), below chrome (z-50).
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-32 md:block"
        style={{
          background:
            "linear-gradient(180deg, hsla(0,0%,100%,.5) 0%, hsla(0,0%,100%,.369) 19%, hsla(0,0%,100%,.271) 34%, hsla(0,0%,100%,.191) 47%, hsla(0,0%,100%,.139) 56.5%, hsla(0,0%,100%,.097) 65%, hsla(0,0%,100%,.063) 73%, hsla(0,0%,100%,.038) 80.2%, hsla(0,0%,100%,.021) 86.1%, hsla(0,0%,100%,.011) 91%, hsla(0,0%,100%,.004) 95.2%, hsla(0,0%,100%,.001) 98.2%, hsla(0,0%,100%,0) 100%)",
        }}
      />
      <div data-gallery-no-drag className="relative z-50">
        <LogoBackButton />
      </div>
      <div
        data-gallery-no-drag
        className="fixed top-8 right-6 z-50 flex items-center gap-2 md:right-16"
      >
        {canSave ? (
          <button
            ref={shareButtonRef}
            type="button"
            onClick={() => setSaveOpen((open) => !open)}
            aria-label="Share"
            aria-haspopup="dialog"
            aria-expanded={saveOpen}
            data-gallery-share-button
            // Persistent room furniture: must not fold the composer away.
            {...{ [KEEP_BAR_OPEN_ATTR]: "" }}
            // Same ghost md control as GalleryInfoButton; paper plane = share.
            className={ghostIconButtonClass(
              "md",
              `text-zinc-400 ${saveOpen ? "bg-zinc-900/5" : ""} ${GALLERY_FOCUS_RING}`,
            )}
          >
            <SendIcon className="size-5" />
          </button>
        ) : null}
        {isView && galleryName ? (
          <p className="max-w-[min(55vw,20rem)] truncate text-base text-zinc-500">
            {galleryCreator?.trim() ? (
              <>
                {galleryName}{" "}
                <span className="text-zinc-400">by</span>{" "}
                {galleryCreator.trim()}
              </>
            ) : (
              galleryName
            )}
          </p>
        ) : null}
        <GalleryInfoButton viewOnly={isView} />
      </div>
      <GalleryRoom
        pose={pose}
        zoom={zoom}
        focusedId={focusedId}
        paintings={paintings}
        generatingIds={isView ? undefined : generatingIds}
        shimmerHuesById={isView ? undefined : shimmerHuesById}
        onSelectPainting={selectPainting}
        onOpenComposer={
          isView
            ? undefined
            : () => setComposerOpenSignal((signal) => signal + 1)
        }
      />
      {/* Ignores pointer events itself so the room stays draggable through the
          gaps either side of the bar. */}
      <div
        ref={bottomStack.ref}
        // Desktop: lift the composer so its vertical center matches the
        // thumbstick (`md:bottom-16` + 106px disc → center at 117px). Expanded
        // single-line bar is ~62px tall, so pb = 117 − 31 = 86. Mobile keeps
        // pb-6 — the stick sits above the bar there on purpose.
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-4 pb-6 md:pb-[86px]"
      >
        {isView ? (
          canDownload ? (
            <button
              type="button"
              onClick={onDownload}
              aria-label="Download the artwork on this canvas"
              className={`pointer-events-auto grid size-10 place-items-center rounded-full border border-black/10 bg-white/90 text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors hover:bg-white hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
            >
              <GalleryDownloadIcon className="size-[18px]" />
            </button>
          ) : null
        ) : (
          <GalleryActionBar
            generating={generatingIds.has(focusedId)}
            focusedId={focusedId}
            generationContext={generationById[focusedId]}
            canDownload={canDownload}
            onDownload={onDownload}
            openSignal={composerOpenSignal}
            onGenerate={onGenerate}
            onExpandedChange={setComposerExpanded}
          />
        )}
      </div>
      <GalleryThumbstick
        focusedId={focusedId}
        onSelect={selectPainting}
        onZoomBy={zoomBy}
        hideOnMobile={composerExpanded}
      />
      {!isView && (
        <GallerySaveDialog
          open={saveOpen}
          hangs={saveHangs}
          anchorRef={shareButtonRef}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </div>
  );
}
