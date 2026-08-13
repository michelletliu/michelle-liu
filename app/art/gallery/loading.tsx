"use client";

import {
  PAINTING_GALLERY_LOADING_PHRASES,
  RotatingLoadingText,
} from "@/components/RotatingLoadingText";

/** Full-page shell while Sanity fetch + PaintingGalleryPage hydrate. */
export default function PaintingGalleryLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-[#e4e4e4] px-8 text-center"
      role="status"
      aria-label="Loading gallery"
    >
      <RotatingLoadingText
        as="p"
        className="text-sm text-zinc-600"
        phrases={PAINTING_GALLERY_LOADING_PHRASES}
      />
    </div>
  );
}
