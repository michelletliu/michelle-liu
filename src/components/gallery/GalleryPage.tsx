"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
<<<<<<< HEAD
import LogoBackButton from "@/components/layout/LogoBackButton";
import { useNavigate } from "@/lib/navigation";
import GalleryActionBar from "./GalleryActionBar";
=======
import LogoBackButton from "@/components/LogoBackButton";
import { warmWorkPage } from "@/components/doorwayWarm";
import GalleryActionBar, { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
>>>>>>> origin/main
import GalleryInfoButton from "./GalleryInfoButton";
import GalleryRoom from "./GalleryRoom";
import GallerySaveDialog from "./GallerySaveDialog";
import GalleryThumbstick from "./GalleryThumbstick";
import { downloadImage, generatedImageFilename } from "./downloadImage";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
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
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth="1.5"
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
}: GalleryPageProps) {
  /** Hard-assign home — soft push waits on WebGL dispose and feels broken. */
  const goHome = useCallback(() => {
    warmWorkPage();
    window.location.assign("/");
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
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [composerOpenSignal, setComposerOpenSignal] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  /** Hues for the in-flight shimmer, from the artwork that inspired it. */
  const [shimmerHues, setShimmerHues] = useState<ShimmerHues | null>(null);
  /**
   * Which generation the in-flight hue extraction belongs to.
   *
   * Extraction is deliberately not awaited, so it is not bound to the
   * generation that asked for it: a slow read — a cold proxy fetch, an eight
   * second timeout — can still be outstanding when that generation ends and
   * the next one begins. Landing then, it would paint the new canvas in the
   * previous artwork's colours. Stamping each request and dropping the ones
   * that come back superseded is what keeps the hues with their own run.
   */
  const shimmerRequestRef = useRef(0);

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
      setGeneratingId(paintingId);
      // Deliberately not awaited. The shimmer opens on its default hues and
      // eases onto the artwork's when they land, because making the canvas
      // wait on an image decode to start animating would trade the whole point
      // of the shimmer for a detail almost nobody would notice arriving late.
      const shimmerRequest = ++shimmerRequestRef.current;
      setShimmerHues(null);
      if (inspiration) {
        void resolveShimmerHues(inspiration.objectID).then((hues) => {
          if (shimmerRequestRef.current === shimmerRequest) setShimmerHues(hues);
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
        setGeneratingId(null);
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
            type="button"
            onClick={() => setSaveOpen(true)}
            aria-label="Share"
            // Persistent room furniture: must not fold the composer away.
            {...{ [KEEP_BAR_OPEN_ATTR]: "" }}
            // Site CTA ink (Generate / Save dialog): zinc-900 fill, white
            // label. h-10 matches ghostIconButtonClass("md") info control.
            className={`inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 font-['Michelle',sans-serif] text-base font-medium text-white transition-opacity duration-200 hover:opacity-90 motion-reduce:transition-none ${GALLERY_FOCUS_RING}`}
          >
            Share
          </button>
        ) : null}
        {isView && galleryName ? (
          <p className="max-w-[min(50vw,16rem)] truncate text-base text-gray-500">
            {galleryName}
          </p>
        ) : null}
        <GalleryInfoButton viewOnly={isView} />
      </div>
      <GalleryRoom
        pose={pose}
        zoom={zoom}
        focusedId={focusedId}
        paintings={paintings}
        generatingId={isView ? null : generatingId}
        shimmerHues={isView ? null : shimmerHues}
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
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-4 pb-6 md:pb-8"
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
            generating={generatingId !== null}
            focusedId={focusedId}
            generationContext={generationById[focusedId]}
            canDownload={canDownload}
            onDownload={onDownload}
            openSignal={composerOpenSignal}
            onGenerate={onGenerate}
          />
        )}
      </div>
      <GalleryThumbstick
        focusedId={focusedId}
        onSelect={selectPainting}
        onZoomBy={zoomBy}
      />
      {!isView && (
        <GallerySaveDialog
          open={saveOpen}
          hangs={saveHangs}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </div>
  );
}
