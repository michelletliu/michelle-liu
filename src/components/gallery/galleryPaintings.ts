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
  /**
   * Optional hang aperture in world units. When set, layout and camera framing
   * use this instead of the portrait/landscape presets — for real artworks
   * whose aspect does not match the 3:4 / 3:2 generate ratios.
   */
  size?: { width: number; height: number };
  /**
   * How many hangs share this painting's wall. Drives spacing; defaults to
   * {@link HANGS_PER_WALL}.
   */
  wallCount?: number;
  /**
   * World-axis center along the wall (`x` on end walls, `z` on side walls).
   * When set, overrides span/slot placement — Fine Art uses this so corner
   * clearances match the gaps between variable-width frames.
   */
  along?: number;
  imageUrl?: string;
};

/** Closed gallery box in world units (Y-up). */
export const GALLERY_ROOM = {
  width: 11,
  height: 4.2,
  /** Shorter than a hallway so the closed box reads as a room. */
  depth: 12,
  /**
   * Hang + camera height. Mid-wall so the largest canvases read vertically
   * centered on the plane (museum “eye level” on a 4.2 wall).
   */
  eyeY: 2.1,
  /** Inward offset so frames sit slightly off the wall. */
  frameInset: 0.04,
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

/**
 * World size of the paint aperture. Matched exactly to the `3:4` / `3:2`
 * generate ratios so hung textures cover the plane without residual
 * letterboxing from a 1–1.5% aspect mismatch.
 */
export function paintingSize(aspect: GalleryPainting["aspect"]): {
  width: number;
  height: number;
} {
  return aspect === "portrait"
    ? { width: 1.1625, height: 1.55 } // 3:4
    : { width: 1.98, height: 1.32 }; // 3:2
}

/** Hang aperture for a painting — custom size when present, else aspect preset. */
export function sizeOfPainting(painting: GalleryPainting): {
  width: number;
  height: number;
} {
  if (
    painting.size &&
    Number.isFinite(painting.size.width) &&
    Number.isFinite(painting.size.height) &&
    painting.size.width > 0 &&
    painting.size.height > 0
  ) {
    return painting.size;
  }
  return paintingSize(painting.aspect);
}

/**
 * Wall span between outermost hang *centers* so that — for uniform frame
 * widths — the clear gap from frame edge to corner equals the clear gap
 * between adjacent frames.
 *
 * Derivation: corner margin `(L−S)/2 − W/2` equals inter-gap `S/(N−1) − W`
 * → `S = (L + W) · (N−1) / (N+1)`.
 */
export function hangSpanForWall(
  wall: GalleryWall,
  count: number = HANGS_PER_WALL,
): number {
  if (count <= 1) return 0;
  const isSide = wall === "left" || wall === "right";
  const wallLength = isSide ? GALLERY_ROOM.depth : GALLERY_ROOM.width;
  const aspect: GalleryPainting["aspect"] = isSide ? "portrait" : "landscape";
  // FRAME_LIP matches the outer pad used by camera framing (mat + lip ≈).
  const outerW = paintingSize(aspect).width + FRAME_LIP;
  const span = ((wallLength + outerW) * (count - 1)) / (count + 1);
  const maxSpan = Math.max(0, wallLength - outerW - 0.2);
  return Math.min(span, maxSpan);
}

/**
 * Hang centers along a wall axis so every clear gap is equal: corner → frame
 * edges → corner. `outerWidths` are full outer frame widths in travel order
 * (slot 0 first). `travelSign` matches {@link WALL_TRAVEL}.
 */
export function hangCentersEqualGap(
  outerWidths: readonly number[],
  wallLength: number,
  travelSign: 1 | -1,
): number[] {
  const n = outerWidths.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const sumW = outerWidths.reduce((a, b) => a + b, 0);
  const gap = Math.max(0.08, (wallLength - sumW) / (n + 1));
  const centers: number[] = [];

  if (travelSign === 1) {
    let edge = -wallLength / 2 + gap;
    for (const w of outerWidths) {
      centers.push(edge + w / 2);
      edge += w + gap;
    }
  } else {
    let edge = wallLength / 2 - gap;
    for (const w of outerWidths) {
      centers.push(edge - w / 2);
      edge -= w + gap;
    }
  }
  return centers;
}

export function paintingLayout(
  painting: GalleryPainting,
): GalleryPaintingLayout {
  const { width: roomW, depth: roomD, eyeY, frameInset } = GALLERY_ROOM;
  const size = sizeOfPainting(painting);
  const wallCount = painting.wallCount ?? HANGS_PER_WALL;

  // Position along the wall, measured in the direction the tour travels.
  const travel = WALL_TRAVEL[painting.wall];
  const span = hangSpanForWall(painting.wall, wallCount);
  const along =
    painting.along != null && Number.isFinite(painting.along)
      ? painting.along
      : travel.sign * hangOffset(painting.slot, span, wallCount);

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

export const GALLERY_ZOOM_MIN = 0.65;
export const GALLERY_ZOOM_MAX = 2.8;
export const GALLERY_ZOOM_DEFAULT = 1;
export const GALLERY_ZOOM_STEP = 0.18;
export const GALLERY_BASE_FOV = 62;

export function clampGalleryZoom(zoom: number): number {
  // A non-finite zoom would spread NaN through the pose and into the camera
  // matrix, and three.js renders nothing at all from that — a blank room.
  if (!Number.isFinite(zoom)) return GALLERY_ZOOM_DEFAULT;
  if (zoom < GALLERY_ZOOM_MIN) return GALLERY_ZOOM_MIN;
  if (zoom > GALLERY_ZOOM_MAX) return GALLERY_ZOOM_MAX;
  return zoom;
}

/**
 * Fraction of a zoom taken as a narrower lens; the rest is a dolly. Zooming
 * only the lens leaves the viewer stranded across the room, and dollying in at
 * the full 62° splays the walls as the eye closes on the canvas.
 */
const ZOOM_FOV_SHARE = 0.35;

export function fovForZoom(zoom: number): number {
  return GALLERY_BASE_FOV / Math.pow(clampGalleryZoom(zoom), ZOOM_FOV_SHARE);
}

/** Size the scene's frame lip adds around a canvas, per dimension. */
const FRAME_LIP = 0.12;
/** Share of the viewport height a framed hang covers at rest. */
const REST_FILL = 0.3;
/**
 * Ceiling on that share, so zooming can never crop the frame or push the
 * control that hangs under it off screen.
 */
const MAX_FILL = 0.85;
/**
 * Narrowest viewport planned for; a wide hang must still fit across it.
 *
 * A floor on the assumed aspect, not a substitute for it. Standing back far
 * enough to fit a landscape hang across a 1.3 viewport is the right answer on
 * a 1.3 viewport and too far back on anything wider, where the width the room
 * is being framed against is width the viewport actually has. Held as a floor
 * rather than dropped because a viewport narrower than this — a phone held
 * upright — wants the eye further back still, and pushing it there is a
 * different framing question than this one.
 */
const MIN_VIEWPORT_ASPECT = 1.3;
/**
 * Floor on the dolly, whatever a zoom or a canvas size asks for. The scene's
 * near plane is 0.08 and a frame stands ~0.1 proud of its wall, so an eye
 * closer than this clips the artwork away instead of filling the view with it.
 */
const MIN_STAND_OFF = 0.6;

/**
 * How far off the wall the eye stands to frame a hang. Derived from the canvas
 * and the lens rather than fixed per wall, so a hang covers the same share of
 * the viewport wherever it hangs, and zoom walks the viewer toward it instead
 * of only tightening the lens.
 */
export function standOffForPainting(
  aspect: GalleryPainting["aspect"],
  zoom: number = GALLERY_ZOOM_DEFAULT,
  viewportAspect: number = MIN_VIEWPORT_ASPECT,
  sizeOverride?: { width: number; height: number },
): number {
  const size = sizeOverride ?? paintingSize(aspect);
  const fill = Math.min(MAX_FILL, REST_FILL * clampGalleryZoom(zoom));
  const halfFrame = Math.tan((fovForZoom(zoom) * Math.PI) / 360);
  const byHeight = (size.height + FRAME_LIP) / (2 * fill * halfFrame);
  const byWidth =
    (size.width + FRAME_LIP) /
    (2 * fill * halfFrame * planningAspect(viewportAspect));
  return Math.max(byHeight, byWidth, MIN_STAND_OFF);
}

/**
 * The aspect the width fit is solved against: the viewport's own, once it is
 * known to be a usable number, and never narrower than the viewport this was
 * planned for.
 */
export function planningAspect(viewportAspect: number): number {
  if (!Number.isFinite(viewportAspect)) return MIN_VIEWPORT_ASPECT;
  return Math.max(MIN_VIEWPORT_ASPECT, viewportAspect);
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
 * Lateral nudge of the framed view along the wall (world units).
 * `0` keeps the eye and look square on the hang's own center.
 */
export const FRAMING_LATERAL_BIAS = 0;

/**
 * Stand in front of the focused hang and face it.
 * Hangs stay fixed; the camera relocates between canvases.
 *
 * The eye backs off along the wall normal from the hang center
 * (`FRAMING_LATERAL_BIAS` is zero), so the focused canvas sits in screen
 * center. Anchoring the eye to the wall's midpoint instead — as the end
 * walls used to, for a one-point view of the room — centers only the middle
 * hang of a wall and leaves its neighbours off to one side by the full hang
 * spacing.
 */
export function roomPoseForPainting(
  id: string,
  zoom: number = GALLERY_ZOOM_DEFAULT,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
  viewportAspect: number = MIN_VIEWPORT_ASPECT,
): GalleryRoomPose {
  const painting = paintings.find((p) => p.id === id) ?? paintings[0]!;
  const layout = paintingLayout(painting);
  const { width, depth, eyeY, frameInset } = GALLERY_ROOM;

  // Same lateral nudge on eye and look keeps the view square on the wall.
  const travel = WALL_TRAVEL[painting.wall];
  const lateral = FRAMING_LATERAL_BIAS * travel.sign;
  const lookX =
    layout.position.x + (travel.axis === "x" ? lateral : 0);
  const lookY = layout.position.y;
  const lookZ =
    layout.position.z + (travel.axis === "z" ? lateral : 0);

  // Bound the dolly along the wall normal rather than bounding x and z apart.
  // The eye only ever travels that one axis, so a distance bound keeps it both
  // inside the box and square with the canvas, where independent axis clamps
  // could slide it off the hang's own center and undo the framing.
  const margin = 1.1;
  const acrossRoom = layout.normal.x !== 0 ? width : depth;
  const standOff = Math.min(
    Math.max(
      standOffForPainting(
        painting.aspect,
        zoom,
        viewportAspect,
        sizeOfPainting(painting),
      ),
      MIN_STAND_OFF,
    ),
    acrossRoom - frameInset - margin,
  );

  return {
    x: lookX + layout.normal.x * standOff,
    y: eyeY,
    z: lookZ + layout.normal.z * standOff,
    lookX,
    lookY,
    lookZ,
  };
}

/**
 * Gap kept between the top of an occluding UI band and the bottom of the
 * frame, so the frame clears the band rather than resting exactly on it.
 */
export const FRAMING_BREATHING_PX = 16;

/**
 * Share of the gap above the frame the lift may spend.
 *
 * Buying room under the frame by pushing its top edge off screen is not
 * showing the whole frame, so there has to be a ceiling on this. Half rather
 * than all of it, because spending all of it is what a hang zoomed up to fill
 * the viewport would do: the panel covers more of it than any offset could
 * recover, and the lift would answer by jamming the frame against the top of
 * the window for a few px of the bottom edge it still could not uncover.
 *
 * A share rather than a px count so it scales with the framing it is bounding
 * — generous where the hang is small in the viewport and there is room to
 * move, close to nothing where it already fills the screen.
 */
export const FRAMING_HEADROOM_SHARE = 0.5;

/**
 * How close to the floor or the ceiling this offset may drive the eye.
 *
 * Nothing else in the room moves the eye off `eyeY` — the dolly runs along the
 * wall normal and the stand-off clamp bounds it there — so vertical travel had
 * no bound at all before this offset existed and this is it.
 */
const FRAMING_EYE_MARGIN = 0.5;

/** The viewport, and the UI band covering the bottom of it. All CSS px. */
export type GalleryFraming = {
  viewportHeightPx: number;
  occlusionPx: number;
  /**
   * Optional so a caller that only cares about the bottom band does not have
   * to measure across as well; without it the stand-off falls back to planning
   * for `MIN_VIEWPORT_ASPECT`, which is what it did before it could ask.
   */
  viewportWidthPx?: number;
};

/**
 * Viewport aspect to frame against, or `MIN_VIEWPORT_ASPECT` until both sides
 * of it have been measured.
 */
export function framingViewportAspect(
  framing: GalleryFraming | null,
): number {
  if (!framing) return MIN_VIEWPORT_ASPECT;
  const { viewportWidthPx: w, viewportHeightPx: h } = framing;
  if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
    return MIN_VIEWPORT_ASPECT;
  }
  if (!Number.isFinite(h) || h <= 0) return MIN_VIEWPORT_ASPECT;
  return planningAspect(w / h);
}

/**
 * Bound on the vertical framing offset, in world units. Signed, so a future
 * offset that raises the eye is held off the ceiling by the same margin that
 * holds this one off the floor.
 */
export function clampFramingDrop(drop: number): number {
  if (!Number.isFinite(drop)) return 0;
  const { eyeY, height } = GALLERY_ROOM;
  const maxDown = Math.max(0, eyeY - FRAMING_EYE_MARGIN);
  const maxUp = Math.max(0, height - FRAMING_EYE_MARGIN - eyeY);
  if (drop > maxDown) return maxDown;
  if (drop < -maxUp) return -maxUp;
  return drop;
}

/**
 * How far to drop the camera so a band of UI along the bottom of the viewport
 * stops covering the bottom of the focused frame.
 *
 * Measured rather than chosen: the pose's own stand-off and lens give world
 * units per viewport pixel on the plane the canvas hangs in, which converts
 * the band's real pixel height into the world distance that clears it. A fixed
 * number cannot do this — the same panel hides a different amount of frame at
 * every zoom, on every viewport, and between the two panel heights.
 */
export function framingDropForPose(
  pose: GalleryRoomPose,
  painting: GalleryPainting,
  zoom: number,
  framing: GalleryFraming | null,
): number {
  if (!framing) return 0;
  const { viewportHeightPx: viewH, occlusionPx } = framing;
  if (!Number.isFinite(viewH) || viewH <= 0) return 0;
  if (!Number.isFinite(occlusionPx) || occlusionPx <= 0) return 0;

  // Read the distance back off the pose rather than recomputing it. The
  // stand-off is clamped against the room on the way in, and measuring the
  // pose that survived that clamp is what keeps this in step with it.
  const distance = Math.hypot(pose.x - pose.lookX, pose.z - pose.lookZ);
  if (distance <= 0) return 0;

  const worldPerPx =
    (2 * distance * Math.tan((fovForZoom(zoom) * Math.PI) / 360)) / viewH;
  if (!(worldPerPx > 0)) return 0;

  // The pose aims at the canvas center, so the frame sits vertically centered
  // and the clear band under it is the same height as the one over it.
  const size = sizeOfPainting(painting);
  const frameHalfPx = (size.height + FRAME_LIP) / 2 / worldPerPx;
  const clearPx = viewH / 2 - frameHalfPx;
  if (clearPx <= 0) return 0;

  const coveredPx = occlusionPx + FRAMING_BREATHING_PX - clearPx;
  if (coveredPx <= 0) return 0;

  const liftPx = Math.min(coveredPx, clearPx * FRAMING_HEADROOM_SHARE);
  if (liftPx <= 0) return 0;

  /*
   * And never drop the eye past the bottom of the frame, whatever the pixels
   * ask for. It is the viewer that moves here, and below that edge they are no
   * longer level with the art but under it, looking up at it.
   *
   * This is what binds on a short viewport, where a panel taking half the
   * screen asks for more than framing can honestly give — clearing it outright
   * on a 560px window would put the eye at knee height. Capped, most of the
   * frame comes out from under the panel rather than all of it.
   */
  const frameBottomY = pose.lookY - (size.height + FRAME_LIP) / 2;
  const drop = Math.min(liftPx * worldPerPx, pose.y - frameBottomY);
  if (drop <= 0) return 0;

  return clampFramingDrop(drop);
}

/**
 * `roomPoseForPainting`, lowered far enough that a band of UI along the bottom
 * of the viewport stops covering the focused frame.
 *
 * Eye and target drop together, so the view stays level and the hang rises in
 * the viewport. Tilting the camera down instead — moving only the target —
 * would lift the frame just as well and keystone it doing so, and a canvas
 * rendered as a trapezoid is the one distortion a gallery cannot afford.
 *
 * The hangs themselves never move. They are hung on the walls of a closed room
 * against its molding and its coffered ceiling, and lifting twelve of them to
 * uncover one would cost the room its symmetry.
 */
export function framedRoomPose(
  id: string,
  zoom: number = GALLERY_ZOOM_DEFAULT,
  framing: GalleryFraming | null = null,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): GalleryRoomPose {
  const pose = roomPoseForPainting(
    id,
    zoom,
    paintings,
    framingViewportAspect(framing),
  );
  if (!framing) return pose;

  const painting = paintings.find((p) => p.id === id) ?? paintings[0]!;
  const drop = framingDropForPose(pose, painting, zoom, framing);
  if (drop === 0) return pose;

  return { ...pose, y: pose.y - drop, lookY: pose.lookY - drop };
}

/**
 * Sampler for `cubic-bezier(0.4, 0, 0.2, 1)`, the curve the action bar expands
 * and collapses on.
 *
 * The framing move happens at the same moment as the panel's own and over the
 * same span, and on a different curve the two read as one gesture that cannot
 * keep time — the camera arriving early while the panel is still growing.
 */
export function easeWithPanel(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const axis = (s: number, p1: number, p2: number) => {
    const u = 1 - s;
    return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s;
  };
  const slope = (s: number, p1: number, p2: number) => {
    const u = 1 - s;
    return 3 * u * u * p1 + 6 * u * s * (p2 - p1) + 3 * s * s * (1 - p2);
  };

  // Newton on x(s) = t. The curve is monotonic in x and t is a good first
  // guess, so this is well inside a pixel after a handful of passes.
  let s = t;
  for (let i = 0; i < 6; i++) {
    const dx = slope(s, 0.4, 0.2);
    if (dx === 0) break;
    const error = axis(s, 0.4, 0.2) - t;
    if (Math.abs(error) < 1e-6) break;
    s = Math.min(1, Math.max(0, s - error / dx));
  }
  return axis(s, 0, 1);
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