export const GALLERY_PANEL_MORPH_MS = 180;
export const GALLERY_PANEL_CONTENT_ENTER_MS = 120;
export const GALLERY_PANEL_CONTENT_EXIT_MS = 60;

/** Existing gallery curve, retained so the shell and camera still move as one. */
export const GALLERY_PANEL_EASE = [0.4, 0, 0.2, 1] as const;

type GalleryMotionTransition = {
  duration: number;
  type?: "tween";
  ease?: typeof GALLERY_PANEL_EASE;
};

export function galleryPanelMorphTransition(
  reduceMotion: boolean,
): GalleryMotionTransition {
  return reduceMotion
    ? { duration: 0 }
    : {
        type: "tween",
        duration: GALLERY_PANEL_MORPH_MS / 1000,
        ease: GALLERY_PANEL_EASE,
      };
}

export function galleryPanelContentTransition(
  reduceMotion: boolean,
  phase: "enter" | "exit",
): GalleryMotionTransition {
  if (reduceMotion) return { duration: 0 };
  return {
    type: "tween",
    duration:
      (phase === "enter"
        ? GALLERY_PANEL_CONTENT_ENTER_MS
        : GALLERY_PANEL_CONTENT_EXIT_MS) / 1000,
  };
}
