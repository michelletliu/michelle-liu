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

export function frameGeometryForArtwork(
  maxArtWidth: number,
  maxArtHeight: number,
  imageAspect: number | null,
): GalleryFrameGeometry {
  const apertureAspect = maxArtWidth / maxArtHeight;
  const validAspect =
    imageAspect !== null && Number.isFinite(imageAspect) && imageAspect > 0;
  const art = validAspect
    ? {
        width:
          maxArtWidth * Math.min(1, imageAspect / apertureAspect),
        height:
          maxArtHeight * Math.min(1, apertureAspect / imageAspect),
      }
    : { width: maxArtWidth, height: maxArtHeight };
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
