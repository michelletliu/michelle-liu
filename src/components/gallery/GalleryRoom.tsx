"use client";

import dynamic from "next/dynamic";
import type { GalleryPainting, GalleryRoomPose } from "./galleryPaintings";
import type { ShimmerHues } from "./shimmerPalette";

type GalleryRoomProps = {
  pose: GalleryRoomPose;
  zoom?: number;
  focusedId: string;
  paintings?: GalleryPainting[];
  generatingId?: string | null;
  shimmerHues?: ShimmerHues | null;
  onSelectPainting: (id: string) => void;
  onOpenComposer?: () => void;
};

const GalleryScene = dynamic(() => import("./GalleryScene"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 z-10 bg-[#e4e4e4]"
      aria-label="Loading gallery"
    />
  ),
});

/** Closed white gallery box (four walls) via Three.js. */
export default function GalleryRoom(props: GalleryRoomProps) {
  return <GalleryScene {...props} />;
}
