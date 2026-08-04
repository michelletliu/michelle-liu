export const MAT_WIDTH = 0.03;
export const FRAME_LIP_WIDTH = 0.04;

type Size = {
  width: number;
  height: number;
};

export type GalleryFrameGeometry = {
  art: Size;
  matte: Size;
  frame: Size;
};

/**
 * How a hung image sits in its aperture.
 *
 * - `contain` — letterbox to the image aspect inside the hang aperture.
 *   Used for empty canvases.
 * - `cover` — fill the aperture and crop via UVs when the image aspect
 *   differs. Used for AI-generated wall hangs.
 *
 * Both modes keep the physical white mat (`MAT_WIDTH`) between the art plane
 * and the dark frame lip — the thin ridge / inset that reads as a gallery
 * mount. Cover never means edge-to-lip; it only changes how the image fills
 * the art plane.
 */
export type GalleryFrameFit = "contain" | "cover";

export function frameGeometryForArtwork(
  maxArtWidth: number,
  maxArtHeight: number,
  imageAspect: number | null,
  fit: GalleryFrameFit = "contain",
): GalleryFrameGeometry {
  const apertureAspect = maxArtWidth / maxArtHeight;
  const validAspect =
    imageAspect !== null && Number.isFinite(imageAspect) && imageAspect > 0;

  // Cover (and unknown aspect) fill the hang aperture. Contain letterboxes.
  const art =
    fit === "cover" || !validAspect
      ? { width: maxArtWidth, height: maxArtHeight }
      : {
          width: maxArtWidth * Math.min(1, imageAspect / apertureAspect),
          height: maxArtHeight * Math.min(1, apertureAspect / imageAspect),
        };

  // White mat ridge between art and frame lip — always present.
  const matte = {
    width: art.width + MAT_WIDTH * 2,
    height: art.height + MAT_WIDTH * 2,
  };

  return {
    art,
    matte,
    frame: {
      width: matte.width + FRAME_LIP_WIDTH * 2,
      height: matte.height + FRAME_LIP_WIDTH * 2,
    },
  };
}

/**
 * UV repeat/offset so a texture covers an aperture without distortion
 * (CSS `object-fit: cover`).
 */
export function coverUvTransform(
  apertureAspect: number,
  imageAspect: number | null,
): { offsetX: number; offsetY: number; repeatX: number; repeatY: number } {
  if (
    imageAspect === null ||
    !Number.isFinite(imageAspect) ||
    imageAspect <= 0 ||
    !Number.isFinite(apertureAspect) ||
    apertureAspect <= 0
  ) {
    return { offsetX: 0, offsetY: 0, repeatX: 1, repeatY: 1 };
  }
  if (imageAspect > apertureAspect) {
    const repeatX = apertureAspect / imageAspect;
    return { offsetX: (1 - repeatX) / 2, offsetY: 0, repeatX, repeatY: 1 };
  }
  const repeatY = imageAspect / apertureAspect;
  return { offsetX: 0, offsetY: (1 - repeatY) / 2, repeatX: 1, repeatY };
}
