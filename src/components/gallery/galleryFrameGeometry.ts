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

/**
 * Fractions of the source image to crop away on each side (0–0.5).
 * Used with {@link coverUvWithLetterbox} to hide baked-in black keylines.
 * Kept structurally identical to `LetterboxTrim` in `hangImageLetterbox`.
 */
export type LetterboxTrim = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const NO_LETTERBOX_TRIM: LetterboxTrim = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

/**
 * Pixel aspect of the painted content after letterbox trim.
 * `imageAspect` is full-frame width/height before cropping.
 */
export function contentAspectAfterTrim(
  imageAspect: number,
  trim: LetterboxTrim,
): number {
  const widthScale = 1 - trim.left - trim.right;
  const heightScale = 1 - trim.top - trim.bottom;
  if (widthScale <= 0 || heightScale <= 0) return imageAspect;
  return (imageAspect * widthScale) / heightScale;
}

/**
 * Extra cover crop on every hung texture (fraction of the post-letterbox
 * window). Kills 1px keylines and mipmap/filter bleed of dark edge texels that
 * detection can miss — paint always meets the white mat.
 */
export const COVER_SAFETY_INSET = 0.012;

/**
 * Cover-fit UVs that also discard a letterbox. Three.js default `flipY` puts
 * image-top at v=1, so top trim shortens repeat from the high end and bottom
 * trim raises `offsetY`.
 *
 * Always applies {@link COVER_SAFETY_INSET} after the letterbox window so the
 * aperture never samples the outermost source texels.
 */
export function coverUvWithLetterbox(
  apertureAspect: number,
  imageAspect: number | null,
  trim: LetterboxTrim = NO_LETTERBOX_TRIM,
  safetyInset: number = COVER_SAFETY_INSET,
): { offsetX: number; offsetY: number; repeatX: number; repeatY: number } {
  const contentAspect =
    imageAspect === null
      ? null
      : contentAspectAfterTrim(imageAspect, trim);
  const uv = coverUvTransform(apertureAspect, contentAspect);
  const widthScale = 1 - trim.left - trim.right;
  const heightScale = 1 - trim.top - trim.bottom;
  const inset = Math.min(0.05, Math.max(0, safetyInset));
  const innerScale = 1 - 2 * inset;
  const repeatX = uv.repeatX * widthScale * innerScale;
  const repeatY = uv.repeatY * heightScale * innerScale;
  return {
    offsetX: uv.offsetX + uv.repeatX * (trim.left + widthScale * inset),
    offsetY: uv.offsetY + uv.repeatY * (trim.bottom + heightScale * inset),
    repeatX,
    repeatY,
  };
}
