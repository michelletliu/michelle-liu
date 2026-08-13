"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import { RotatingLoadingText } from "@/components/RotatingLoadingText";
import type { GalleryPainting, GalleryRoomPose } from "./galleryPaintings";
import type {
  GalleryFrameFit,
  GalleryFrameStyle,
} from "./galleryFrameGeometry";
import type { ShimmerHues } from "./shimmerPalette";

type GalleryRoomProps = {
  pose: GalleryRoomPose;
  zoom?: number;
  focusedId: string;
  paintings?: GalleryPainting[];
  /** Painting ids currently mid-generate — each keeps its own wall shimmer. */
  generatingIds?: ReadonlySet<string>;
  /** Shimmer palette per in-flight painting id. */
  shimmerHuesById?: Record<string, ShimmerHues | null>;
  onSelectPainting: (id: string) => void;
  onOpenComposer?: () => void;
  /** How hung images fill their apertures. Defaults to cover. */
  imageFit?: GalleryFrameFit;
  /** Outer frame treatment. Defaults to dark (Reve studio). Fine Art uses canvas. */
  frameStyle?: GalleryFrameStyle;
  /**
   * Optional centered loading copy while the WebGL chunk loads (Film-style
   * rotating phrases). Omit on Reve `/gallery` to keep the blank shell.
   */
  loadingPhrases?: readonly string[];
  /** Fired once a hang's image has decoded and been applied to its mesh. */
  onHangTextureLoad?: (id: string) => void;
};

const LoadingPhrasesContext = createContext<readonly string[] | undefined>(
  undefined,
);

function GalleryRoomLoading() {
  const phrases = useContext(LoadingPhrasesContext);
  const showCopy = Boolean(phrases && phrases.length > 0);
  return (
    <div
      className={
        showCopy
          ? "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#e4e4e4] px-8 text-center"
          : "absolute inset-0 z-10 bg-[#e4e4e4]"
      }
      role="status"
      aria-label="Loading gallery"
    >
      {showCopy ? (
        <RotatingLoadingText
          as="p"
          className="text-sm text-zinc-600"
          phrases={phrases!}
        />
      ) : null}
    </div>
  );
}

const GalleryScene = dynamic(() => import("./GalleryScene"), {
  ssr: false,
  loading: () => <GalleryRoomLoading />,
});

/** Closed white gallery box (four walls) via Three.js. */
export default function GalleryRoom({
  loadingPhrases,
  ...sceneProps
}: GalleryRoomProps) {
  return (
    <LoadingPhrasesContext.Provider value={loadingPhrases}>
      <GalleryScene {...sceneProps} />
    </LoadingPhrasesContext.Provider>
  );
}
