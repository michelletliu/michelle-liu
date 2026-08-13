import * as THREE from "three";

export const MAT_WIDTH = 0.03;
/** Outer lip width for the Reve / studio gallery (dark woodgrain). */
export const FRAME_LIP_WIDTH = 0.04;
/**
 * Outer lip for the Fine Art room — wider than the mat so the molding reads
 * as the primary border and the white mat stays a thin inset ridge.
 */
export const ART_FRAME_LIP_WIDTH = 0.028;
/**
 * Fine Art mat ridge — a quarter of the outer lip so the white paper stays a
 * thin inset; molding remains the primary border. Studio / Reve keeps
 * {@link MAT_WIDTH}.
 */
export const ART_MAT_WIDTH = ART_FRAME_LIP_WIDTH / 4;
/** Box depth of the outer frame rail (studio default). */
export const FRAME_BOX_DEPTH = 0.06;
/**
 * Fine Art rail depth — enough box thickness for side-face shading and a
 * soft wall contact shadow without rivaling the darker studio molding.
 */
export const ART_FRAME_BOX_DEPTH = 0.044;
/**
 * Gallery-wrapped canvas depth for Fine Art — white stretcher sides read as
 * thickness; no outer lip or mat. Slightly deeper than the old light molding
 * so off-axis views show a clear white edge.
 */
export const CANVAS_BOX_DEPTH = 0.052;
/**
 * Vertical fillet on the gallery-wrap stretcher — fabric over a blunt bar,
 * matched to Fine Art's softer paint corner (`ART_CORNER_RADIUS_LIGHT`).
 */
export const CANVAS_CORNER_RADIUS = 0.018;

type Size = {
  width: number;
  height: number;
};

export type GalleryFrameGeometry = {
  art: Size;
  matte: Size;
  frame: Size;
};

/**
 * Visual treatment for the outer frame lip / hang body.
 * - `dark` — Reve studio: mid-gray woodgrain lip (default).
 * - `light` — Thin near-white molding + mat (legacy Fine Art).
 * - `canvas` — Fine Art gallery wrap: thick white body, art flush, no lip/mat.
 */
export type GalleryFrameStyle = "dark" | "light" | "canvas";

export type FrameBandOptions = {
  /** Physical mat ridge width. Defaults to {@link MAT_WIDTH}. */
  matWidth?: number;
  /** Outer frame lip width. Defaults to {@link FRAME_LIP_WIDTH}. */
  lipWidth?: number;
};

/**
 * How a hung image sits in its aperture.
 *
 * - `contain` — letterbox to the image aspect inside the hang aperture.
 *   Used for empty canvases.
 * - `cover` — fill the aperture and crop via UVs when the image aspect
 *   differs. Used for AI-generated wall hangs and Fine Art canvas wraps.
 *
 * Framed modes (`dark` / `light`) keep a physical white mat between the art
 * plane and the frame lip. `canvas` uses zero mat/lip so the art meets the
 * stretcher edge. Cover never means edge-to-lip in framed modes; it only
 * changes how the image fills the art plane.
 */
export type GalleryFrameFit = "contain" | "cover";

/**
 * Build a box body with the front (+Z) face removed — and optionally the back
 * (−Z) face. Used for Fine Art gallery-wrap stretchers so white thickness
 * reads only on the sides; a solid front face reads as a mat/lip around the art.
 *
 * three.js `BoxGeometry` face order: +X, −X, +Y, −Y, +Z, −Z (6 indices each).
 *
 * Prefer {@link openFrontRoundedBoxGeometry} for Fine Art canvas wraps — this
 * sharp box remains for tests and any non-filleted callers.
 */
export function openFrontBoxGeometry(
  width: number,
  height: number,
  depth: number,
  options: { openBack?: boolean } = {},
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const index = geo.getIndex();
  if (!index) return geo;
  const keepFaces = options.openBack ? [0, 1, 2, 3] : [0, 1, 2, 3, 5];
  const src = index.array;
  const next: number[] = [];
  for (const face of keepFaces) {
    const start = face * 6;
    for (let i = 0; i < 6; i++) next.push(src[start + i]!);
  }
  geo.setIndex(next);
  geo.clearGroups();
  return geo;
}

/**
 * Open-front (and optionally open-back) stretcher with filleted vertical
 * corners — fabric over a blunt bar, not a sharp 90° box.
 *
 * Built as an extruded rounded rect with ±Z caps stripped so the paint plane
 * stays full-bleed (no front-face rim). Vertex colours bake a soft diagonal
 * tuck at each corner; a slight outward loft near the front ring reads as
 * pillowy wrap without a fake mat.
 */
export function openFrontRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number = CANVAS_CORNER_RADIUS,
  options: { openBack?: boolean } = {},
): THREE.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(cornerRadius, hw * 0.45, hh * 0.45);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hh - r);
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, hh);
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hh + r);
  shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
    steps: 2,
  });
  // Extrude builds z∈[0, depth]; center like BoxGeometry.
  geo.translate(0, 0, -depth / 2);

  stripExtrudeCaps(geo, options.openBack ? "both" : "front");
  loftStretcherCorners(geo, width, height, depth, r);
  bakeCanvasFoldVertexColors(geo, width, height, depth, r);
  remapStretcherSideUvs(geo, width, height, depth);
  geo.computeVertexNormals();
  return geo;
}

/** Drop ±Z cap triangles from an extruded prism; keep the side shell. */
function stripExtrudeCaps(
  geo: THREE.BufferGeometry,
  mode: "front" | "both",
): void {
  const pos = geo.getAttribute("position");
  if (!(pos instanceof THREE.BufferAttribute)) return;

  const ax = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  // Recent three.js ExtrudeGeometry is non-indexed (sides + caps as groups).
  // Fall back to an index walk when present.
  const index = geo.getIndex();
  const keepVertexIndices: number[] = [];

  const considerTri = (ia: number, ib: number, ic: number) => {
    ax.fromBufferAttribute(pos, ia);
    ab.fromBufferAttribute(pos, ib).sub(ax);
    ac.fromBufferAttribute(pos, ic).sub(ax);
    normal.crossVectors(ab, ac);
    if (normal.lengthSq() < 1e-20) return;
    normal.normalize();

    // Caps face ±Z; side walls (including fillets) have |nz| near 0.
    if (Math.abs(normal.z) > 0.75) {
      if (mode === "both") return;
      const faceZ = (ax.z + pos.getZ(ib) + pos.getZ(ic)) / 3;
      // Front is +Z after centering.
      if (faceZ > 0) return;
    }
    keepVertexIndices.push(ia, ib, ic);
  };

  if (index) {
    const src = index.array;
    for (let i = 0; i < src.length; i += 3) {
      considerTri(src[i]!, src[i + 1]!, src[i + 2]!);
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      considerTri(i, i + 1, i + 2);
    }
  }

  const attrNames = Object.keys(geo.attributes);
  const nextCount = keepVertexIndices.length;
  for (const name of attrNames) {
    const attr = geo.getAttribute(name);
    if (!(attr instanceof THREE.BufferAttribute)) continue;
    const itemSize = attr.itemSize;
    const next = new Float32Array(nextCount * itemSize);
    for (let i = 0; i < nextCount; i++) {
      const src = keepVertexIndices[i]!;
      for (let c = 0; c < itemSize; c++) {
        next[i * itemSize + c] = attr.array[src * itemSize + c]!;
      }
    }
    geo.setAttribute(
      name,
      new THREE.BufferAttribute(next, itemSize, attr.normalized),
    );
  }
  geo.setIndex(null);
  geo.clearGroups();
}

/**
 * Soft outward bulge on front-ring corner verts — pillowy fabric loft without
 * a front-face bevel rim around the paint.
 */
function loftStretcherCorners(
  geo: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
): void {
  const pos = geo.getAttribute("position");
  if (!(pos instanceof THREE.BufferAttribute)) return;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  const maxLoft = Math.min(0.0022, cornerRadius * 0.12);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const front = THREE.MathUtils.clamp((z + hd) / depth, 0, 1);
    if (front < 0.35) continue;

    const sx = x >= 0 ? 1 : -1;
    const sy = y >= 0 ? 1 : -1;
    const ax = sx * (hw - cornerRadius);
    const ay = sy * (hh - cornerRadius);
    const dArc = Math.hypot(x - ax, y - ay);
    if (dArc > cornerRadius + 0.006) continue;

    const t =
      (1 - THREE.MathUtils.clamp(dArc / (cornerRadius + 0.006), 0, 1)) *
      front *
      front;
    const len = Math.hypot(x, y) || 1;
    pos.setXYZ(
      i,
      x + (x / len) * maxLoft * t,
      y + (y / len) * maxLoft * t,
      z,
    );
  }
  pos.needsUpdate = true;
}

/**
 * Soft diagonal tuck at each corner via vertex colours (multiplies albedo).
 * With a few depth rings, linear interpolation reads as a fabric crease.
 */
function bakeCanvasFoldVertexColors(
  geo: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
): void {
  const pos = geo.getAttribute("position");
  if (!(pos instanceof THREE.BufferAttribute)) return;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  const colors = new Float32Array(pos.count * 3);
  const creaseSigma = Math.max(0.0055, depth * 0.11);
  const foldReach = cornerRadius * Math.PI * 0.5 + depth * 0.35;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const fromFront = Math.max(0, hd - z);
    let shade = 1;

    for (const sx of [-1, 1] as const) {
      for (const sy of [-1, 1] as const) {
        const along = distAlongCanvasCorner(
          x,
          y,
          sx,
          sy,
          hw,
          hh,
          cornerRadius,
        );
        if (along > foldReach) continue;

        // Gallery-wrap: crease runs ~45° from the front corner back along each side.
        const creaseDist = Math.abs(fromFront - along);
        const line = Math.exp(
          -(creaseDist * creaseDist) / (creaseSigma * creaseSigma),
        );
        const alongFade = Math.exp(
          -(along * along) / ((foldReach * 0.85) ** 2),
        );
        shade *= 1 - 0.32 * line * alongFade;

        // Highlight sits slightly toward the front of the ridge.
        const hiDist = Math.abs(fromFront - along + creaseSigma * 0.85);
        const hi = Math.exp(-(hiDist * hiDist) / ((creaseSigma * 0.85) ** 2));
        shade *= 1 + 0.08 * hi * alongFade;
      }
    }

    const c = THREE.MathUtils.clamp(shade, 0.72, 1.1);
    colors[i * 3] = c;
    colors[i * 3 + 1] = c;
    colors[i * 3 + 2] = c;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * World distance from a corner's front tip along the stretcher silhouette
 * (arc length on the fillet, then continuing onto the flat side).
 */
function distAlongCanvasCorner(
  x: number,
  y: number,
  sx: 1 | -1,
  sy: 1 | -1,
  hw: number,
  hh: number,
  r: number,
): number {
  const ax = sx * (hw - r);
  const ay = sy * (hh - r);
  const dx = x - ax;
  const dy = y - ay;
  const dArc = Math.hypot(dx, dy);

  if (dArc <= r * 1.2) {
    // atan2 in the corner's outward quadrant: 0 on the ±X face end, π/2 on ±Y.
    let ang = Math.atan2(sy * dy, sx * dx);
    if (ang < 0) ang += Math.PI * 2;
    ang = THREE.MathUtils.clamp(ang, 0, Math.PI / 2);
    return ang * r;
  }

  // Past the fillet onto a flat rail — pick the nearer axis as the side.
  const onVertical = Math.abs(Math.abs(x) - hw) <= Math.abs(Math.abs(y) - hh);
  if (onVertical) {
    // Continue past the ang=0 end of the fillet.
    return Math.max(0, sy * (ay - y));
  }
  // Continue past the ang=π/2 end.
  return r * (Math.PI / 2) + Math.max(0, sx * (ax - x));
}

/**
 * World-scaled UVs for stretcher-side weave: U along the perimeter, V along
 * depth. Period matches {@link CANVAS_WEAVE_PERIOD}.
 */
export const CANVAS_WEAVE_PERIOD = 0.028;

function remapStretcherSideUvs(
  geo: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
): void {
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  if (
    !(pos instanceof THREE.BufferAttribute) ||
    !(uv instanceof THREE.BufferAttribute)
  ) {
    return;
  }
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  // Approximate perimeter param via atan2 on a squircle — stable for weave
  // tiling; fold shading does not depend on these UVs.
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ang = Math.atan2(y / hh, x / hw);
    const perimeterApprox =
      2 * (width + height) * ((ang + Math.PI) / (Math.PI * 2));
    uv.setXY(
      i,
      perimeterApprox / CANVAS_WEAVE_PERIOD,
      ((z + hd) / depth) * (depth / CANVAS_WEAVE_PERIOD),
    );
  }
  uv.needsUpdate = true;
}

export function frameBandsForStyle(style: GalleryFrameStyle): {
  matWidth: number;
  lipWidth: number;
  boxDepth: number;
} {
  if (style === "canvas") {
    return {
      matWidth: 0,
      lipWidth: 0,
      boxDepth: CANVAS_BOX_DEPTH,
    };
  }
  if (style === "light") {
    return {
      matWidth: ART_MAT_WIDTH,
      lipWidth: ART_FRAME_LIP_WIDTH,
      boxDepth: ART_FRAME_BOX_DEPTH,
    };
  }
  return {
    matWidth: MAT_WIDTH,
    lipWidth: FRAME_LIP_WIDTH,
    boxDepth: FRAME_BOX_DEPTH,
  };
}

export function frameGeometryForArtwork(
  maxArtWidth: number,
  maxArtHeight: number,
  imageAspect: number | null,
  fit: GalleryFrameFit = "contain",
  bands: FrameBandOptions = {},
): GalleryFrameGeometry {
  const matWidth = bands.matWidth ?? MAT_WIDTH;
  const lipWidth = bands.lipWidth ?? FRAME_LIP_WIDTH;
  const apertureAspect = maxArtWidth / maxArtHeight;
  const validAspect =
    imageAspect !== null && Number.isFinite(imageAspect) && imageAspect > 0;

  // Cover (and unknown aspect) fill the hang aperture. Contain letterboxes.
  const art =
    fit === "cover" || !validAspect
      ? { width: maxArtWidth, height: maxArtHeight }
      : {
          width: maxArtWidth * Math.min(1, imageAspect / apertureAspect),
          height: maxArtHeight * Math.min(1, apertureAspect / imageAspect),
        };

  // White mat ridge between art and frame lip — always present.
  const matte = {
    width: art.width + matWidth * 2,
    height: art.height + matWidth * 2,
  };

  return {
    art,
    matte,
    frame: {
      width: matte.width + lipWidth * 2,
      height: matte.height + lipWidth * 2,
    },
  };
}

/**
 * UV repeat/offset so a texture covers an aperture without distortion
 * (CSS `object-fit: cover`).
 */
export function coverUvTransform(
  apertureAspect: number,
  imageAspect: number | null,
): { offsetX: number; offsetY: number; repeatX: number; repeatY: number } {
  if (
    imageAspect === null ||
    !Number.isFinite(imageAspect) ||
    imageAspect <= 0 ||
    !Number.isFinite(apertureAspect) ||
    apertureAspect <= 0
  ) {
    return { offsetX: 0, offsetY: 0, repeatX: 1, repeatY: 1 };
  }
  if (imageAspect > apertureAspect) {
    const repeatX = apertureAspect / imageAspect;
    return { offsetX: (1 - repeatX) / 2, offsetY: 0, repeatX, repeatY: 1 };
  }
  const repeatY = imageAspect / apertureAspect;
  return { offsetX: 0, offsetY: (1 - repeatY) / 2, repeatX: 1, repeatY };
}

/**
 * Fractions of the source image to crop away on each side (0–0.5).
 * Used with {@link coverUvWithLetterbox} to hide baked-in black keylines.
 * Kept structurally identical to `LetterboxTrim` in `hangImageLetterbox`.
 */
export type LetterboxTrim = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const NO_LETTERBOX_TRIM: LetterboxTrim = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

/**
 * Pixel aspect of the painted content after letterbox trim.
 * `imageAspect` is full-frame width/height before cropping.
 */
export function contentAspectAfterTrim(
  imageAspect: number,
  trim: LetterboxTrim,
): number {
  const widthScale = 1 - trim.left - trim.right;
  const heightScale = 1 - trim.top - trim.bottom;
  if (widthScale <= 0 || heightScale <= 0) return imageAspect;
  return (imageAspect * widthScale) / heightScale;
}

/**
 * Extra cover crop on every hung texture (fraction of the post-letterbox
 * window). Kills 1px keylines and mipmap/filter bleed of dark edge texels that
 * detection can miss — paint always meets the white mat.
 */
export const COVER_SAFETY_INSET = 0.012;

/**
 * Cover-fit UVs that also discard a letterbox. Three.js default `flipY` puts
 * image-top at v=1, so top trim shortens repeat from the high end and bottom
 * trim raises `offsetY`.
 *
 * Always applies {@link COVER_SAFETY_INSET} after the letterbox window so the
 * aperture never samples the outermost source texels.
 */
export function coverUvWithLetterbox(
  apertureAspect: number,
  imageAspect: number | null,
  trim: LetterboxTrim = NO_LETTERBOX_TRIM,
  safetyInset: number = COVER_SAFETY_INSET,
): { offsetX: number; offsetY: number; repeatX: number; repeatY: number } {
  const contentAspect =
    imageAspect === null
      ? null
      : contentAspectAfterTrim(imageAspect, trim);
  const uv = coverUvTransform(apertureAspect, contentAspect);
  const widthScale = 1 - trim.left - trim.right;
  const heightScale = 1 - trim.top - trim.bottom;
  const inset = Math.min(0.05, Math.max(0, safetyInset));
  const innerScale = 1 - 2 * inset;
  const repeatX = uv.repeatX * widthScale * innerScale;
  const repeatY = uv.repeatY * heightScale * innerScale;
  return {
    offsetX: uv.offsetX + uv.repeatX * (trim.left + widthScale * inset),
    offsetY: uv.offsetY + uv.repeatY * (trim.bottom + heightScale * inset),
    repeatX,
    repeatY,
  };
}
