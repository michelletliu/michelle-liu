import {
  GALLERY_ROOM,
  WALL_LOOP,
  WALL_TRAVEL,
  hangCentersEqualGap,
  type GalleryPainting,
  type GalleryWall,
} from "./galleryPaintings.ts";

export type ArtGalleryHangSource = {
  id: string;
  imageUrl: string;
  /** width / height; falls back to portrait if missing. */
  aspectRatio?: number;
  title?: string;
  /** Same string the lightbox shows — medium, size, year. */
  detail?: string;
  /** Raw Sanity size string, e.g. `30" x 40"`, for proportional world scale. */
  size?: string;
};

export type ArtGalleryHang = GalleryPainting & {
  title?: string;
  detail?: string;
};

/** Portrait long edge; landscape short edge stays near the AI gallery scale. */
const PORTRAIT_HEIGHT = 1.5;
const LANDSCAPE_WIDTH = 1.85;

/** World long-edge clamps so relative physical scale still fits the room. */
const MIN_WORLD_LONG = 0.65;
const MAX_WORLD_LONG = 2.15;

/**
 * Shrink frames slightly when a wall is crowded so hangs don't collide.
 */
function apertureScale(wallCount: number): number {
  if (wallCount <= 3) return 1;
  if (wallCount === 4) return 0.88;
  if (wallCount === 5) return 0.78;
  return 0.7;
}

/**
 * Parse a Sanity size string into two positive inch dimensions.
 * Accepts `30" x 40"`, `24 × 18`, `10"x8"`, optional `in`/`inches`.
 * Order is preserved but only the long edge is used for scale — image
 * aspect still drives hang shape.
 */
export function parsePhysicalSizeInches(
  size: string | undefined | null,
): { width: number; height: number } | null {
  if (!size || typeof size !== "string") return null;
  const match = size.match(
    /(\d+(?:\.\d+)?)\s*(?:["″]|in(?:ch(?:es)?)?)?\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:["″]|in(?:ch(?:es)?)?)?/,
  );
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  return { width, height };
}

/** Longer physical edge in inches — drives relative world scale. */
export function physicalLongEdgeInches(
  dims: { width: number; height: number },
): number {
  return Math.max(dims.width, dims.height);
}

export function medianNumber(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/**
 * World aperture sized to the painting's aspect, within gallery-scale bounds.
 */
export function apertureForImageAspect(
  imageAspect: number,
  scale = 1,
): { width: number; height: number } {
  const a = Number.isFinite(imageAspect) && imageAspect > 0 ? imageAspect : 0.75;
  const clamped = Math.max(0.4, Math.min(3.2, a));
  if (clamped >= 1) {
    const width = LANDSCAPE_WIDTH * scale;
    return { width, height: width / clamped };
  }
  const height = PORTRAIT_HEIGHT * scale;
  return { width: height * clamped, height };
}

/**
 * Clamp an aperture so its long edge sits in [min, max] without distorting.
 */
export function clampApertureLongEdge(
  size: { width: number; height: number },
  minLong = MIN_WORLD_LONG,
  maxLong = MAX_WORLD_LONG,
): { width: number; height: number } {
  const long = Math.max(size.width, size.height);
  if (!(long > 0) || !Number.isFinite(long)) return size;
  if (long < minLong) {
    const s = minLong / long;
    return { width: size.width * s, height: size.height * s };
  }
  if (long > maxLong) {
    const s = maxLong / long;
    return { width: size.width * s, height: size.height * s };
  }
  return size;
}

/**
 * Aspect-correct aperture scaled by physical long edge relative to a
 * collection reference (typically the median long edge). Unknown sizes
 * use relative = 1 (current gallery baseline × crowding).
 */
export function apertureForPhysicalProportion(
  imageAspect: number,
  physicalLongInches: number | null,
  referenceLongInches: number | null,
  crowdScale = 1,
): { width: number; height: number } {
  let relative = 1;
  if (
    physicalLongInches != null &&
    physicalLongInches > 0 &&
    referenceLongInches != null &&
    referenceLongInches > 0
  ) {
    relative = physicalLongInches / referenceLongInches;
  }
  const raw = apertureForImageAspect(imageAspect, crowdScale * relative);
  return clampApertureLongEdge(raw);
}

/**
 * Spread N hangs across the four walls as evenly as possible (extras go to
 * earlier walls in tour order so the entrance wall stays lightest).
 */
export function wallCountsForTotal(total: number): Record<GalleryWall, number> {
  const n = Math.max(0, total);
  const base = Math.floor(n / WALL_LOOP.length);
  const rem = n % WALL_LOOP.length;
  const counts = {} as Record<GalleryWall, number>;
  WALL_LOOP.forEach((wall, i) => {
    counts[wall] = base + (i < rem ? 1 : 0);
  });
  return counts;
}

/**
 * Build a full-room hang list from Fine Art paintings. Frame count matches the
 * collection; apertures follow each work's aspect and physical size when known.
 */
export function buildArtGalleryHangs(
  sources: ArtGalleryHangSource[],
): ArtGalleryHang[] {
  if (sources.length === 0) return [];

  const physicalLongs = sources.map((source) => {
    const dims = parsePhysicalSizeInches(source.size);
    return dims ? physicalLongEdgeInches(dims) : null;
  });
  const referenceLong = medianNumber(
    physicalLongs.filter((v): v is number => v != null && v > 0),
  );

  const counts = wallCountsForTotal(sources.length);
  const hangs: ArtGalleryHang[] = [];
  let sourceIndex = 0;
  // Gallery-wrap canvas: outer hang size is the art aperture (no mat/lip pad).
  const frameOuterPad = 0;

  for (const wall of WALL_LOOP) {
    const wallCount = counts[wall];
    const crowdScale = apertureScale(wallCount);
    const batch: ArtGalleryHang[] = [];
    for (let slot = 0; slot < wallCount; slot++) {
      const source = sources[sourceIndex]!;
      const physicalLong = physicalLongs[sourceIndex]!;
      sourceIndex += 1;
      const aspectRatio = source.aspectRatio ?? 0.75;
      const size = apertureForPhysicalProportion(
        aspectRatio,
        physicalLong,
        referenceLong,
        crowdScale,
      );
      batch.push({
        id: source.id,
        wall,
        slot,
        wallCount,
        order: hangs.length + batch.length,
        depth: 0,
        aspect: aspectRatio >= 1 ? "landscape" : "portrait",
        size,
        imageUrl: source.imageUrl,
        title: source.title,
        detail: source.detail,
      });
    }

    // Equal clear gaps: corner ↔ frames ↔ corner (matches inter-painting gap).
    const wallLength =
      wall === "left" || wall === "right"
        ? GALLERY_ROOM.depth
        : GALLERY_ROOM.width;
    const outerWidths = batch.map((h) => (h.size?.width ?? 1) + frameOuterPad);
    const centers = hangCentersEqualGap(
      outerWidths,
      wallLength,
      WALL_TRAVEL[wall].sign,
    );
    for (let i = 0; i < batch.length; i++) {
      hangs.push({ ...batch[i]!, along: centers[i] });
    }
  }

  const last = hangs.length - 1;
  return hangs.map((hang, index) => ({
    ...hang,
    order: index,
    depth: last > 0 ? index / last : 0,
  }));
}
