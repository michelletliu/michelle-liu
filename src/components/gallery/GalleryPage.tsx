"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoBackButton from "@/components/LogoBackButton";
import { useNavigate } from "@/lib/navigation";
import GalleryActionBar from "./GalleryActionBar";
import GalleryRoom from "./GalleryRoom";
import { GALLERY_PAINTINGS } from "./galleryPaintings";
import { useGalleryCamera } from "./useGalleryCamera";

export default function GalleryPage() {
  const navigate = useNavigate();
  const { focusedId, pose, zoom, selectPainting, bindProps } =
    useGalleryCamera();
  const { ref, ...pointerBindProps } = bindProps;

  const [imageById, setImageById] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const paintings = useMemo(
    () =>
      GALLERY_PAINTINGS.map((painting) => ({
        ...painting,
        imageUrl: imageById[painting.id] ?? painting.imageUrl,
      })),
    [imageById],
  );

  const onGenerate = useCallback(
    async (prompt: string) => {
      const paintingId = focusedId;
      setGeneratingId(paintingId);
      try {
        const res = await fetch("/api/gallery/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, paintingId }),
        });
        const data = (await res.json()) as {
          imageUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.imageUrl) {
          throw new Error(data.error || "Generation failed");
        }
        setImageById((prev) => ({ ...prev, [paintingId]: data.imageUrl! }));
      } finally {
        setGeneratingId(null);
      }
    },
    [focusedId],
  );

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
      </div>
      <GalleryRoom
        pose={pose}
        zoom={zoom}
        focusedId={focusedId}
        paintings={paintings}
        generatingId={generatingId}
        onSelectPainting={selectPainting}
      />
      <GalleryActionBar
        focusedId={focusedId}
        generating={generatingId !== null}
        onGenerate={onGenerate}
      />
    </div>
  );
}
