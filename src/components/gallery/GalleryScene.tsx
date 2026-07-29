"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import * as THREE from "three";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { createWoodgrainTexture, scaleBoxUvsToWorld } from "./frameWoodgrain";
import {
  createShimmerMaterial,
  shimmerProgress,
  shimmerTimeStep,
} from "./generationShimmer";
import {
  easeHues,
  FALLBACK_HUES,
  type ShimmerHues,
} from "./shimmerPalette";
import {
  GALLERY_PAINTINGS,
  GALLERY_ROOM,
  fovForZoom,
  paintingLayout,
  type GalleryPainting,
  type GalleryRoomPose,
} from "./galleryPaintings";
import { frameGeometryForArtwork } from "./galleryFrameGeometry";

type GallerySceneProps = {
  pose: GalleryRoomPose;
  zoom?: number;
  focusedId: string;
  paintings?: GalleryPainting[];
  generatingId?: string | null;
  /**
   * Hues for the generation shimmer, from the artwork that inspired it. Null
   * for a text-only generation, or before extraction has finished, in which
   * case the shimmer's own default set is used.
   */
  shimmerHues?: ShimmerHues | null;
  onSelectPainting: (id: string) => void;
  /**
   * Double-click / double-tap on a painting. Opens the composer the same way
   * the pen button does; single-click only selects.
   */
  onOpenComposer?: () => void;
  /** Fires when the download control under the focused frame is pressed. */
  onDownload?: () => void;
};

/** Gap between a frame's bottom edge and the download control, in world units. */
const DOWNLOAD_ANCHOR_DROP = 0.16;

/** Second click on the same painting within this window opens the composer. */
const DOUBLE_CLICK_MS = 350;

type FrameEntry = {
  id: string;
  mesh: THREE.Mesh;
  frame: THREE.Mesh;
  matte: THREE.Mesh;
  /** Held directly so the focus tint can be eased without a per-frame cast. */
  frameMaterial: THREE.MeshStandardMaterial;
  /** Lit paper for a blank canvas, so it picks up the room's white. */
  blankMaterial: THREE.MeshStandardMaterial;
  /** A hung image. Unlit when focused, lit by the room when not — see `setArtLighting`. */
  artMaterial: THREE.MeshStandardMaterial;
  /** Current 0..1 focus lighting, eased toward the target each frame. */
  artLit: number;
  /** Largest artwork aperture for this hang, before aspect fitting. */
  maxArtSize: { width: number; height: number };
  /** Mesh scale that fits the current texture inside the frame undistorted. */
  artFit: { x: number; y: number };
  texture: THREE.Texture | null;
};

/** The texture's pixel aspect, or null before its image has decoded. */
function textureAspect(texture: THREE.Texture | null): number | null {
  const image = texture?.image as
    | { width?: number; height?: number }
    | undefined;
  if (!image?.width || !image?.height) return null;
  return image.width / image.height;
}

/**
 * How much of the room's irradiance an unfocused painting keeps.
 *
 * The room deliberately over-lights — ambient 1.5 plus hemisphere 1.3 — because
 * that is what makes matte white walls read as white rather than grey. Feeding
 * a texture through that irradiance at full albedo blows it out, which is the
 * "light film" the artwork was originally decoupled from the lighting to
 * escape. Scaling the albedo down by this much lands an unfocused painting a
 * little below its true value, so it shades with the room and recedes while
 * staying legible instead of turning into a white rectangle.
 *
 * The ceiling on this is clipping, not taste. Scaling the albedo does not touch
 * how the surface responds to the room — irradiance still varies with angle and
 * position, so the painting still shades — but push it high enough and the
 * bright end saturates against that over-lighting, the variation flattens out,
 * and the "light film" comes straight back.
 *
 * Measured on the same hung image, focused against unfocused: mean luma 138 vs
 * 111 and chroma 64 vs 53, with nothing clipped. Was 0.42, which measured 90
 * luma — legible, but murky enough against the white room that an unfocused
 * painting read as switched off rather than as one waiting to be walked over to.
 */
const ART_UNFOCUSED_ALBEDO = 0.66;
/** Exponential-ease time constant for the focus lighting, ~95% in 260ms. */
const ART_LIGHT_TAU = 0.088;

/**
 * Light a hung image according to how focused it is: 1 renders it unlit at
 * exactly its source values, 0 hands it entirely to the room's lights.
 *
 * Both ends come out of one material and one parameter rather than a swap
 * between a lit and an unlit material, so the transition can be eased and the
 * painting is never seen popping between two states. The two contributions are
 * complementary by construction — albedo fades out as emissive fades in — so no
 * value of `lit` double-exposes the texture.
 */
function setArtLighting(material: THREE.MeshStandardMaterial, lit: number) {
  material.emissiveIntensity = lit;
  const albedo = ART_UNFOCUSED_ALBEDO * (1 - lit);
  material.color.setScalar(albedo);
}

/**
 * Hang an image, or clear back to a blank canvas.
 *
 * Blank canvases keep their own material: they are paper, and the room's
 * ambient wash is what makes them read white, so they have no unlit state to
 * interpolate toward.
 */
function setFrameTexture(entry: FrameEntry, texture: THREE.Texture | null) {
  entry.texture = texture;
  entry.artMaterial.map = texture;
  // Driving both channels off the same texture is what lets emissive stand in
  // for the lit term exactly, rather than approximating it with a flat colour.
  entry.artMaterial.emissiveMap = texture;
  entry.artMaterial.needsUpdate = true;

  const geometry = frameGeometryForArtwork(
    entry.maxArtSize.width,
    entry.maxArtSize.height,
    textureAspect(texture),
  );
  entry.artFit = {
    x: geometry.art.width / entry.maxArtSize.width,
    y: geometry.art.height / entry.maxArtSize.height,
  };

  const previousFrameGeometry = entry.frame.geometry;
  const nextFrameGeometry = new THREE.BoxGeometry(
    geometry.frame.width,
    geometry.frame.height,
    0.06,
  );
  scaleBoxUvsToWorld(
    nextFrameGeometry,
    geometry.frame.width,
    geometry.frame.height,
    0.06,
  );
  entry.frame.geometry = nextFrameGeometry;
  previousFrameGeometry.dispose();

  const previousMatteGeometry = entry.matte.geometry;
  entry.matte.geometry = new THREE.PlaneGeometry(
    geometry.matte.width,
    geometry.matte.height,
  );
  previousMatteGeometry.dispose();

  entry.mesh.material = texture ? entry.artMaterial : entry.blankMaterial;
  // A blank canvas and the shimmer both fill the frame; only artwork is fitted.
  if (texture) entry.mesh.scale.set(entry.artFit.x, entry.artFit.y, 1);
  else entry.mesh.scale.set(1, 1, 1);
}

/**
 * White-cube palette. Planes differ by only a few values so corners stay
 * readable without the room reading gray.
 */
const WALL_BACK = 0xfdfdfd;
const WALL_SIDE = 0xfafafa;
const WALL_FRONT = 0xfafafa;
const FLOOR = 0xf6f6f6;
const CEILING = 0xfbfbfb;
const COFFER_SIDE = 0xfafafa;
/** Recessed panel at the top of each coffer, a step under the soffit grid. */
const COFFER_CAP = 0xf0f0f0;
const FRAME = 0xffffff;
/** Mid gray — the one deliberately dark note, so hangs read against white. */
const FRAME_LIP = 0xc4c4c4;
/**
 * The focused hang's frame, near-black.
 *
 * Selection used to be a 5% scale bump on the frame, which meant the geometry
 * moved every time you stepped to the next painting and the whole wall felt
 * unsettled. Colour carries the same signal while the frames stay put.
 *
 * Not pure black: the room runs a strong ambient wash and the lip keeps a
 * little metalness, so 0x000000 picks up a specular sheen and reads as an
 * uneven dark grey. Well above black for a second reason too — against a room
 * this bright, anything near it stops reading as a dark frame and starts
 * reading as a hole cut in the wall.
 *
 * Measured on the back wall, this renders at luma 86 against an unfocused lip
 * at 186 — a gap of 100, or 2.2x. Selection is carried by that gap rather than
 * by darkness, and it is far wider than it needs to be to read across a room.
 */
const FRAME_LIP_FOCUSED = 0x5a5a5a;
/**
 * Exponential-ease time constant for the focus tint, ~95% of the way in 180ms.
 * Fast enough to feel like a response to the keypress, slow enough not to snap.
 */
const FRAME_TINT_TAU = 0.06;
/** Reused every frame so the ease allocates nothing. */
const tintTarget = new THREE.Color();
/**
 * Fine molding: the baseboard at the floor and the crown line under the
 * ceiling. Kept only a step under the walls so it reads as white trim catching
 * slightly different light rather than as a grey band.
 */
const MOLDING = 0xf1f1f1;
/**
 * Structural beams at the wall junctions.
 *
 * These used to share the molding's value, which meant the two could not be
 * tuned apart — and they want opposite things. The molding is a hairline and
 * disappears if it goes dark; the beams are what tell you the room is a box,
 * and at the molding's value the corners dissolved into the walls. Two steps
 * under the molding is enough to read the corner from across the room while
 * still sitting in the white family rather than becoming a grey element.
 */
const BEAM = 0xdedede;

/** Recessed ceiling grid, matching the coffered reference. */
const COFFER = {
  cols: 6,
  rows: 6,
  /** Flat soffit width between recesses. */
  beam: 0.26,
  /** How far each recess climbs above the ceiling plane. */
  recess: 0.38,
  /** Flat top panel size as a fraction of the opening. */
  innerRatio: 0.36,
} as const;

function makeWallMaterial(color: number, roughness = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
  });
}

/**
 * How much light each bevel of a coffer keeps, in facet order (the -Z wall
 * first, then +X, +Z, -X).
 *
 * The room's lamps hang directly under the ceiling, so every bevel of every
 * coffer receives near-identical irradiance and the grid renders as one flat
 * tone — the "very flat" the ceiling was reported as. Real coffers read because
 * a room has directional light, so this bakes a fixed key from the front: the
 * bevel facing the viewer down the room stays bright, the one facing away sits
 * in shadow, and the two side bevels land between them. Baked rather than lit
 * because an actual directional light would also fall across the walls, and the
 * walls are meant to stay white.
 */
const COFFER_FACET_TONE = [1.0, 0.945, 0.885, 0.925] as const;
/** Light kept at the deepest point of a recess. Fakes the occlusion a real one has. */
const COFFER_DEPTH_TONE = 0.84;

/**
 * Inward-facing sides of one coffer: a rectangular frustum that narrows as it
 * rises. Built non-indexed so each bevel keeps its own flat normal, and carries
 * a baked shading term per vertex (see `COFFER_FACET_TONE`).
 */
function cofferSideGeometry(
  openW: number,
  openD: number,
  innerW: number,
  innerD: number,
  depth: number,
): THREE.BufferGeometry {
  const bx = openW / 2;
  const bz = openD / 2;
  const tx = innerW / 2;
  const tz = innerD / 2;

  const bottom: [number, number, number][] = [
    [-bx, 0, -bz],
    [bx, 0, -bz],
    [bx, 0, bz],
    [-bx, 0, bz],
  ];
  const top: [number, number, number][] = [
    [-tx, depth, -tz],
    [tx, depth, -tz],
    [tx, depth, tz],
    [-tx, depth, tz],
  ];

  const pos: number[] = [];
  const col: number[] = [];
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const b0 = bottom[i]!;
    const b1 = bottom[next]!;
    const t0 = top[i]!;
    const t1 = top[next]!;
    pos.push(...b0, ...t0, ...t1);
    pos.push(...b0, ...t1, ...b1);

    // Vertices at `depth` are the deep end of the recess, so they take the
    // occlusion term; vertices at the soffit plane stay open to the room.
    const facet = COFFER_FACET_TONE[i]!;
    const mouth = facet;
    const deep = facet * COFFER_DEPTH_TONE;
    for (const v of [mouth, deep, deep, mouth, deep, mouth]) {
      col.push(v, v, v);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildCofferedCeiling(
  scene: THREE.Scene,
  w: number,
  d: number,
  h: number,
): THREE.Vector3[] {
  const { cols, rows, beam, recess, innerRatio } = COFFER;
  const cellX = w / cols;
  const cellZ = d / rows;
  const openW = cellX - beam;
  const openD = cellZ - beam;
  const innerW = openW * innerRatio;
  const innerD = openD * innerRatio;

  // Ceiling plane with a square hole per coffer; the flat remainder is the grid.
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2, d / 2);
  shape.lineTo(-w / 2, d / 2);
  shape.closePath();

  const centers: [number, number][] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = -w / 2 + cellX * (i + 0.5);
      const cz = -d / 2 + cellZ * (j + 0.5);
      centers.push([cx, cz]);

      const hole = new THREE.Path();
      hole.moveTo(cx - openW / 2, cz - openD / 2);
      hole.lineTo(cx - openW / 2, cz + openD / 2);
      hole.lineTo(cx + openW / 2, cz + openD / 2);
      hole.lineTo(cx + openW / 2, cz - openD / 2);
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const soffit = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      color: CEILING,
      roughness: 0.9,
      metalness: 0,
    }),
  );
  // Shape XY maps to world XZ under +90° about X, and the normal points down.
  soffit.rotation.x = Math.PI / 2;
  soffit.position.y = h;
  scene.add(soffit);

  const sideGeo = cofferSideGeometry(openW, openD, innerW, innerD, recess);
  const sideMat = new THREE.MeshStandardMaterial({
    color: COFFER_SIDE,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
    // Multiplies the baked facet/depth shading over the base tone.
    vertexColors: true,
  });
  const topGeo = new THREE.PlaneGeometry(innerW, innerD);
  // The recessed panel sits behind the soffit grid, so it reads as the back of
  // a box rather than the brightest thing on the ceiling.
  const topMat = new THREE.MeshStandardMaterial({
    color: COFFER_CAP,
    roughness: 0.85,
    metalness: 0,
  });

  for (const [cx, cz] of centers) {
    const sides = new THREE.Mesh(sideGeo, sideMat);
    sides.position.set(cx, h, cz);
    scene.add(sides);

    const cap = new THREE.Mesh(topGeo, topMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(cx, h + recess, cz);
    scene.add(cap);
  }

  // Flush recessed downlights on the grid intersections: a shallow can sunk
  // into the soffit with only the lens sitting at the ceiling plane.
  const canGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.07, 16, 1, true);
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xe6e6e6,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const lensGeo = new THREE.CircleGeometry(0.07, 20);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.4,
    roughness: 0.25,
  });

  const lightPoints: THREE.Vector3[] = [];
  for (let i = 1; i < cols; i += 2) {
    for (let j = 1; j < rows; j += 2) {
      const cx = -w / 2 + cellX * i;
      const cz = -d / 2 + cellZ * j;

      const can = new THREE.Mesh(canGeo, canMat);
      can.position.set(cx, h + 0.035, cz);
      scene.add(can);

      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(cx, h + 0.004, cz);
      scene.add(lens);

      // Hung well below the soffit so each lamp casts a soft pool rather than
      // a pinpoint blowout on the panel it is mounted to.
      lightPoints.push(new THREE.Vector3(cx, h - 0.3, cz));
    }
  }

  return lightPoints;
}

function addBaseboard(
  scene: THREE.Scene,
  w: number,
  d: number,
  mat: THREE.Material,
) {
  const h = 0.12;
  const t = 0.04;
  // Along each wall, slightly inset
  const boards: Array<{
    geo: THREE.BufferGeometry;
    pos: [number, number, number];
    rotY?: number;
  }> = [
    {
      geo: new THREE.BoxGeometry(w - 0.02, h, t),
      pos: [0, h / 2, -d / 2 + t / 2],
    },
    {
      geo: new THREE.BoxGeometry(w - 0.02, h, t),
      pos: [0, h / 2, d / 2 - t / 2],
    },
    {
      geo: new THREE.BoxGeometry(t, h, d - 0.02),
      pos: [-w / 2 + t / 2, h / 2, 0],
    },
    {
      geo: new THREE.BoxGeometry(t, h, d - 0.02),
      pos: [w / 2 - t / 2, h / 2, 0],
    },
  ];
  for (const b of boards) {
    const mesh = new THREE.Mesh(b.geo, mat);
    mesh.position.set(...b.pos);
    scene.add(mesh);
  }
}

function buildClosedRoom(scene: THREE.Scene): THREE.Vector3[] {
  const { width: w, height: h, depth: d } = GALLERY_ROOM;
  const t = 0.1;

  // Fully dielectric: any metalness here would eat into the diffuse albedo and
  // drag the floor several values below the walls.
  const floorMat = new THREE.MeshStandardMaterial({
    color: FLOOR,
    roughness: 0.4,
    metalness: 0,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const downlights = buildCofferedCeiling(scene, w, d, h);

  // Four walls — distinct enough tones that corners read in one-point view
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    makeWallMaterial(WALL_BACK),
  );
  back.position.set(0, h / 2, -d / 2);
  scene.add(back);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    makeWallMaterial(WALL_FRONT),
  );
  front.rotation.y = Math.PI;
  front.position.set(0, h / 2, d / 2);
  scene.add(front);

  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(d, h),
    makeWallMaterial(WALL_SIDE),
  );
  left.rotation.y = Math.PI / 2;
  left.position.set(-w / 2, h / 2, 0);
  scene.add(left);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(d, h),
    makeWallMaterial(WALL_SIDE),
  );
  right.rotation.y = -Math.PI / 2;
  right.position.set(w / 2, h / 2, 0);
  scene.add(right);

  const beamMat = new THREE.MeshStandardMaterial({
    color: BEAM,
    roughness: 0.85,
  });
  const corners: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ];
  for (const [cx, cz] of corners) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), beamMat);
    beam.position.set(cx, h / 2, cz);
    scene.add(beam);
  }

  const moldingMat = new THREE.MeshStandardMaterial({
    color: MOLDING,
    roughness: 0.7,
  });
  addBaseboard(scene, w, d, moldingMat);

  // Crown molding line under the ceiling
  const crownH = 0.08;
  const crownY = h - crownH / 2;
  for (const [geo, pos] of [
    [new THREE.BoxGeometry(w, crownH, 0.04), [0, crownY, -d / 2 + 0.02]],
    [new THREE.BoxGeometry(w, crownH, 0.04), [0, crownY, d / 2 - 0.02]],
    [new THREE.BoxGeometry(0.04, crownH, d), [-w / 2 + 0.02, crownY, 0]],
    [new THREE.BoxGeometry(0.04, crownH, d), [w / 2 - 0.02, crownY, 0]],
  ] as const) {
    const mesh = new THREE.Mesh(geo, moldingMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    scene.add(mesh);
  }

  return downlights;
}

/**
 * Dispose every geometry and material reachable from the scene graph.
 *
 * The room — floor, four walls, corner beams, baseboards, crown molding, the
 * coffered soffit and the downlight cans — is built, added, and then never
 * referenced again, so the graph itself is the only thing that knows where any
 * of it is. Traversing is what makes it reachable again. Threading a
 * disposables list back out through every builder would do the same job, spread
 * across more places and easy to forget in the next one added.
 *
 * This deliberately overlaps the per-frame disposal below. Traversal only sees
 * the material a mesh is currently wearing, so a frame's blank, art or shimmer
 * material — whichever two are not showing — stay invisible to it. three.js
 * tolerates disposing twice, so covering everything from both directions is
 * cheaper than reasoning about which half owns what.
 */
function disposeSceneGraph(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const material = object.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) for (const m of material) m.dispose();
    else material.dispose();
  });
}

function buildFrames(
  paintings: GalleryPainting[],
  root: THREE.Group,
  woodgrain: THREE.Texture,
): Map<string, FrameEntry> {
  const frames = new Map<string, FrameEntry>();

  for (const painting of paintings) {
    const layout = paintingLayout(painting);
    const geometry = frameGeometryForArtwork(
      layout.width,
      layout.height,
      null,
    );
    const group = new THREE.Group();
    group.position.set(layout.position.x, layout.position.y, layout.position.z);
    if (painting.wall === "left") group.rotation.y = Math.PI / 2;
    else if (painting.wall === "right") group.rotation.y = -Math.PI / 2;
    else if (painting.wall === "front") group.rotation.y = Math.PI;

    // Outer frame lip — light gray so hangs still read on white walls
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: FRAME_LIP,
      roughness: 0.45,
      metalness: 0.08,
      // Relief only — see `frameWoodgrain` for why not roughness or bump. The
      // frame's colour is left entirely to the focus tint.
      normalMap: woodgrain,
    });
    const frameWidth = geometry.frame.width;
    const frameHeight = geometry.frame.height;
    const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, 0.06);
    scaleBoxUvsToWorld(frameGeometry, frameWidth, frameHeight, 0.06);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = 0.01;
    group.add(frame);

    const matte = new THREE.Mesh(
      new THREE.PlaneGeometry(geometry.matte.width, geometry.matte.height),
      new THREE.MeshStandardMaterial({
        color: FRAME,
        roughness: 0.7,
        metalness: 0,
      }),
    );
    matte.position.z = 0.045;
    group.add(matte);

    const blankMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
    });
    const artMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      roughness: 0.94,
      metalness: 0,
      // Keeps the focused, emissive-only state at exactly its source values if a
      // tone curve is ever switched on at the renderer.
      toneMapped: false,
    });
    setArtLighting(artMaterial, 0);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.width, layout.height),
      blankMaterial,
    );
    mesh.position.z = 0.055;
    mesh.userData.paintingId = painting.id;
    group.userData.paintingId = painting.id;
    group.add(mesh);
    root.add(group);

    frames.set(painting.id, {
      id: painting.id,
      mesh,
      frame,
      matte,
      frameMaterial,
      blankMaterial,
      artMaterial,
      artLit: 0,
      maxArtSize: { width: layout.width, height: layout.height },
      artFit: { x: 1, y: 1 },
      texture: null,
    });
  }

  return frames;
}

export default function GalleryScene({
  pose,
  zoom = 1,
  focusedId,
  paintings = GALLERY_PAINTINGS,
  generatingId = null,
  shimmerHues = null,
  onSelectPainting,
  onOpenComposer,
  onDownload,
}: GallerySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef(pose);
  const zoomRef = useRef(zoom);
  const focusedRef = useRef(focusedId);
  const generatingRef = useRef(generatingId);
  const shimmerHuesRef = useRef(shimmerHues);
  const paintingsRef = useRef(paintings);
  const onSelectRef = useRef(onSelectPainting);
  const onOpenComposerRef = useRef(onOpenComposer);
  const framesRef = useRef<Map<string, FrameEntry> | null>(null);

  const downloadRef = useRef<HTMLButtonElement>(null);
  // Scene is imported with ssr: false, so reading matchMedia here is safe.
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  poseRef.current = pose;
  zoomRef.current = zoom;
  focusedRef.current = focusedId;
  generatingRef.current = generatingId;
  shimmerHuesRef.current = shimmerHues;
  paintingsRef.current = paintings;
  onSelectRef.current = onSelectPainting;
  onOpenComposerRef.current = onOpenComposer;

  /**
   * Whether the control should exist at all is the only part React decides.
   * Where it sits is written straight to the element in the render loop: the
   * camera eases for ~780ms, and a state update per frame would re-render the
   * page 60 times a second.
   */
  const showDownload =
    Boolean(onDownload) &&
    generatingId !== focusedId &&
    paintings.some((p) => p.id === focusedId && Boolean(p.imageUrl));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcfcfc);

    const camera = new THREE.PerspectiveCamera(
      fovForZoom(zoomRef.current),
      1,
      0.08,
      80,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });

    const downlights = buildClosedRoom(scene);

    // Bright enough that every plane reads white, but deliberately short of
    // clipping: that headroom is what keeps corners, coffer facets and
    // junctions legible instead of fusing into one flat sheet of 255.
    // three.js divides these by PI on the way to the surface, so the numbers
    // read high; they land flat white surfaces at ~245-250 without clipping.
    // (toneMappingExposure is deliberately not used to get here: NoToneMapping
    // ignores it, and any tone curve would pull the highlights back down.)
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xfbfbfb, 1.3));

    // Gentle top-down gradient keeps the box from reading flat. No shadow map:
    // the walls sit nearly parallel to this light, so shadow-mapping them just
    // produces self-shadow acne that drags the whole room back toward gray.
    const key = new THREE.DirectionalLight(0xffffff, 0.4);
    key.position.set(2.5, 8, 5);
    scene.add(key);

    // Pools under the ceiling downlights — shades the coffer bevels.
    for (const point of downlights) {
      const lamp = new THREE.PointLight(0xffffff, 0.35, 7, 2);
      lamp.position.copy(point);
      scene.add(lamp);
    }

    const framesRoot = new THREE.Group();
    scene.add(framesRoot);
    // One grain for all twelve frames. Generating it per frame would be twelve
    // 512x512 canvases and twelve textures to lose track of, which is the leak
    // that used to blank the room; per-frame UVs give the variety instead.
    const woodgrain = createWoodgrainTexture();
    woodgrain.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const frames = buildFrames(paintingsRef.current, framesRoot, woodgrain);
    framesRef.current = frames;

    /*
     * Decoding outlives the mount easily, and generated images arrive as
     * multi-megabyte base64 data URLs. Writing one onto a torn-down entry
     * strands it: nothing holds the entry any more, so nothing will ever
     * dispose it.
     */
    let cancelled = false;

    // Apply any images already present when the scene boots.
    for (const painting of paintingsRef.current) {
      if (!painting.imageUrl) continue;
      const entry = frames.get(painting.id);
      if (!entry) continue;
      const url = painting.imageUrl;
      new THREE.TextureLoader().load(url, (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        setFrameTexture(entry, tex);
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastPaintingClick: { id: string | null; time: number } = {
      id: null,
      time: 0,
    };

    const resize = () => {
      const { clientWidth: cw, clientHeight: ch } = mount;
      if (cw < 1 || ch < 1) return;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const shimmer = createShimmerMaterial();
    /** Wall-clock start of the current generation, or `null` when idle. */
    let shimmerStartedAt: number | null = null;
    const clock = new THREE.Clock();
    const anchor = new THREE.Vector3();
    const camForward = new THREE.Vector3();
    const toAnchor = new THREE.Vector3();

    /**
     * Pin the download control under the focused frame. Called after each
     * render so it tracks the camera ease and any zoom change, and written
     * directly to the element rather than through React.
     */
    const positionDownloadControl = (focused: string) => {
      const el = downloadRef.current;
      if (!el) return;

      const hide = () => {
        el.style.visibility = "hidden";
        el.style.opacity = "0";
      };

      const painting = paintingsRef.current.find((p) => p.id === focused);
      if (!painting) {
        hide();
        return;
      }

      const layout = paintingLayout(painting);
      anchor.set(
        layout.position.x + layout.normal.x * 0.06,
        layout.position.y - layout.height / 2 - DOWNLOAD_ANCHOR_DROP,
        layout.position.z + layout.normal.z * 0.06,
      );

      // project() happily returns coordinates for points behind the camera, so
      // the hemisphere test has to come first or the button ghosts over the room.
      camera.getWorldDirection(camForward);
      toAnchor.copy(anchor).sub(camera.position);
      if (toAnchor.dot(camForward) <= 0) {
        hide();
        return;
      }

      anchor.project(camera);
      const offScreen =
        anchor.z > 1 || Math.abs(anchor.x) > 1 || Math.abs(anchor.y) > 1;
      if (offScreen) {
        hide();
        return;
      }

      const { clientWidth: cw, clientHeight: ch } = renderer.domElement;
      const x = (anchor.x * 0.5 + 0.5) * cw;
      const y = (-anchor.y * 0.5 + 0.5) * ch;
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, 0)`;
      el.style.visibility = "visible";
      el.style.opacity = "1";
    };

    let raf = 0;
    const tick = () => {
      const delta = clock.getDelta();
      const p = poseRef.current;
      camera.position.set(p.x, p.y, p.z);
      camera.lookAt(p.lookX, p.lookY, p.lookZ);
      camera.fov = fovForZoom(zoomRef.current);
      camera.updateProjectionMatrix();

      const focused = focusedRef.current;
      const generating = generatingRef.current;

      // Only burn shader time while something is actually generating.
      if (generating !== null && frames.has(generating)) {
        shimmer.uniforms.uTime.value += shimmerTimeStep(delta, reduceMotion);
        // Clock starts on the first frame of each generation and is cleared
        // below, so a second run begins pale again rather than resuming at the
        // previous depth. It is bound to the generating canvas, not the focused
        // one, so moving focus mid-flight does not disturb it.
        shimmerStartedAt ??= performance.now();
        shimmer.uniforms.uProgress.value = shimmerProgress(
          performance.now() - shimmerStartedAt,
        );
        easeHues(
          shimmer.uniforms.uHues.value,
          shimmerHuesRef.current ?? FALLBACK_HUES,
          delta,
        );
      } else if (shimmerStartedAt !== null) {
        shimmerStartedAt = null;
        shimmer.uniforms.uProgress.value = 0;
        // Back to the default set between runs, so a text-only generation that
        // follows an inspired one does not open on the previous artwork's hues.
        shimmer.uniforms.uHues.value.set(...FALLBACK_HUES);
      }

      for (const [id, entry] of frames) {
        const isFocused = id === focused;
        const isGenerating = id === generating;
        entry.mesh.position.z = isFocused ? 0.08 : 0.055;

        // Selection is colour only. The frame's geometry is identical in both
        // states, so stepping along a wall never resizes anything.
        tintTarget.set(isFocused ? FRAME_LIP_FOCUSED : FRAME_LIP);
        if (reduceMotion) {
          entry.frameMaterial.color.copy(tintTarget);
        } else {
          entry.frameMaterial.color.lerp(
            tintTarget,
            1 - Math.exp(-delta / FRAME_TINT_TAU),
          );
        }

        // Straight assignment each frame, never a new material: generating wins,
        // then a hung image, then blank paper. Because the surface is chosen
        // rather than mutated, a failed or aborted generation drops back to a
        // clean canvas on its own — no opacity or shader state can get stuck.
        const surface = isGenerating
          ? shimmer
          : entry.texture
            ? entry.artMaterial
            : entry.blankMaterial;
        if (entry.mesh.material !== surface) {
          entry.mesh.material = surface;
          // The shimmer and a blank canvas are the canvas itself, so they fill
          // the frame; a hung image keeps whatever fit its shape needs.
          const fit = surface === entry.artMaterial ? entry.artFit : null;
          entry.mesh.scale.set(fit?.x ?? 1, fit?.y ?? 1, 1);
        }

        // Approaching a painting lights it: the focused one renders unlit at its
        // true values, everything else is left to the room. Eased rather than
        // switched, so stepping along a wall reads as the light coming up on the
        // next canvas instead of two paintings swapping appearance on one frame.
        const litTarget = isFocused ? 1 : 0;
        entry.artLit = reduceMotion
          ? litTarget
          : entry.artLit +
            (litTarget - entry.artLit) * (1 - Math.exp(-delta / ART_LIGHT_TAU));
        setArtLighting(entry.artMaterial, entry.artLit);

        if (!entry.texture) {
          entry.blankMaterial.color.set(isFocused ? 0xffffff : 0xf3f3f3);
        }
      }

      renderer.render(scene, camera);
      positionDownloadControl(focused);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        [...frames.values()].map((f) => f.mesh),
        false,
      );
      const id = hits[0]?.object.userData.paintingId as string | undefined;
      if (!id) return;
      onSelectRef.current(id);
      /*
       * One path for desktop double-click and mobile double-tap: both surface
       * as successive click events on the canvas. A native `dblclick` listener
       * would miss many touch devices.
       */
      const now = performance.now();
      if (
        lastPaintingClick.id === id &&
        now - lastPaintingClick.time < DOUBLE_CLICK_MS
      ) {
        lastPaintingClick = { id: null, time: 0 };
        onOpenComposerRef.current?.();
      } else {
        lastPaintingClick = { id, time: now };
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      shimmer.dispose();
      // Materials do not own their maps, so disposing the frame materials
      // leaves this behind. It is shared by all twelve, hence disposed here.
      woodgrain.dispose();
      for (const entry of frames.values()) {
        entry.texture?.dispose();
        entry.blankMaterial.dispose();
        entry.artMaterial.dispose();
      }
      disposeSceneGraph(scene);

      renderer.dispose();
      /*
       * dispose() only clears three.js's own caches; the WebGL context itself
       * stays live until the browser garbage-collects the canvas, which it is
       * in no hurry to do. Navigation here is client-side, so without this a
       * few round trips through /gallery pile up contexts until Chrome hits its
       * limit and force-loses the oldest — and the room comes back blank.
       */
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      framesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const frames = framesRef.current;
    if (!frames) return;

    /*
     * Covers unmount and ordering in one flag. A new url for a frame can only
     * arrive as a change to `paintings`, which tears this closure down before
     * running the next one — so a callback that finds itself cancelled is
     * either orphaned by unmount or superseded by a later request, and in both
     * cases the right move is to drop the texture. Without it, two loads for
     * the same frame race and whichever decodes last wins, regardless of which
     * was asked for last.
     */
    let cancelled = false;

    for (const painting of paintings) {
      const entry = frames.get(painting.id);
      if (!entry) continue;

      const url = painting.imageUrl;
      if (!url) {
        if (entry.texture) {
          entry.texture.dispose();
          setFrameTexture(entry, null);
        }
        continue;
      }

      const prev = entry.texture?.userData.url as string | undefined;
      if (prev === url) continue;

      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        entry.texture?.dispose();
        setFrameTexture(entry, tex);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [paintings]);

  return (
    <div className="absolute inset-0 z-10 h-full w-full">
      <div
        ref={mountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="3D gallery room"
      />
      {showDownload && (
        <button
          ref={downloadRef}
          type="button"
          data-gallery-no-drag
          onClick={onDownload}
          aria-label="Download the generated image on this canvas"
          style={{
            visibility: "hidden",
            opacity: 0,
            // Only opacity transitions: the transform is rewritten every frame
            // to track the camera, so easing it would smear the anchor.
            transition: reduceMotion ? "none" : "opacity 180ms ease-out",
          }}
          className={ghostIconButtonClass(
            "sm",
            `absolute left-0 top-0 z-20 border border-black/10 bg-white/90 text-zinc-500 shadow-[0_4px_16px_rgba(0,0,0,0.10)] backdrop-blur-sm hover:bg-white hover:text-zinc-700 ${GALLERY_FOCUS_RING}`,
          )}
        >
          <Download size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}
