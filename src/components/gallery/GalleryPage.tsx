"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoBackButton from "@/components/LogoBackButton";
import { useNavigate } from "@/lib/navigation";
import GalleryActionBar from "./GalleryActionBar";
import GalleryInfoButton from "./GalleryInfoButton";
import GalleryRoom from "./GalleryRoom";
import GalleryThumbstick from "./GalleryThumbstick";
import { downloadImage, generatedImageFilename } from "./downloadImage";
import { GALLERY_PAINTINGS } from "./galleryPaintings";
import { resolveShimmerHues, type ShimmerHues } from "./shimmerPalette";
import { useGalleryCamera, useMeasuredHeight } from "./useGalleryCamera";

export default function GalleryPage() {
  const navigate = useNavigate();
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

  const [imageById, setImageById] = useState<Record<string, string>>({});
  /** Artwork that inspired each canvas, kept for the download filename. */
  const [inspirationById, setInspirationById] = useState<
    Record<string, string>
  >({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  /** Hues for the in-flight shimmer, from the artwork that inspired it. */
  const [shimmerHues, setShimmerHues] = useState<ShimmerHues | null>(null);

  const paintings = useMemo(
    () =>
      GALLERY_PAINTINGS.map((painting) => ({
        ...painting,
        imageUrl: imageById[painting.id] ?? painting.imageUrl,
      })),
    [imageById],
  );

  const onGenerate = useCallback(
    async (
      prompt: string,
      inspiration?: { objectID: number; title: string },
    ) => {
      const paintingId = focusedId;
      setGeneratingId(paintingId);
      // Deliberately not awaited. The shimmer opens on its default hues and
      // eases onto the artwork's when they land, because making the canvas
      // wait on an image decode to start animating would trade the whole point
      // of the shimmer for a detail almost nobody would notice arriving late.
      setShimmerHues(null);
      if (inspiration) void resolveShimmerHues(inspiration.objectID).then(setShimmerHues);
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
        setInspirationById((prev) => ({
          ...prev,
          [paintingId]: inspiration?.title ?? "",
        }));
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
        inspirationTitle: inspirationById[focusedId] || null,
        imageUrl,
      }),
    );
  }, [focusedId, imageById, inspirationById]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <div
      ref={ref}
      className="fixed inset-0 touch-none overflow-hidden bg-[#e4e4e4] text-zinc-900"
      {...pointerBindProps}
    >
      <div data-gallery-no-drag className="relative z-40">
        <LogoBackButton onClick={() => navigate("/")} />
        <GalleryInfoButton />
      </div>
      <GalleryRoom
        pose={pose}
        zoom={zoom}
        focusedId={focusedId}
        paintings={paintings}
        generatingId={generatingId}
        shimmerHues={shimmerHues}
        onSelectPainting={selectPainting}
        onDownload={onDownload}
      />
      {/* Ignores pointer events itself so the room stays draggable through the
          gaps either side of the bar. */}
      <div
        ref={bottomStack.ref}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-4 pb-6 md:pb-8"
      >
        <GalleryActionBar
          generating={generatingId !== null}
          onGenerate={onGenerate}
        />
      </div>
      <GalleryThumbstick
        focusedId={focusedId}
        onSelect={selectPainting}
        onZoomBy={zoomBy}
      />
    </div>
  );
}
