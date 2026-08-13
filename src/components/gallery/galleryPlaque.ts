import * as THREE from "three";
import {
  FRAME_LIP_WIDTH,
  MAT_WIDTH,
  frameGeometryForArtwork,
} from "./galleryFrameGeometry.ts";
import {
  fovForZoom,
  paintingLayout,
  sizeOfPainting,
  type GalleryPainting,
  type GalleryRoomPose,
  type GalleryVec3,
} from "./galleryPaintings.ts";

/**
 * Gap between the hang bottom (frame lip or canvas edge) and the top of the
 * wall plaque, in world units. Small enough to read as a museum label under
 * the hang.
 */
export const PLAQUE_GAP = 0.12;

export type PlaqueWorldOptions = {
  /** Mat ridge width; defaults to the studio {@link MAT_WIDTH}. */
  matWidth?: number;
  /** Outer lip width; defaults to the studio {@link FRAME_LIP_WIDTH}. */
  lipWidth?: number;
};

/**
 * World point on the wall just under a hang — the plaque anchor.
 * Uses frame/mat bands when provided (studio / light molding); Fine Art
 * canvas passes zero bands so the anchor sits under the stretcher bottom.
 * Nudges slightly into the room so it clears the wall plane.
 */
export function plaqueWorldPoint(
  painting: GalleryPainting,
  options: PlaqueWorldOptions = {},
): GalleryVec3 {
  const layout = paintingLayout(painting);
  const size = sizeOfPainting(painting);
  const imageAspect = size.width / size.height;
  const geometry = frameGeometryForArtwork(
    size.width,
    size.height,
    imageAspect,
    "contain",
    {
      matWidth: options.matWidth ?? MAT_WIDTH,
      lipWidth: options.lipWidth ?? FRAME_LIP_WIDTH,
    },
  );
  const frameHalfH = geometry.frame.height / 2;
  // Sit just proud of the wall, level with the frame face.
  const inset = 0.08;
  return {
    x: layout.position.x + layout.normal.x * inset,
    y: layout.position.y - frameHalfH - PLAQUE_GAP,
    z: layout.position.z + layout.normal.z * inset,
  };
}

export type ScreenPoint = {
  /** CSS px from the left of the viewport. */
  x: number;
  /** CSS px from the top of the viewport. */
  y: number;
  /** False when the anchor is behind the camera or far outside the frustum. */
  visible: boolean;
};

export type PlaqueCaptionPhase = {
  /** Freeze copy + settled screen anchor for the hang-switch ease. */
  freeze: boolean;
  /** Target opacity; CSS transitions handle the fade. */
  opacity: 0 | 1;
};

/**
 * Camera hang-to-hang ease (`EASE_MS` in useGalleryCamera). Corner / wall-to-wall
 * caption hides stay aligned with the full ease.
 */
export const PLAQUE_CAPTION_HIDE_CORNER_MS = 780;
/**
 * Same-wall neighbor steps: visual travel is short, so the plaque can return
 * before the camera ease finishes (~200–350ms).
 */
export const PLAQUE_CAPTION_HIDE_SAME_WALL_MS = 280;
/** CSS opacity transition after the hide window clears. */
export const PLAQUE_CAPTION_FADE_MS = 200;

/** True when both hangs share a wall (flat neighbor step, not a corner turn). */
export function isSameWallHangSwitch(
  from: Pick<GalleryPainting, "wall"> | null | undefined,
  to: Pick<GalleryPainting, "wall"> | null | undefined,
): boolean {
  return Boolean(from && to && from.wall === to.wall);
}

/** How long the plaque stays frozen/hidden for a hang switch. */
export function plaqueCaptionHideMs(sameWall: boolean): number {
  return sameWall
    ? PLAQUE_CAPTION_HIDE_SAME_WALL_MS
    : PLAQUE_CAPTION_HIDE_CORNER_MS;
}

/**
 * Hang-switch plaque phase from a caption-hide signal (often derived from
 * `isFocusEasing`, but same-wall steps may clear earlier than the camera ease).
 *
 * Freezing + fading for focus switches avoids a live abspos label tracking to
 * the viewport edge on narrow mobile (CSS shrink-to-fit collapse). Zoom /
 * framing leave the hide signal false so the plaque can track.
 */
export function plaqueCaptionPhase(input: {
  isFocusEasing: boolean;
  liveVisible: boolean;
  textureReady: boolean;
}): PlaqueCaptionPhase {
  const freeze = input.isFocusEasing;
  return {
    freeze,
    opacity: !freeze && input.liveVisible && input.textureReady ? 1 : 0,
  };
}

/**
 * Project a room-space point through the gallery camera into CSS viewport
 * coordinates. Reuses one Three.js camera so callers can tick this every frame
 * while the pose eases.
 */
export function createGalleryProjector() {
  const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 80);
  const vec = new THREE.Vector3();

  return function projectRoomPointToScreen(
    point: GalleryVec3,
    pose: GalleryRoomPose,
    zoom: number,
    viewportWidth: number,
    viewportHeight: number,
  ): ScreenPoint | null {
    if (viewportWidth < 1 || viewportHeight < 1) return null;
    if (
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.z)
    ) {
      return null;
    }

    camera.fov = fovForZoom(zoom);
    camera.aspect = viewportWidth / viewportHeight;
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    vec.set(point.x, point.y, point.z).project(camera);

    const x = (vec.x * 0.5 + 0.5) * viewportWidth;
    const y = (-vec.y * 0.5 + 0.5) * viewportHeight;
    // three.js NDC z is in [-1, 1] when in front of the near plane and inside
    // the frustum depth; outside that, hide rather than pin to an edge.
    const inDepth = vec.z >= -1 && vec.z <= 1;
    const inView =
      inDepth &&
      vec.x > -1.35 &&
      vec.x < 1.35 &&
      vec.y > -1.35 &&
      vec.y < 1.35;

    return { x, y, visible: inView };
  };
}

/** Frame stack thickness used when sizing gaps — exported for tests. */
export const PLAQUE_FRAME_PAD = (MAT_WIDTH + FRAME_LIP_WIDTH) * 2;
