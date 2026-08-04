import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  artPlaneGeometry,
  remapShapeUvsToUnitSquare,
} from "./artPlaneGeometry.ts";

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
