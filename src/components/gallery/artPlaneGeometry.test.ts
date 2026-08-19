import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  canvasArtGeometry,
  artPlaneGeometry,
  remapShapeUvsToUnitSquare,
} from "./artPlaneGeometry.ts";
import { CANVAS_WRAP_RADIUS } from "./galleryFrameGeometry.ts";

const closeTo = (actual: number, expected: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-5,
    `${label}: expected ${expected}, got ${actual}`,
  );
};

function uvBounds(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute("uv");
  let uMin = Infinity;
  let uMax = -Infinity;
  let vMin = Infinity;
  let vMax = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    uMin = Math.min(uMin, uv.getX(i));
    uMax = Math.max(uMax, uv.getX(i));
    vMin = Math.min(vMin, uv.getY(i));
    vMax = Math.max(vMax, uv.getY(i));
  }
  return { uMin, uMax, vMin, vMax };
}

test("raw ShapeGeometry UVs are world xy, not a unit square", () => {
  const w = 1.95;
  const h = 1.32;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();
  const raw = new THREE.ShapeGeometry(shape);
  const bounds = uvBounds(raw);
  assert.ok(bounds.uMin < -0.5, "raw u spans negative");
  assert.ok(bounds.uMax > 0.5, "raw u spans positive");
  assert.ok(bounds.vMin < -0.5, "raw v spans negative");
  assert.ok(bounds.vMax > 0.5, "raw v spans positive");
});

test("remapShapeUvsToUnitSquare matches PlaneGeometry 0–1 UVs", () => {
  const width = 1.95;
  const height = 1.32;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  remapShapeUvsToUnitSquare(geometry, width, height);

  const bounds = uvBounds(geometry);
  closeTo(bounds.uMin, 0, "uMin");
  closeTo(bounds.uMax, 1, "uMax");
  closeTo(bounds.vMin, 0, "vMin");
  closeTo(bounds.vMax, 1, "vMax");
});

test("artPlaneGeometry UVs span the full aperture for cover+mat hangs", () => {
  const geometry = artPlaneGeometry(1.95, 1.32);
  const bounds = uvBounds(geometry);
  closeTo(bounds.uMin, 0, "art uMin");
  closeTo(bounds.uMax, 1, "art uMax");
  closeTo(bounds.vMin, 0, "art vMin");
  closeTo(bounds.vMax, 1, "art vMax");
});

test("canvasArtGeometry wraps the four long edges and raises a stretcher lip", () => {
  const width = 1.15;
  const height = 1.55;
  const geo = canvasArtGeometry(width, height);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const nrm = geo.getAttribute("normal");
  assert.ok(pos && pos.count > 24, "wrapped face is tessellated");
  assert.ok(uv && uv.count === pos.count, "uvs present");
  assert.ok(nrm && nrm.count === pos.count, "normals present");

  let minZ = Infinity;
  let maxZ = -Infinity;
  let midTopZ = Infinity;
  let midRightZ = Infinity;
  let foundFrontNormal = false;
  let foundSideNormal = false;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    if (Math.abs(x) < 0.04 && y > height / 2 - 0.008) {
      midTopZ = Math.min(midTopZ, z);
    }
    if (Math.abs(y) < 0.04 && x > width / 2 - 0.008) {
      midRightZ = Math.min(midRightZ, z);
    }
    if (nrm.getZ(i) > 0.95) foundFrontNormal = true;
    if (Math.abs(nrm.getX(i)) > 0.45 || Math.abs(nrm.getY(i)) > 0.45) {
      foundSideNormal = true;
    }
  }

  assert.ok(maxZ > 0.002, `stretcher lip should rise (maxZ=${maxZ})`);
  assert.ok(
    minZ < -CANVAS_WRAP_RADIUS * 0.4,
    `long-edge wrap should turn toward -Z (minZ=${minZ})`,
  );
  assert.ok(midTopZ < -0.003, `top long edge wraps (z=${midTopZ})`);
  assert.ok(midRightZ < -0.003, `right long edge wraps (z=${midRightZ})`);
  assert.ok(foundFrontNormal, "flat interior still faces +Z");
  assert.ok(foundSideNormal, "wrap has outward-facing normals");

  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < pos.count; i++) {
    maxX = Math.max(maxX, Math.abs(pos.getX(i)));
    maxY = Math.max(maxY, Math.abs(pos.getY(i)));
  }
  assert.ok(
    maxX <= width / 2 + 1e-6,
    `paint does not overshoot stretcher width (maxX=${maxX})`,
  );
  assert.ok(
    maxY <= height / 2 + 1e-6,
    `paint does not overshoot stretcher height (maxY=${maxY})`,
  );
  assert.ok(
    maxX > width / 2 - 0.002,
    `paint reaches the stretcher edge (maxX=${maxX})`,
  );

  const color = geo.getAttribute("color");
  assert.ok(color && color.count === pos.count, "edge shade vertex colours");
  let minC = 1;
  let maxC = 0;
  for (let i = 0; i < color.count; i++) {
    const c = color.getX(i);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  assert.ok(maxC > 1.02, `wrap highlight (max=${maxC})`);
  assert.ok(minC < 0.95, `wrap contact shadow (min=${minC})`);

  const bounds = uvBounds(geo);
  assert.ok(bounds.uMin > -0.02 && bounds.uMax < 1.02, "u stays near 0–1");
  assert.ok(bounds.vMin > -0.02 && bounds.vMax < 1.02, "v stays near 0–1");
  geo.dispose();
});
