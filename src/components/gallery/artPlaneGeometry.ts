import * as THREE from "three";

/**
 * Soften the art plane's corners where they meet the white mat.
 *
 * ~1 CSS px at focused viewing: the mat ridge is `MAT_WIDTH` (0.03) and reads
 * as roughly a dozen pixels, so one pixel is ~0.0025 world units. Small enough
 * not to read as a bevel; just enough to kill the hard 90° against the mat.
 *
 * Fine Art canvas wraps use `ART_CORNER_RADIUS_LIGHT` (~5–6 CSS px) so gallery-
 * wrapped hangs read softer without changing Reve's tighter studio radius.
 */
export const ART_CORNER_RADIUS = 0.0025;
/** Fine Art / canvas hang — softer rounded corners than the studio default. */
export const ART_CORNER_RADIUS_LIGHT = 0.014;

/**
 * Flat art / blank-canvas plane with slightly rounded corners so the white mat
 * shows through at the join.
 *
 * Three.js `ShapeGeometry` writes raw vertex xy into the UV attribute (not a
 * 0–1 unit square). With the default ClampToEdge wrap that leaves the texture
 * sampling only the positive-UV quadrant — art stuck in one corner, beige
 * clamp colour everywhere else. Remap to PlaneGeometry's 0–1 convention so
 * hung textures (and cover UV crop) span the full aperture inside the mat.
 */
export function artPlaneGeometry(
  width: number,
  height: number,
  cornerRadius: number = ART_CORNER_RADIUS,
): THREE.ShapeGeometry {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(cornerRadius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  // More segments for Fine Art's larger radius; Reve's ~1px radius is fine at 4.
  const curveSegments = cornerRadius >= 0.008 ? 8 : 4;
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  remapShapeUvsToUnitSquare(geometry, width, height);
  return geometry;
}

const WRAP_CORNER_SEGS = 8;
const WRAP_EDGE_SEGS = 6;
const LIP_RINGS = 5;
const WRAP_RINGS = 6;

/**
 * Fine Art paint / blank face: taut interior, raised stretcher lip, then a
 * quarter-round wrap on the four long edges so canvas reads as cloth over a
 * bar — not a razor box. Corners stay the existing rounded-rect silhouette.
 *
 * Local z=0 is the flat face; the wrap turns toward −Z to meet the stretcher.
 */
export function canvasArtGeometry(
  width: number,
  height: number,
  cornerRadius: number = ART_CORNER_RADIUS_LIGHT,
  wrapRadius: number = 0.016,
  lipWidth: number = 0.024,
  lipHeight: number = 0.0044,
  wrapSwell: number = 0.0016,
  wrapAngle: number = Math.PI / 2,
  paintInset: number = 0,
  sideOverlap: number = 0.007,
): THREE.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(cornerRadius, hw * 0.45, hh * 0.45);
  const wrapR = Math.min(wrapRadius, hw * 0.2, hh * 0.2);
  const lipW = Math.min(lipWidth, hw * 0.25, hh * 0.25);
  const maxPhi = Math.min(Math.PI / 2, Math.max(0.4, wrapAngle));
  const maxW = Math.max(0.001, hw - paintInset);
  const maxH = Math.max(0.001, hh - paintInset);

  const rings: { s: number; z: number; shade: number }[] = [];
  for (let i = 0; i <= LIP_RINGS; i++) {
    const t = i / LIP_RINGS;
    const lip = t * t * (3 - 2 * t);
    rings.push({
      s: wrapR + lipW * (1 - t),
      z: lipHeight * lip,
      shade: 1 + 0.16 * lip,
    });
  }
  for (let i = 1; i <= WRAP_RINGS; i++) {
    const phi = (i / WRAP_RINGS) * maxPhi;
    const turn = phi / maxPhi;
    rings.push({
      s: wrapR * (1 - Math.sin(phi)),
      z: lipHeight - wrapR + wrapR * Math.cos(phi) + wrapSwell * Math.sin(2 * phi),
      shade: 1.18 * (1 - turn) + 0.62 * turn + 0.1 * Math.sin(2 * phi),
    });
  }
  if (sideOverlap > 0) {
    const wrapEndZ = rings[rings.length - 1]!.z;
    rings.push({
      s: 0,
      z: wrapEndZ - sideOverlap,
      shade: 0.62,
    });
  }

  const loops = rings.map((ring) =>
    roundedRectLoop(
      Math.min(maxW, hw - ring.s),
      Math.min(maxH, hh - ring.s),
      r - ring.s,
    ),
  );
  const n = loops[0]!.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];

  const addVert = (x: number, y: number, z: number, shade: number) => {
    positions.push(x, y, z);
    uvs.push((x + hw) / width, (y + hh) / height);
    const c = THREE.MathUtils.clamp(shade, 0.58, 1.28);
    colors.push(c, c, c);
  };

  addVert(0, 0, rings[0]!.z, 1);
  for (let ring = 0; ring < loops.length; ring++) {
    const z = rings[ring]!.z;
    const shade = rings[ring]!.shade;
    const loop = loops[ring]!;
    for (let i = 0; i < n; i++) {
      const p = loop[i]!;
      addVert(p.x, p.y, z, shade);
    }
  }

  const ringIndex = (ring: number, i: number) => 1 + ring * n + (i % n);

  for (let i = 0; i < n; i++) {
    index.push(0, ringIndex(0, i), ringIndex(0, i + 1));
  }
  for (let ring = 0; ring < loops.length - 1; ring++) {
    for (let i = 0; i < n; i++) {
      const a0 = ringIndex(ring, i);
      const a1 = ringIndex(ring, i + 1);
      const b0 = ringIndex(ring + 1, i);
      const b1 = ringIndex(ring + 1, i + 1);
      index.push(a0, b0, b1, a0, b1, a1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** CCW rounded-rect outline. Same vertex count at every inset so rings stitch. */
function roundedRectLoop(
  hw: number,
  hh: number,
  radius: number,
): { x: number; y: number }[] {
  const safeW = Math.max(hw, 0.001);
  const safeH = Math.max(hh, 0.001);
  const r = Math.max(0, Math.min(radius, safeW * 0.95, safeH * 0.95));
  const pts: { x: number; y: number }[] = [];

  const edge = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    for (let i = 0; i < WRAP_EDGE_SEGS; i++) {
      const t = i / WRAP_EDGE_SEGS;
      pts.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    }
  };
  const arc = (
    cx: number,
    cy: number,
    start: number,
    end: number,
  ) => {
    for (let i = 0; i <= WRAP_CORNER_SEGS; i++) {
      const t = i / WRAP_CORNER_SEGS;
      const a = start + (end - start) * t;
      pts.push({
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
      });
    }
  };

  edge(-safeW + r, -safeH, safeW - r, -safeH);
  arc(safeW - r, -safeH + r, -Math.PI / 2, 0);
  edge(safeW, -safeH + r, safeW, safeH - r);
  arc(safeW - r, safeH - r, 0, Math.PI / 2);
  edge(safeW - r, safeH, -safeW + r, safeH);
  arc(-safeW + r, safeH - r, Math.PI / 2, Math.PI);
  edge(-safeW, safeH - r, -safeW, -safeH + r);
  arc(-safeW + r, -safeH + r, Math.PI, Math.PI * 1.5);
  return pts;
}

/**
 * Rewrite ShapeGeometry UVs from world xy onto a 0–1 unit square matching
 * `PlaneGeometry` (u = 0 at left, v = 0 at bottom).
 */
export function remapShapeUvsToUnitSquare(
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
): void {
  const uv = geometry.getAttribute("uv");
  const position = geometry.getAttribute("position");
  if (!(uv instanceof THREE.BufferAttribute) || !(position instanceof THREE.BufferAttribute)) {
    return;
  }
  const halfW = width / 2;
  const halfH = height / 2;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      (position.getX(i) + halfW) / width,
      (position.getY(i) + halfH) / height,
    );
  }
  uv.needsUpdate = true;
}
