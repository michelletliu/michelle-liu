import * as THREE from "three";

/**
 * Soften the art plane's corners where they meet the white mat.
 *
 * ~1 CSS px at focused viewing: the mat ridge is `MAT_WIDTH` (0.03) and reads
 * as roughly a dozen pixels, so one pixel is ~0.0025 world units. Small enough
 * not to read as a bevel; just enough to kill the hard 90° against the mat.
 */
export const ART_CORNER_RADIUS = 0.0025;

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
): THREE.ShapeGeometry {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(ART_CORNER_RADIUS, w, h);
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
  // Few segments — the radius is ~1px; 4 is plenty for a smooth quarter-circle.
  const geometry = new THREE.ShapeGeometry(shape, 4);
  remapShapeUvsToUnitSquare(geometry, width, height);
  return geometry;
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
