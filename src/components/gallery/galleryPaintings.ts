export type GalleryWall = "left" | "right" | "back" | "front";

export type GalleryPainting = {
  id: string;
  wall: GalleryWall;
  /** Hang position along its own wall, 0-based, near/left first. */
  slot: number;
  /**
   * Stable position in the walking tour. Focus stepping walks this index, so
   * the sequence is well defined even though the hangs wrap four walls and no
   * single spatial axis can order them.
   */
  order: number;
  /** Tour progress in [0, 1], derived from `order`. */
  depth: number;
  aspect: "portrait" | "landscape";
  imageUrl?: string;
};

/** Closed gallery box in world units (Y-up). */
export const GALLERY_ROOM = {
  width: 11,
  height: 4.2,
  /** Shorter than a hallway so the closed box reads as a room. */
  depth: 12,
  eyeY: 1.62,
  /** Inward offset so frames sit slightly off the wall. */
  frameInset: 0.04,
  /** Stand-off from side hangs (toward room center). */
  standOff: 4.6,
  /**
   * Distance from an end-wall hang to the eye — near the opposite wall so the
   * side hangs stay in frame without turning the space into a tunnel.
   */
  backStandOff: 10.5,
  /** Span the left/right hangs occupy along Z, leaving corner margins. */
  sideHangSpan: 6.4,
  /** Span the back/front hangs occupy along X, leaving corner margins. */
  endHangSpan: 6.6,
} as const;

export const HANGS_PER_WALL = 3;

/** Wall order around the perimeter loop. */
export const WALL_LOOP: readonly GalleryWall[] = [
  "left",
  "back",
  "right",
  "front",
];

/**
 * Direction of travel along each wall, as one continuous counter-clockwise
 * walk seen from above: down the left wall, across the back, back up the right
 * wall, then along the entrance wall to where it started. Slot 0 is always the
 * first hang met walking that way, so consecutive slots always advance to the
 * viewer's right.
 *
 * The sign necessarily flips between facing walls — left vs right, back vs
 * front — because you view each pair from opposite sides. Ordering both walls
 * of a pair by the same raw world axis is what makes one of the four navigate
 * backwards.
 */
export const WALL_TRAVEL = {
  left: { axis: "z", sign: -1 },
  back: { axis: "x", sign: 1 },
  right: { axis: "z", sign: 1 },
  front: { axis: "x", sign: -1 },
} as const satisfies Record<GalleryWall, { axis: "x" | "z"; sign: 1 | -1 }>;

const WALL_ASPECT = {
  left: "portrait",
  right: "portrait",
  back: "landscape",
  front: "landscape",
} as const satisfies Record<GalleryWall, GalleryPainting["aspect"]>;

/** 3 blank hangs on each of the four walls, 12 total, in loop order. */
export const GALLERY_PAINTINGS: GalleryPainting[] = WALL_LOOP.flatMap((wall) =>
  Array.from({ length: HANGS_PER_WALL }, (_, slot) => ({
    id: `${wall}-${slot + 1}`,
    wall,
    slot,
    aspect: WALL_ASPECT[wall],
  })),
).map((hang, index, all) => ({
  ...hang,
  order: index,
  depth: all.length > 1 ? index / (all.length - 1) : 0,
}));

export type GalleryVec3 = { x: number; y: number; z: number };

export type GalleryPaintingLayout = {
  /** Center of the canvas on the wall. */
  position: GalleryVec3;
  /** Inward-facing wall normal (unit). */
  normal: GalleryVec3;
  width: number;
  height: number;
};

/**
 * Center offset for one hang along a wall of the given span, so the hangs are
 * evenly spaced and symmetric about the wall's midpoint.
 */
export function hangOffset(
  slot: number,
  span: number,
  count: number = HANGS_PER_WALL,
): number {
  if (count <= 1) return 0;
  const clamped = Math.min(count - 1, Math.max(0, slot));
  return -span / 2 + (span / (count - 1)) * clamped;
}

export function paintingSize(aspect: GalleryPainting["aspect"]): {
  width: number;
  height: number;
} {
  return aspect === "portrait"
    ? { width: 1.15, height: 1.55 }
    : { width: 1.95, height: 1.32 };
}

export function paintingLayout(
  painting: GalleryPainting,
): GalleryPaintingLayout {
  const { width: roomW, depth: roomD, eyeY, frameInset } = GALLERY_ROOM;
  const { sideHangSpan, endHangSpan } = GALLERY_ROOM;
  const size = paintingSize(painting.aspect);

  // Position along the wall, measured in the direction the tour travels.
  const travel = WALL_TRAVEL[painting.wall];
  const span = travel.axis === "z" ? sideHangSpan : endHangSpan;
  const along = travel.sign * hangOffset(painting.slot, span);

  if (painting.wall === "left" || painting.wall === "right") {
    const isLeft = painting.wall === "left";
    return {
      position: {
        x: isLeft ? -roomW / 2 + frameInset : roomW / 2 - frameInset,
        y: eyeY,
        z: along,
      },
      normal: { x: isLeft ? 1 : -1, y: 0, z: 0 },
      ...size,
    };
  }

  const isBack = painting.wall === "back";
  return {
    position: {
      x: along,
      y: eyeY + 0.05,
      z: isBack ? -roomD / 2 + frameInset : roomD / 2 - frameInset,
    },
    normal: { x: 0, y: 0, z: isBack ? 1 : -1 },
    ...size,
  };
}

/** Tour order — the sequence focus stepping walks. */
export function paintingsByOrder(
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): GalleryPainting[] {
  return [...paintings].sort((a, b) => a.order - b.order);
}

export function paintingsByDepth(
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): GalleryPainting[] {
  return [...paintings].sort((a, b) => a.depth - b.depth);
}

export function clampProgress(progress: number): number {
  if (progress < 0) return 0;
  if (progress > 1) return 1;
  return progress;
}

export function focusedPaintingId(
  progress: number,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): string {
  const p = clampProgress(progress);
  let best = paintings[0]!;
  let bestDist = Math.abs(best.depth - p);
  for (const painting of paintings) {
    const dist = Math.abs(painting.depth - p);
    if (dist < bestDist) {
      best = painting;
      bestDist = dist;
    }
  }
  return best.id;
}

/**
 * Next/previous hang in tour order, wrapping at both ends. Stepping the
 * explicit `order` index guarantees a full cycle visits every hang exactly
 * once — ordering by a spatial axis cannot, because hangs on opposite walls
 * share the same distance from the entrance.
 */
export function adjacentPaintingId(
  focusedId: string,
  direction: -1 | 1,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): string {
  const sorted = paintingsByOrder(paintings);
  if (sorted.length === 0) return focusedId;
  const index = sorted.findIndex((p) => p.id === focusedId);
  if (index < 0) return sorted[0]!.id;
  const next = (index + direction + sorted.length) % sorted.length;
  return sorted[next]!.id;
}

export function progressForPainting(
  id: string,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): number {
  return paintings.find((p) => p.id === id)?.depth ?? 0;
}

/** World-space camera eye + look-at target. */
export type GalleryRoomPose = {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
};

/**
 * Stand in front of the focused hang and face its wall.
 * Hangs stay fixed; the camera relocates between canvases.
 */
export function roomPoseForPainting(
  id: string,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): GalleryRoomPose {
  const painting = paintings.find((p) => p.id === id) ?? paintings[0]!;
  const layout = paintingLayout(painting);
  const { standOff, backStandOff, width, depth, eyeY } = GALLERY_ROOM;

  const lookX = layout.position.x;
  const lookY = layout.position.y;
  const lookZ = layout.position.z;

  let x: number;
  const y = eyeY;
  let z: number;

  let targetLookX = lookX;
  const targetLookY = lookY;
  const targetLookZ = lookZ;

  if (painting.wall === "back" || painting.wall === "front") {
    // Stay on the room centerline so both side walls read (classic one-point).
    // The eye backs off along Z away from whichever end wall is in view.
    x = 0;
    z = painting.wall === "back" ? lookZ + backStandOff : lookZ - backStandOff;
    targetLookX = lookX * 0.35;
  } else {
    // Stand near the room center, looking straight at the hang (no Z bias).
    // That keeps the front wall on one side of the frame and the back wall on
    // the other — the closed box reads clearly instead of an open corridor.
    const towardCenter = painting.wall === "left" ? standOff : -standOff;
    x = lookX + towardCenter;
    z = lookZ;
  }

  // Keep the eye inside the box with a comfortable margin.
  const margin = 1.1;
  x = Math.min(width / 2 - margin, Math.max(-width / 2 + margin, x));
  z = Math.min(depth / 2 - margin, Math.max(-depth / 2 + margin, z));

  return {
    x,
    y,
    z,
    lookX: targetLookX,
    lookY: targetLookY,
    lookZ: targetLookZ,
  };
}

export function lerpRoomPose(
  from: GalleryRoomPose,
  to: GalleryRoomPose,
  t: number,
): GalleryRoomPose {
  const u = Math.min(1, Math.max(0, t));
  return {
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u,
    z: from.z + (to.z - from.z) * u,
    lookX: from.lookX + (to.lookX - from.lookX) * u,
    lookY: from.lookY + (to.lookY - from.lookY) * u,
    lookZ: from.lookZ + (to.lookZ - from.lookZ) * u,
  };
}

export const GALLERY_ZOOM_MIN = 0.65;
export const GALLERY_ZOOM_MAX = 2.4;
export const GALLERY_ZOOM_DEFAULT = 1;
export const GALLERY_ZOOM_STEP = 0.12;
export const GALLERY_BASE_FOV = 62;

export function clampGalleryZoom(zoom: number): number {
  if (zoom < GALLERY_ZOOM_MIN) return GALLERY_ZOOM_MIN;
  if (zoom > GALLERY_ZOOM_MAX) return GALLERY_ZOOM_MAX;
  return zoom;
}

export function fovForZoom(zoom: number): number {
  return GALLERY_BASE_FOV / clampGalleryZoom(zoom);
}
