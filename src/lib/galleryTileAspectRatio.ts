import { extractSanityDimensions } from "./sanityImageDimensions.ts";

/** Beyond this relative difference from the tile ratio, cropping would cut real content. */
const MAX_CROP_DEVIATION = 0.15;

const ratioOf = (src: string): number | undefined => {
  const { width, height } = extractSanityDimensions(src);
  return width && height ? width / height : undefined;
};

/**
 * Grid galleries render every tile at one shared aspect ratio so mixed crops
 * line up. Use the most common ratio among the images (ties go to whichever
 * appears first) so the fewest images get cropped.
 */
export function galleryTileAspectRatio(srcs: readonly string[]): number | undefined {
  const counts = new Map<string, { ratio: number; count: number }>();

  for (const src of srcs) {
    const ratio = ratioOf(src);
    if (!ratio) continue;
    const key = ratio.toFixed(2);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { ratio, count: 1 });
  }

  let best: { ratio: number; count: number } | undefined;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.ratio;
}

/** Whether an image is close enough to the tile shape to fill it by cropping. */
export function galleryImageCoversTile(src: string, tileAspectRatio: number): boolean {
  const ratio = ratioOf(src);
  if (!ratio) return true;
  return Math.abs(ratio - tileAspectRatio) / tileAspectRatio <= MAX_CROP_DEVIATION;
}
