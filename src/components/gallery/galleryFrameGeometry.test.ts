import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  ART_FRAME_LIP_WIDTH,
  ART_MAT_WIDTH,
  CANVAS_CORNER_RADIUS,
  FRAME_LIP_WIDTH,
  MAT_WIDTH,
  coverUvTransform,
  frameBandsForStyle,
  frameGeometryForArtwork,
  openFrontBoxGeometry,
  openFrontRoundedBoxGeometry,
} from "./galleryFrameGeometry.ts";
import { paintingSize } from "./galleryPaintings.ts";

const closeTo = (actual: number, expected: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`,
  );
};

test("paint apertures match 3:4 and 3:2 generate ratios", () => {
  const portrait = paintingSize("portrait");
  const landscape = paintingSize("landscape");
  closeTo(portrait.width / portrait.height, 3 / 4, "portrait aspect");
  closeTo(landscape.width / landscape.height, 3 / 2, "landscape aspect");
});

test("3:2 landscape artwork has one world-space mat width on every side", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 3 / 2);

  closeTo(geometry.art.width, 1.95, "art width");
  closeTo(geometry.art.height, 1.3, "art height");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "left/right mat",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "top/bottom mat",
  );
});

test("3:4 portrait artwork has the same physical mat and frame lip", () => {
  const geometry = frameGeometryForArtwork(1.15, 1.55, 3 / 4);

  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "portrait horizontal mat",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "portrait vertical mat",
  );
  closeTo(
    (geometry.frame.width - geometry.matte.width) / 2,
    FRAME_LIP_WIDTH,
    "portrait horizontal lip",
  );
  closeTo(
    (geometry.frame.height - geometry.matte.height) / 2,
    FRAME_LIP_WIDTH,
    "portrait vertical lip",
  );
});

test("square-ish artwork is contained without distortion or uneven matting", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 1);

  closeTo(geometry.art.width, 1.32, "square art width");
  closeTo(geometry.art.height, 1.32, "square art height");
  closeTo(geometry.art.width / geometry.art.height, 1, "square art aspect");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    (geometry.matte.height - geometry.art.height) / 2,
    "square mat equality",
  );
});

test("cover fill uses the full aperture and keeps the white mat ridge", () => {
  const geometry = frameGeometryForArtwork(1.95, 1.32, 1, "cover");

  closeTo(geometry.art.width, 1.95, "cover art width");
  closeTo(geometry.art.height, 1.32, "cover art height");
  closeTo(
    (geometry.matte.width - geometry.art.width) / 2,
    MAT_WIDTH,
    "cover mat ridge",
  );
  closeTo(
    (geometry.matte.height - geometry.art.height) / 2,
    MAT_WIDTH,
    "cover mat ridge vertical",
  );
  closeTo(
    (geometry.frame.width - geometry.matte.width) / 2,
    FRAME_LIP_WIDTH,
    "cover lip",
  );
});

test("cover UV crops the wide side of a landscape image in a portrait aperture", () => {
  const uv = coverUvTransform(3 / 4, 3 / 2);
  closeTo(uv.repeatY, 1, "repeat Y");
  closeTo(uv.repeatX, (3 / 4) / (3 / 2), "repeat X");
  closeTo(uv.offsetX, (1 - uv.repeatX) / 2, "offset X");
  closeTo(uv.offsetY, 0, "offset Y");
});

test("cover UV crops the tall side of a portrait image in a landscape aperture", () => {
  const uv = coverUvTransform(3 / 2, 3 / 4);
  closeTo(uv.repeatX, 1, "repeat X");
  closeTo(uv.repeatY, (3 / 4) / (3 / 2), "repeat Y");
  closeTo(uv.offsetY, (1 - uv.repeatY) / 2, "offset Y");
  closeTo(uv.offsetX, 0, "offset X");
});

test("optional lipWidth override thins the outer frame for Fine Art", () => {
  const defaultGeo = frameGeometryForArtwork(1.15, 1.55, 3 / 4);
  const artGeo = frameGeometryForArtwork(1.15, 1.55, 3 / 4, "contain", {
    matWidth: ART_MAT_WIDTH,
    lipWidth: ART_FRAME_LIP_WIDTH,
  });
  closeTo(
    (defaultGeo.frame.width - defaultGeo.matte.width) / 2,
    FRAME_LIP_WIDTH,
    "default lip",
  );
  closeTo(
    (artGeo.frame.width - artGeo.matte.width) / 2,
    ART_FRAME_LIP_WIDTH,
    "art lip",
  );
  closeTo(
    (artGeo.matte.width - artGeo.art.width) / 2,
    ART_MAT_WIDTH,
    "art mat",
  );
  closeTo(ART_MAT_WIDTH, ART_FRAME_LIP_WIDTH / 4, "art mat is quarter lip");
  assert.ok(artGeo.frame.width < defaultGeo.frame.width);
});

test("light frame bands keep mat at quarter lip; dark keeps studio defaults", () => {
  const light = frameBandsForStyle("light");
  const dark = frameBandsForStyle("dark");
  closeTo(light.matWidth, ART_MAT_WIDTH, "light mat");
  closeTo(light.lipWidth, ART_FRAME_LIP_WIDTH, "light lip");
  closeTo(light.matWidth, light.lipWidth / 4, "light mat = quarter lip");
  closeTo(dark.matWidth, MAT_WIDTH, "dark mat");
  closeTo(dark.lipWidth, FRAME_LIP_WIDTH, "dark lip");
});

test("canvas frame bands drop mat and lip; keep stretcher depth", () => {
  const canvas = frameBandsForStyle("canvas");
  closeTo(canvas.matWidth, 0, "canvas mat");
  closeTo(canvas.lipWidth, 0, "canvas lip");
  assert.ok(canvas.boxDepth > 0, "canvas depth");
  const geo = frameGeometryForArtwork(1.15, 1.55, 3 / 4, "contain", {
    matWidth: canvas.matWidth,
    lipWidth: canvas.lipWidth,
  });
  closeTo(geo.frame.width, geo.art.width, "canvas frame = art width");
  closeTo(geo.frame.height, geo.art.height, "canvas frame = art height");
  closeTo(geo.matte.width, geo.art.width, "canvas matte = art width");
});

test("openFrontBoxGeometry drops the +Z front face (and optional back)", () => {
  const closed = new THREE.BoxGeometry(1, 2, 0.05);
  assert.equal(closed.getIndex()!.count, 36, "closed box: 6 faces × 6 indices");

  const openFront = openFrontBoxGeometry(1, 2, 0.05);
  assert.equal(openFront.getIndex()!.count, 30, "open front: 5 faces");

  const sidesOnly = openFrontBoxGeometry(1, 2, 0.05, { openBack: true });
  assert.equal(sidesOnly.getIndex()!.count, 24, "sides only: 4 faces");
});

test("openFrontRoundedBoxGeometry keeps a side shell with soft corners", () => {
  const geo = openFrontRoundedBoxGeometry(
    1.15,
    1.55,
    0.052,
    CANVAS_CORNER_RADIUS,
    { openBack: true },
  );
  const pos = geo.getAttribute("position");
  assert.ok(pos && pos.count > 24, "filleted shell has more verts than a box");
  assert.equal(pos.count % 3, 0, "non-indexed tris");
  assert.ok(pos.count / 3 >= 8, "has side triangles");

  // No triangle should face mostly ±Z (caps stripped).
  const ax = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    ax.fromBufferAttribute(pos as THREE.BufferAttribute, i);
    ab.fromBufferAttribute(pos as THREE.BufferAttribute, i + 1).sub(ax);
    ac.fromBufferAttribute(pos as THREE.BufferAttribute, i + 2).sub(ax);
    normal.crossVectors(ab, ac).normalize();
    assert.ok(
      Math.abs(normal.z) < 0.75,
      `side normal |nz| should be low, got ${normal.z}`,
    );
  }

  // Fillet: some verts sit on the corner arc.
  const hw = 1.15 / 2;
  const hh = 1.55 / 2;
  const r = CANVAS_CORNER_RADIUS;
  let foundFillet = false;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const axC = (x >= 0 ? 1 : -1) * (hw - r);
    const ayC = (y >= 0 ? 1 : -1) * (hh - r);
    const d = Math.hypot(x - axC, y - ayC);
    if (Math.abs(d - r) < 0.003) {
      foundFillet = true;
      break;
    }
  }
  assert.ok(foundFillet, "has verts on the corner fillet arc");

  const color = geo.getAttribute("color");
  assert.ok(color && color.count === pos.count, "fold vertex colours present");
  let minC = 1;
  let maxC = 0;
  for (let i = 0; i < color.count; i++) {
    const c = color.getX(i);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  assert.ok(minC < 0.9, `fold crease should darken corners (min=${minC})`);
  assert.ok(maxC >= 1, `fold ridge highlight present (max=${maxC})`);

  geo.dispose();
});
