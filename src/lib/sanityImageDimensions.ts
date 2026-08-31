/**
 * Sanity image URLs encode the source dimensions in the asset filename
 * (e.g. `<hash>-1920x1080.webp`). Extract them so we can set `width` /
 * `height` on the underlying `<img>` and have the browser reserve aspect-ratio
 * space before bytes arrive — without this, lazy-loaded images render with
 * zero intrinsic height and the shimmer wrapper collapses to 0px.
 *
 * Cropped assets keep the original size in the filename but display as
 * `rect=x,y,w,h`. Prefer the crop so the frame hugs the painted image
 * instead of letterboxing the original canvas.
 */
export function extractSanityDimensions(
  src: unknown,
): { width?: number; height?: number } {
  if (typeof src !== "string") return {};

  const rectMatch = src.match(/[?&]rect=(\d+),(\d+),(\d+),(\d+)/i);
  if (rectMatch) {
    return { width: Number(rectMatch[3]), height: Number(rectMatch[4]) };
  }

  const match = src.match(/-(\d+)x(\d+)\.[a-z]+(?:\?|$)/i);
  if (!match) return {};
  return { width: Number(match[1]), height: Number(match[2]) };
}
