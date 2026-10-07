import { extractSanityDimensions } from "./sanityImageDimensions.ts";

/**
 * Grid galleries render every tile at one shared aspect ratio so mixed crops
 * line up. Use the most common ratio among the images (ties go to whichever
 * appears first) so the fewest images get cropped.
 */
export function galleryTileAspectRatio(srcs: readonly string[]): string | undefined {
  const counts = new Map<string, { ratio: string; count: number; first: number }>();

  srcs.forEach((src, index) => {
    const { width, height } = extractSanityDimensions(src);
    if (!width || !height) return;
    const key = (width / height).toFixed(2);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { ratio: `${width} / ${height}`, count: 1, first: index });
  });

  let best: { ratio: string; count: number; first: number } | undefined;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count || (entry.count === best.count && entry.first < best.first)) {
      best = entry;
    }
  }
  return best?.ratio;
}
