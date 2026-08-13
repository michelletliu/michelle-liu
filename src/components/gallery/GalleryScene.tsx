"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createWoodgrainTexture, scaleBoxUvsToWorld } from "./frameWoodgrain";
import {
  createCanvasWeaveNormalMap,
  createStretcherContactShadowMap,
} from "./canvasStretcherMaps";
import {
  createShimmerMaterial,
  shimmerProgress,
  shimmerTimeStep,
  type ShimmerMaterial,
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
import {
  ART_CORNER_RADIUS,
  ART_CORNER_RADIUS_LIGHT,
  artPlaneGeometry,
} from "./artPlaneGeometry";
import {
  CANVAS_CORNER_RADIUS,
  coverUvTransform,
  coverUvWithLetterbox,
  frameBandsForStyle,
  frameGeometryForArtwork,
  openFrontRoundedBoxGeometry,
  NO_LETTERBOX_TRIM,
  type GalleryFrameFit,
  type GalleryFrameStyle,
} from "./galleryFrameGeometry";
import {
  detectDarkLetterboxTrim,
  readImageRgba,
} from "./hangImageLetterbox";

type GallerySceneProps = {
  pose: GalleryRoomPose;
  zoom?: number;
  focusedId: string;
  paintings?: GalleryPainting[];
  /** Painting ids currently mid-generate — each keeps its own wall shimmer. */
  generatingIds?: ReadonlySet<string>;
  /**
   * Hues for each in-flight shimmer, from the artwork that inspired it. Missing
   * / null entries use the shimmer's own default set.
   */
  shimmerHuesById?: Record<string, ShimmerHues | null>;
  onSelectPainting: (id: string) => void;
  onOpenComposer?: () => void;
  /**
   * How hung images fill their apertures. AI gallery and Fine Art canvas both
   * use `cover` (crop to fill); empty canvases still letterbox via contain.
   */
  imageFit?: GalleryFrameFit;
  /**
   * Outer frame treatment. Defaults to `dark` (Reve studio woodgrain).
   * Fine Art passes `canvas` for gallery-wrapped white stretcher (no lip/mat).
   */
  frameStyle?: GalleryFrameStyle;
  /** Fired once a hang's image has decoded and been applied to its mesh. */
  onHangTextureLoad?: (id: string) => void;
};

type FrameEntry = {
  id: string;
  mesh: THREE.Mesh;
  /**
   * Sits just behind the art plane during a dissolve-in so shimmer or blank
   * paper stays visible while the new texture opacity rises.
   */
  underlay: THREE.Mesh;
  frame: THREE.Mesh;
  matte: THREE.Mesh;
  /** Held directly so the focus tint can be eased without a per-frame cast. */
  frameMaterial: THREE.MeshStandardMaterial;
  /** Mat ridge width used when rebuilding frame geometry after a hang. */
  matWidth: number;
  /** Outer lip width used when rebuilding frame geometry after a hang. */
  lipWidth: number;
  /** Box depth of the outer frame rail / canvas stretcher. */
  boxDepth: number;
  /**
   * Gallery-wrap stretcher: omit the solid front face so white thickness only
   * reads on the sides (a closed box front reads as a mat around the art).
   */
  openFront: boolean;
  /** Resting art-plane z (into the room) — just proud of the lip front face. */
  artZ: number;
  /** Underlay z, just behind {@link artZ}. */
  underlayZ: number;
  /** Unfocused / focused lip albedo for the focus tint ease. */
  lipColor: number;
  lipFocusedColor: number;
  /** Lit paper for a blank canvas, so it picks up the room's white. */
  blankMaterial: THREE.MeshStandardMaterial;
  /** A hung image. Unlit when focused, lit by the room when not — see `setArtLighting`. */
  artMaterial: THREE.MeshStandardMaterial;
  /** Per-canvas shimmer so concurrent gens don't share one progress/hue clock. */
  shimmerMaterial: ShimmerMaterial;
  /** Wall-clock start of this canvas's current generation, or null when idle. */
  shimmerStartedAt: number | null;
  /**
   * Keep the wet-paint shimmer up after `generatingIds` clears until the new
   * image has decoded and dissolved in — otherwise the canvas pops to the old
   * hang (or blank) for a frame between gen-end and texture-ready.
   */
  holdShimmerForReveal: boolean;
  /** True while a newly hung texture is fading opacity 0→1 over the underlay. */
  revealActive: boolean;
  /** 0 = fully transparent art (underlay only), 1 = fully opaque hang. */
  revealProgress: number;
  /** Current 0..1 focus lighting, eased toward the target each frame. */
  artLit: number;
  /** Largest artwork aperture for this hang, before aspect fitting. */
  maxArtSize: { width: number; height: number };
  /**
   * Mesh scale for the hung image. Generated fills keep `{1,1}` and crop via
   * texture UVs; empty canvases also sit at full aperture.
   */
  artFit: { x: number; y: number };
  texture: THREE.Texture | null;
};

const EMPTY_GENERATING_IDS: ReadonlySet<string> = new Set();

/** The texture's pixel aspect, or null before its image has decoded. */
function textureAspect(texture: THREE.Texture | null): number | null {
  const image = texture?.image as
    | { width?: number; height?: number }
    | undefined;
  if (!image?.width || !image?.height) return null;
  return image.width / image.height;
}

/**
 * How the room lights touch paintings that are not focused.
 *
 * Unfocused hangs must sit in the same lighting path as the walls — no leftover
 * emissive wash, and tone-mapped like everything else — or they read as bright
 * cutouts pasted on the room. Focused hangs go fully emissive / un-tonemapped
 * so the pigment lands at its source values.
 *
 * Albedo stays high enough that side hangs read as room-lit pigment, not crushed
 * grey. A leftover emissive wash made them glow; keep wash at 0.
 */
const ART_ROOM_LIT_ALBEDO = 0.88;
/** Unfocused = pure room light. Any leftover wash made side canvases glow. */
const ART_UNFOCUSED_SOURCE_WASH = 0;
/**
 * Side hangs sit at this opacity so the white mat shows through and they read
 * lighter / softer than the focused canvas. Eases to 1 with focus.
 */
const ART_UNFOCUSED_OPACITY = 0.72;
/**
 * Blank paper under room light. Always lit (no emissive path) — focus only
 * lifts albedo toward pure white. Unfocused stays near the wall family so empty
 * side hangs read as soft paper, not muddy grey slabs (~0xe8 was too dark).
 */
const BLANK_FOCUSED_ALBEDO = 1;
const BLANK_UNFOCUSED_ALBEDO = 0.975;
/** Exponential-ease time constant for the focus lighting, ~95% in 260ms. */
const ART_LIGHT_TAU = 0.088;
/**
 * Soft dissolve when a new hang lands: art opacity 0→1 over the underlay
 * (shimmer after generate, blank paper otherwise). Long enough to read as a
 * dissolve, short enough not to feel sluggish after a long remix wait.
 */
const ART_REVEAL_DURATION_S = 0.4;
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
  material.emissiveIntensity =
    ART_UNFOCUSED_SOURCE_WASH +
    (1 - ART_UNFOCUSED_SOURCE_WASH) * lit;
  const albedo = ART_ROOM_LIT_ALBEDO * (1 - lit);
  material.color.setScalar(albedo);
  // Side hangs share the room's tone-mapped path; the focused one opts out so
  // source colours arrive unchanged. Flip mid-ease once emissive already owns
  // the look, so the switch is not a visible pop.
  material.toneMapped = lit < 0.5;
}

/** Blank paper: room-lit at both ends; `lit` only eases how white the sheet is. */
function setBlankLighting(material: THREE.MeshStandardMaterial, lit: number) {
  material.color.setScalar(
    BLANK_UNFOCUSED_ALBEDO +
      (BLANK_FOCUSED_ALBEDO - BLANK_UNFOCUSED_ALBEDO) * lit,
  );
}

/**
 * Drive hung-art opacity for dissolve-in and the unfocused fade. Below 1 the
 * material is transparent so the underlay / white mat reads through; at 1 it
 * returns to the opaque path so depth write and sorting stay clean.
 */
function setArtRevealOpacity(
  material: THREE.MeshStandardMaterial,
  opacity: number,
) {
  const next = Math.min(1, Math.max(0, opacity));
  const transparent = next < 0.999;
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    material.depthWrite = !transparent;
    material.needsUpdate = true;
  }
  material.opacity = transparent ? next : 1;
}

/** Focused = 1; unfocused = `ART_UNFOCUSED_OPACITY`. */
function focusArtOpacity(lit: number): number {
  return ART_UNFOCUSED_OPACITY + (1 - ART_UNFOCUSED_OPACITY) * lit;
}

/**
 * Hang an image, or clear back to a blank canvas.
 *
 * Blank canvases keep their own material: they are paper, and the room's
 * ambient wash is what makes them read white, so they have no unlit state to
 * interpolate toward.
 *
 * Generated hangs use `cover`: the art plane fills the hang aperture and
 * mismatched aspects crop through texture UVs — the same idea as CSS
 * `object-fit: cover`. The white mat ridge between art and frame lip stays
 * on both cover and contain. Met inspiration tiles in the composer are
 * separate DOM and untouched here.
 *
 * Fine Art canvas wraps also use `cover` so paint fills the stretcher front
 * with no letterbox mat; apertures are still aspect-sized per work.
 *
 * New textures start a soft opacity dissolve (`revealActive`); clearing a hang
 * snaps back with no fade.
 */
function setFrameTexture(
  entry: FrameEntry,
  texture: THREE.Texture | null,
  imageFit: GalleryFrameFit = "cover",
) {
  entry.texture = texture;
  entry.artMaterial.map = texture;
  // Driving both channels off the same texture is what lets emissive stand in
  // for the lit term exactly, rather than approximating it with a flat colour.
  entry.artMaterial.emissiveMap = texture;
  entry.artMaterial.needsUpdate = true;

  const aspect = textureAspect(texture);
  // Hung images default to cover; blank canvases letterbox.
  const fit: GalleryFrameFit = texture ? imageFit : "contain";
  const geometry = frameGeometryForArtwork(
    entry.maxArtSize.width,
    entry.maxArtSize.height,
    aspect,
    fit,
    { matWidth: entry.matWidth, lipWidth: entry.lipWidth },
  );
  entry.artFit = {
    x: geometry.art.width / entry.maxArtSize.width,
    y: geometry.art.height / entry.maxArtSize.height,
  };

  if (texture) {
    if (fit === "cover") {
      const apertureAspect =
        entry.maxArtSize.width / entry.maxArtSize.height;
      // Fine Art gallery-wrap: full-bleed cover, no keyline safety crop — that
      // inset reads as a hairline mat against the open stretcher. Reve keeps
      // dark-letterbox detection + COVER_SAFETY_INSET for model keylines.
      const uv = entry.openFront
        ? coverUvTransform(apertureAspect, aspect)
        : (() => {
            const image = texture.image as
              | (CanvasImageSource & { width: number; height: number })
              | undefined;
            const sampled = image ? readImageRgba(image) : null;
            const trim = sampled
              ? detectDarkLetterboxTrim(
                  sampled.width,
                  sampled.height,
                  sampled.data,
                )
              : NO_LETTERBOX_TRIM;
            return coverUvWithLetterbox(apertureAspect, aspect, trim);
          })();
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.offset.set(uv.offsetX, uv.offsetY);
      texture.repeat.set(uv.repeatX, uv.repeatY);
    } else {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(1, 1);
    }
    // Dissolve in over shimmer/blank; the tick loop owns opacity + underlay.
    // Reduced-motion users skip the crossfade entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      entry.revealProgress = 1;
      entry.revealActive = false;
      entry.holdShimmerForReveal = false;
      entry.underlay.visible = false;
      setArtRevealOpacity(entry.artMaterial, 1);
    } else {
      entry.revealProgress = 0;
      entry.revealActive = true;
      setArtRevealOpacity(entry.artMaterial, 0);
    }
  } else {
    entry.revealActive = false;
    entry.revealProgress = 1;
    entry.holdShimmerForReveal = false;
    entry.underlay.visible = false;
    setArtRevealOpacity(entry.artMaterial, 1);
  }

  const previousFrameGeometry = entry.frame.geometry;
  const nextFrameGeometry = entry.openFront
    ? openFrontRoundedBoxGeometry(
        geometry.frame.width,
        geometry.frame.height,
        entry.boxDepth,
        CANVAS_CORNER_RADIUS,
        { openBack: true },
      )
    : new THREE.BoxGeometry(
        geometry.frame.width,
        geometry.frame.height,
        entry.boxDepth,
      );
  if (!entry.openFront) {
    scaleBoxUvsToWorld(
      nextFrameGeometry,
      geometry.frame.width,
      geometry.frame.height,
      entry.boxDepth,
    );
  }
  entry.frame.geometry = nextFrameGeometry;
  previousFrameGeometry.dispose();


  const previousMatteGeometry = entry.matte.geometry;
  // Canvas paper is a sharp rect behind rounded paint so corner crescents stay
  // white paper (not wall/AO). Framed modes keep a rectangular mat ridge.
  entry.matte.geometry = new THREE.PlaneGeometry(
    geometry.matte.width,
    geometry.matte.height,
  );
  previousMatteGeometry.dispose();

  entry.mesh.material = texture ? entry.artMaterial : entry.blankMaterial;
  // Cover fills keep scale at 1; blank canvases also fill the aperture.
  entry.mesh.scale.set(entry.artFit.x, entry.artFit.y, 1);
  entry.underlay.scale.set(entry.artFit.x, entry.artFit.y, 1);
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
 * Fine Art light molding — pure white. Dimension comes from room lighting,
 * contact AO, rabbet, and box side faces — not from a cream / warm tint.
 */
const FRAME_LIP_LIGHT = 0xffffff;
/** Soft focus step for light frames — cool near-white, no cream. */
const FRAME_LIP_LIGHT_FOCUSED = 0xf5f5f5;
/**
 * Gallery-wrap stretcher sides (Fine Art). Room ambient is very bright, so
 * pure #fff sides blast and read as a fake white mat. Soft cool gray lets
 * key/point lights carve thickness without a front-face rim.
 */
const CANVAS_STRETCHER = 0xcfcfcf;
/** Focused stretcher — slight lift, still clearly off-white / shadowed. */
const CANVAS_STRETCHER_FOCUSED = 0xdddddd;
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
  woodgrain: THREE.Texture | null,
  frameStyle: GalleryFrameStyle = "dark",
  canvasWeave: THREE.Texture | null = null,
  stretcherContactMap: THREE.Texture | null = null,
): Map<string, FrameEntry> {
  const frames = new Map<string, FrameEntry>();
  const { matWidth, lipWidth, boxDepth } = frameBandsForStyle(frameStyle);
  const isCanvas = frameStyle === "canvas";
  const isLight = frameStyle === "light";
  // Light molding stays near-white; canvas stretcher uses a softer gray so
  // side faces read as shadowed thickness. Dark uses woodgrain.
  const isWhiteBody = isCanvas || isLight;
  const lipColor = isCanvas
    ? CANVAS_STRETCHER
    : isLight
      ? FRAME_LIP_LIGHT
      : FRAME_LIP;
  const lipFocusedColor = isCanvas
    ? CANVAS_STRETCHER_FOCUSED
    : isLight
      ? FRAME_LIP_LIGHT_FOCUSED
      : FRAME_LIP_FOCUSED;
  // Frame / canvas box centered at this z. Mat + art sit just proud of the
  // lip front — the rail is a solid box (no hole), so anything behind
  // frameFrontZ is occluded. Keep the proud offset tiny so off-axis views do
  // not read the canvas as stuck on top of the molding (the old 0.055/0.08
  // lifts did). Gallery-wrap art sits nearly flush with the stretcher face.
  const frameCenterZ = 0.01;
  const frameFrontZ = frameCenterZ + boxDepth / 2;
  // Canvas: paper backing just behind paint (no solid box front). Framed: mat
  // ridge sits between lip front and art.
  const matteZ = frameFrontZ + (isCanvas ? 0.001 : 0.002);
  const underlayZ = frameFrontZ + (isCanvas ? 0.0015 : 0.003);
  const artZ = frameFrontZ + (isCanvas ? 0.002 : 0.004);

  for (const painting of paintings) {
    const layout = paintingLayout(painting);
    const geometry = frameGeometryForArtwork(
      layout.width,
      layout.height,
      null,
      "contain",
      { matWidth, lipWidth },
    );
    const group = new THREE.Group();
    group.position.set(layout.position.x, layout.position.y, layout.position.z);
    if (painting.wall === "left") group.rotation.y = Math.PI / 2;
    else if (painting.wall === "right") group.rotation.y = -Math.PI / 2;
    else if (painting.wall === "front") group.rotation.y = Math.PI;

    // Outer body — dark woodgrain lip (studio), light molding, or gallery-wrap
    // stretcher (Fine Art canvas). Canvas sides are matte off-white so room
    // lights carve thickness; pure #fff + strong ambient read as a fake mat.
    // Vertex colours bake the corner tuck; weave normal is cloth relief only.
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: isCanvas ? 0.92 : isLight ? 0.62 : 0.45,
      metalness: isWhiteBody ? 0 : 0.08,
      vertexColors: isCanvas,
      // Relief only on dark frames — woodgrain reads muddy on near-white.
      ...(woodgrain && !isWhiteBody ? { normalMap: woodgrain } : {}),
      ...(isCanvas && canvasWeave
        ? { normalMap: canvasWeave, normalScale: new THREE.Vector2(0.55, 0.55) }
        : {}),
    });
    const frameWidth = geometry.frame.width;
    const frameHeight = geometry.frame.height;
    const frameGeometry = isCanvas
      ? openFrontRoundedBoxGeometry(
          frameWidth,
          frameHeight,
          boxDepth,
          CANVAS_CORNER_RADIUS,
          { openBack: true },
        )
      : new THREE.BoxGeometry(frameWidth, frameHeight, boxDepth);
    if (!isCanvas) {
      scaleBoxUvsToWorld(frameGeometry, frameWidth, frameHeight, boxDepth);
    }
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = frameCenterZ;
    group.add(frame);

    // Soft wall contact. Light molding uses oversized planes; canvas uses an
    // exact-footprint map with inward falloff so AO cannot read as a rim.
    if (isLight) {
      const wallBackZ = frameCenterZ - boxDepth / 2 - 0.002;
      // Tight core under the rail + softer outer falloff (real contact AO).
      const contactCore = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth * 1.01, frameHeight * 1.01),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        }),
      );
      contactCore.position.z = wallBackZ;
      contactCore.raycast = () => {};
      group.add(contactCore);
      const contactVeil = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth * 1.045, frameHeight * 1.045),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.035,
          depthWrite: false,
        }),
      );
      contactVeil.position.z = wallBackZ - 0.001;
      contactVeil.raycast = () => {};
      group.add(contactVeil);
    } else if (isCanvas && stretcherContactMap) {
      const wallBackZ = frameCenterZ - boxDepth / 2 - 0.0015;
      // Tiny oversize + map falloff: enough for a grazing contact hint without
      // the old 1.045× veil that read as a light-gray rectangular frame.
      const contact = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth * 1.006, frameHeight * 1.006),
        new THREE.MeshBasicMaterial({
          map: stretcherContactMap,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
        }),
      );
      contact.position.z = wallBackZ;
      contact.raycast = () => {};
      group.add(contact);
    }

    // Inner rabbet + outer edge darkening — light molding only (not canvas).
    if (isLight) {
      // Inner rabbet: thin dark band where molding meets the mat — the soft
      // self-shadow of a real lip edge. Fixed value (not focus-tinted).
      const rabbet = Math.min(lipWidth * 0.28, 0.008);
      const rabbetMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      });
      const rabbetZ = frameFrontZ + 0.0008;
      const matteW = geometry.matte.width;
      const matteH = geometry.matte.height;
      const addRabbet = (
        w: number,
        h: number,
        x: number,
        y: number,
      ) => {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), rabbetMat);
        strip.position.set(x, y, rabbetZ);
        strip.raycast = () => {};
        group.add(strip);
      };
      addRabbet(matteW + rabbet * 2, rabbet, 0, matteH / 2 + rabbet / 2);
      addRabbet(matteW + rabbet * 2, rabbet, 0, -(matteH / 2 + rabbet / 2));
      addRabbet(rabbet, matteH, matteW / 2 + rabbet / 2, 0);
      addRabbet(rabbet, matteH, -(matteW / 2 + rabbet / 2), 0);

      // Outer front-face edge darkening — subtle chamfer so the rail perimeter
      // separates from the wall wash without darkening the whole lip.
      const outerEdge = Math.min(lipWidth * 0.18, 0.005);
      const edgeMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
      });
      const edgeZ = frameFrontZ + 0.0005;
      const addOuterEdge = (
        w: number,
        h: number,
        x: number,
        y: number,
      ) => {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), edgeMat);
        strip.position.set(x, y, edgeZ);
        strip.raycast = () => {};
        group.add(strip);
      };
      addOuterEdge(frameWidth, outerEdge, 0, frameHeight / 2 - outerEdge / 2);
      addOuterEdge(frameWidth, outerEdge, 0, -(frameHeight / 2 - outerEdge / 2));
      addOuterEdge(
        outerEdge,
        frameHeight - outerEdge * 2,
        frameWidth / 2 - outerEdge / 2,
        0,
      );
      addOuterEdge(
        outerEdge,
        frameHeight - outerEdge * 2,
        -(frameWidth / 2 - outerEdge / 2),
        0,
      );
    }

    // Always a sharp rect. Canvas: fills rounded-paint corner crescents with
    // paper so the open stretcher never shows wall as a rim. Framed: mat ridge.
    const matte = new THREE.Mesh(
      new THREE.PlaneGeometry(geometry.matte.width, geometry.matte.height),
      new THREE.MeshStandardMaterial({
        // Flat paper mat / canvas face — slightly higher roughness than the lip.
        color: FRAME,
        roughness: isWhiteBody ? 0.88 : 0.7,
        metalness: 0,
      }),
    );
    matte.position.z = matteZ;
    // Framed modes: white mat ridge between lip and art. Canvas: flush paper
    // behind the paint (same footprint as art) — never a larger mat border.
    matte.visible = true;
    group.add(matte);

    const blankMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setScalar(BLANK_UNFOCUSED_ALBEDO),
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
    const artGeometry = artPlaneGeometry(
      layout.width,
      layout.height,
      isWhiteBody ? ART_CORNER_RADIUS_LIGHT : ART_CORNER_RADIUS,
    );
    const underlay = new THREE.Mesh(artGeometry.clone(), blankMaterial);
    // Just behind the art plane so a transparent dissolve reads the underlay.
    underlay.position.z = underlayZ;
    underlay.visible = false;
    underlay.raycast = () => {};
    const mesh = new THREE.Mesh(artGeometry, blankMaterial);
    mesh.position.z = artZ;
    frame.userData.paintingId = painting.id;
    matte.userData.paintingId = painting.id;
    mesh.userData.paintingId = painting.id;
    group.userData.paintingId = painting.id;
    group.add(underlay);
    group.add(mesh);
    root.add(group);

    frames.set(painting.id, {
      id: painting.id,
      mesh,
      underlay,
      frame,
      matte,
      frameMaterial,
      matWidth,
      lipWidth,
      boxDepth,
      openFront: isCanvas,
      artZ,
      underlayZ,
      lipColor,
      lipFocusedColor,
      blankMaterial,
      artMaterial,
      shimmerMaterial: createShimmerMaterial(),
      shimmerStartedAt: null,
      holdShimmerForReveal: false,
      revealActive: false,
      revealProgress: 1,
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
  generatingIds,
  shimmerHuesById,
  onSelectPainting,
  onOpenComposer,
  imageFit = "cover",
  frameStyle = "dark",
  onHangTextureLoad,
}: GallerySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef(pose);
  const zoomRef = useRef(zoom);
  const focusedRef = useRef(focusedId);
  const generatingIdsRef = useRef<ReadonlySet<string>>(
    generatingIds ?? EMPTY_GENERATING_IDS,
  );
  const shimmerHuesByIdRef = useRef<Record<string, ShimmerHues | null>>(
    shimmerHuesById ?? {},
  );
  const paintingsRef = useRef(paintings);
  const imageFitRef = useRef(imageFit);
  const frameStyleRef = useRef(frameStyle);
  const onSelectRef = useRef(onSelectPainting);
  const onOpenComposerRef = useRef(onOpenComposer);
  const onHangTextureLoadRef = useRef(onHangTextureLoad);
  const framesRef = useRef<Map<string, FrameEntry> | null>(null);
  // Scene is imported with ssr: false, so reading matchMedia here is safe.
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  poseRef.current = pose;
  zoomRef.current = zoom;
  focusedRef.current = focusedId;
  generatingIdsRef.current = generatingIds ?? EMPTY_GENERATING_IDS;
  shimmerHuesByIdRef.current = shimmerHuesById ?? {};
  paintingsRef.current = paintings;
  imageFitRef.current = imageFit;
  frameStyleRef.current = frameStyle;
  onSelectRef.current = onSelectPainting;
  onOpenComposerRef.current = onOpenComposer;
  onHangTextureLoadRef.current = onHangTextureLoad;

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
    // One grain for all studio frames. Skip for Fine Art light molding —
    // woodgrain normals muddy near-white rails. Generating per frame would
    // be N 512x512 canvases; per-frame UVs give the variety instead.
    const style = frameStyleRef.current;
    const woodgrain = style === "dark" ? createWoodgrainTexture() : null;
    if (woodgrain) {
      woodgrain.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    // Fine Art gallery-wrap: shared weave normal + soft contact map.
    const canvasWeave =
      style === "canvas" ? createCanvasWeaveNormalMap() : null;
    if (canvasWeave) {
      canvasWeave.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    const stretcherContactMap =
      style === "canvas" ? createStretcherContactShadowMap() : null;
    const frames = buildFrames(
      paintingsRef.current,
      framesRoot,
      woodgrain,
      style,
      canvasWeave,
      stretcherContactMap,
    );
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
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(url, (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        setFrameTexture(entry, tex, imageFitRef.current);
        onHangTextureLoadRef.current?.(painting.id);
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

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

    const clock = new THREE.Clock();

    let raf = 0;
    const tick = () => {
      const delta = clock.getDelta();
      const p = poseRef.current;
      camera.position.set(p.x, p.y, p.z);
      camera.lookAt(p.lookX, p.lookY, p.lookZ);
      camera.fov = fovForZoom(zoomRef.current);
      camera.updateProjectionMatrix();

      const focused = focusedRef.current;
      const generating = generatingIdsRef.current;
      const huesById = shimmerHuesByIdRef.current;
      const imageUrlById = new Map<string, string | undefined>();
      for (const painting of paintingsRef.current) {
        imageUrlById.set(painting.id, painting.imageUrl);
      }

      for (const [id, entry] of frames) {
        const isFocused = id === focused;
        const isGenerating = generating.has(id);
        const hungUrl = entry.texture?.userData.url as string | undefined;
        const desiredUrl = imageUrlById.get(id);
        const awaitingTexture = Boolean(desiredUrl && desiredUrl !== hungUrl);
        // Seat art on the computed proud-of-lip z — never the old absolute
        // 0.055/0.08 lifts that sat far past thin Fine Art molding.
        entry.mesh.position.z = entry.artZ;
        entry.underlay.position.z = entry.underlayZ;

        if (isGenerating) {
          entry.holdShimmerForReveal = true;
          // A new run cancels any in-flight dissolve; shimmer owns the plane.
          if (entry.revealActive) {
            entry.revealActive = false;
            entry.underlay.visible = false;
          }
          // Clock starts on the first frame of each generation and is cleared
          // below, so a second run begins pale again rather than resuming at the
          // previous depth. Bound to this canvas, not the focused one, so
          // moving focus mid-flight does not disturb it.
          entry.shimmerStartedAt ??= performance.now();
          entry.shimmerMaterial.uniforms.uTime.value += shimmerTimeStep(
            delta,
            reduceMotion,
          );
          entry.shimmerMaterial.uniforms.uProgress.value = shimmerProgress(
            performance.now() - entry.shimmerStartedAt,
          );
          easeHues(
            entry.shimmerMaterial.uniforms.uHues.value,
            huesById[id] ?? FALLBACK_HUES,
            delta,
          );
        } else if (
          entry.holdShimmerForReveal &&
          (awaitingTexture || entry.revealActive)
        ) {
          // Gen finished but the new texture is still decoding, or dissolving
          // in — keep the wet-paint shader alive as the underlay / hold surface.
          entry.shimmerStartedAt ??= performance.now();
          entry.shimmerMaterial.uniforms.uTime.value += shimmerTimeStep(
            delta,
            reduceMotion,
          );
          entry.shimmerMaterial.uniforms.uProgress.value = shimmerProgress(
            performance.now() - entry.shimmerStartedAt,
          );
          easeHues(
            entry.shimmerMaterial.uniforms.uHues.value,
            huesById[id] ?? FALLBACK_HUES,
            delta,
          );
        } else if (entry.shimmerStartedAt !== null) {
          entry.shimmerStartedAt = null;
          entry.shimmerMaterial.uniforms.uProgress.value = 0;
          // Back to the default set between runs, so a text-only generation that
          // follows an inspired one does not open on the previous artwork's hues.
          entry.shimmerMaterial.uniforms.uHues.value.set(...FALLBACK_HUES);
          // Failed / aborted gen: nothing new to reveal, drop the hold.
          if (!awaitingTexture && !entry.revealActive) {
            entry.holdShimmerForReveal = false;
          }
        }

        // Selection is colour only. The frame's geometry is identical in both
        // states, so stepping along a wall never resizes anything.
        tintTarget.set(
          isFocused ? entry.lipFocusedColor : entry.lipColor,
        );
        if (reduceMotion) {
          entry.frameMaterial.color.copy(tintTarget);
        } else {
          entry.frameMaterial.color.lerp(
            tintTarget,
            1 - Math.exp(-delta / FRAME_TINT_TAU),
          );
        }

        if (entry.revealActive && entry.texture && !isGenerating) {
          entry.revealProgress = reduceMotion
            ? 1
            : Math.min(
                1,
                entry.revealProgress + delta / ART_REVEAL_DURATION_S,
              );
          entry.underlay.visible = entry.revealProgress < 0.999;
          entry.underlay.material = entry.holdShimmerForReveal
            ? entry.shimmerMaterial
            : entry.blankMaterial;
          entry.underlay.scale.set(entry.artFit.x, entry.artFit.y, 1);
          if (entry.holdShimmerForReveal) {
            entry.shimmerMaterial.uniformsNeedUpdate = true;
          } else {
            setBlankLighting(entry.blankMaterial, entry.artLit);
          }
          if (entry.revealProgress >= 0.999) {
            entry.revealActive = false;
            entry.revealProgress = 1;
            entry.holdShimmerForReveal = false;
            entry.underlay.visible = false;
          }
        } else if (!entry.revealActive) {
          entry.underlay.visible = false;
        }

        // Straight assignment each frame, never a new material: generating wins,
        // then a hung image (including mid-dissolve), then blank paper. Holding
        // shimmer after gen-end until the texture is ready prevents a one-frame
        // flash of the previous hang.
        const holdShimmer =
          entry.holdShimmerForReveal && awaitingTexture && !entry.revealActive;
        const surface =
          isGenerating || holdShimmer
            ? entry.shimmerMaterial
            : entry.texture
              ? entry.artMaterial
              : entry.blankMaterial;
        if (entry.mesh.material !== surface) {
          entry.mesh.material = surface;
          // Shimmer and blank paper fill the aperture; hung images do too
          // (cover), so artFit is 1 unless a future contain hang lands here.
          const fit = surface === entry.artMaterial ? entry.artFit : null;
          entry.mesh.scale.set(fit?.x ?? 1, fit?.y ?? 1, 1);
        } else if (isGenerating || holdShimmer) {
          // Keep the shader hot — some drivers skip redrawing a material that
          // only mutates uniforms if they think the mesh is static.
          entry.shimmerMaterial.uniformsNeedUpdate = true;
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

        // Neighbors at ART_UNFOCUSED_OPACITY let the white mat read through
        // (Reve). Canvas wraps have no mat — keep paint fully opaque so a
        // rectangular paper backer never reads as a front-face rim.
        const focusOpacity = entry.openFront
          ? 1
          : focusArtOpacity(entry.artLit);
        const revealFactor =
          entry.revealActive && entry.texture && !isGenerating
            ? entry.revealProgress
            : 1;
        setArtRevealOpacity(entry.artMaterial, revealFactor * focusOpacity);

        if (!entry.texture) {
          // Same ease as hung art: empty paper stays room-lit soft white when
          // off-axis, and only the focused sheet lifts to pure white.
          setBlankLighting(entry.blankMaterial, entry.artLit);
          setArtRevealOpacity(
            entry.blankMaterial,
            entry.openFront ? 1 : focusOpacity,
          );
        }
      }

      renderer.render(scene, camera);
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
      if (id) onSelectRef.current(id);
    };
    const onDoubleClick = (e: MouseEvent) => {
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
      onOpenComposerRef.current?.();
    };
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      // Materials do not own their maps, so disposing the frame materials
      // leaves this behind. It is shared by all studio frames, hence disposed here.
      woodgrain?.dispose();
      canvasWeave?.dispose();
      stretcherContactMap?.dispose();
      for (const entry of frames.values()) {
        entry.texture?.dispose();
        entry.blankMaterial.dispose();
        entry.artMaterial.dispose();
        entry.shimmerMaterial.dispose();
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
          setFrameTexture(entry, null, imageFit);
        }
        continue;
      }

      const prev = entry.texture?.userData.url as string | undefined;
      if (prev === url) continue;

      const loader = new THREE.TextureLoader();
      // Needed so letterbox detection can sample pixels on Blob CDN hangs.
      loader.setCrossOrigin("anonymous");
      loader.load(url, (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        entry.texture?.dispose();
        setFrameTexture(entry, tex, imageFit);
        onHangTextureLoadRef.current?.(painting.id);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [paintings, imageFit]);

  return (
    <div className="absolute inset-0 z-10 h-full w-full">
      <div
        ref={mountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="3D gallery room"
      />
    </div>
  );
}
