import assert from "node:assert/strict";
import test from "node:test";
import {
  createGalleryProjector,
  isSameWallHangSwitch,
  plaqueCaptionHideMs,
  plaqueCaptionPhase,
  plaqueWorldPoint,
  PLAQUE_CAPTION_FADE_MS,
  PLAQUE_CAPTION_HIDE_CORNER_MS,
  PLAQUE_CAPTION_HIDE_SAME_WALL_MS,
  PLAQUE_GAP,
} from "./galleryPlaque.ts";
import {
  GALLERY_ZOOM_DEFAULT,
  paintingLayout,
  sizeOfPainting,
  type GalleryPainting,
} from "./galleryPaintings.ts";

const sample: GalleryPainting = {
  id: "back-1",
  wall: "back",
  slot: 1,
  order: 1,
  depth: 0.5,
  aspect: "portrait",
  size: { width: 1.1, height: 1.5 },
  wallCount: 3,
};

test("plaqueWorldPoint sits centered under the frame on the wall", () => {
  const layout = paintingLayout(sample);
  const size = sizeOfPainting(sample);
  const plaque = plaqueWorldPoint(sample);

  assert.ok(Math.abs(plaque.x - layout.position.x) < 0.15);
  assert.ok(plaque.y < layout.position.y - size.height / 2);
  assert.ok(plaque.y > layout.position.y - size.height / 2 - 0.5 - PLAQUE_GAP);
  // Nudged into the room along the wall normal (+Z for back wall).
  assert.ok(plaque.z > layout.position.z);
});

test("plaqueWorldPoint under canvas hang has no mat/lip pad", () => {
  const layout = paintingLayout(sample);
  const size = sizeOfPainting(sample);
  const framed = plaqueWorldPoint(sample);
  const canvas = plaqueWorldPoint(sample, { matWidth: 0, lipWidth: 0 });
  // Canvas plaque sits higher (closer to art bottom) than a framed hang.
  assert.ok(canvas.y > framed.y);
  closeTo(
    canvas.y,
    layout.position.y - size.height / 2 - PLAQUE_GAP,
    "canvas plaque under art bottom",
  );
});

function closeTo(actual: number, expected: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`,
  );
}

test("plaqueCaptionPhase freezes and hides during any focus ease", () => {
  assert.deepEqual(
    plaqueCaptionPhase({
      isFocusEasing: true,
      liveVisible: true,
      textureReady: true,
    }),
    { freeze: true, opacity: 0 },
  );
  assert.deepEqual(
    plaqueCaptionPhase({
      isFocusEasing: false,
      liveVisible: true,
      textureReady: true,
    }),
    { freeze: false, opacity: 1 },
  );
  assert.deepEqual(
    plaqueCaptionPhase({
      isFocusEasing: false,
      liveVisible: false,
      textureReady: true,
    }),
    { freeze: false, opacity: 0 },
  );
  assert.deepEqual(
    plaqueCaptionPhase({
      isFocusEasing: false,
      liveVisible: true,
      textureReady: false,
    }),
    { freeze: false, opacity: 0 },
  );
});

test("same-wall caption hide is shorter than corner / wall-to-wall", () => {
  assert.equal(PLAQUE_CAPTION_HIDE_SAME_WALL_MS, 280);
  assert.equal(PLAQUE_CAPTION_HIDE_CORNER_MS, 780);
  assert.equal(PLAQUE_CAPTION_FADE_MS, 200);
  assert.equal(plaqueCaptionHideMs(true), PLAQUE_CAPTION_HIDE_SAME_WALL_MS);
  assert.equal(plaqueCaptionHideMs(false), PLAQUE_CAPTION_HIDE_CORNER_MS);
  assert.ok(PLAQUE_CAPTION_HIDE_SAME_WALL_MS < PLAQUE_CAPTION_HIDE_CORNER_MS);
  assert.ok(PLAQUE_CAPTION_HIDE_SAME_WALL_MS >= 200);
  assert.ok(PLAQUE_CAPTION_HIDE_SAME_WALL_MS <= 350);
});

test("isSameWallHangSwitch only when walls match", () => {
  assert.equal(
    isSameWallHangSwitch({ wall: "back" }, { wall: "back" }),
    true,
  );
  assert.equal(
    isSameWallHangSwitch({ wall: "back" }, { wall: "left" }),
    false,
  );
  assert.equal(isSameWallHangSwitch(null, { wall: "back" }), false);
  assert.equal(isSameWallHangSwitch({ wall: "back" }, undefined), false);
});

test("projector maps a point ahead of the camera into the viewport", () => {
  const project = createGalleryProjector();
  const layout = paintingLayout(sample);
  const pose = {
    x: 0,
    y: 1.62,
    z: 4,
    lookX: layout.position.x,
    lookY: layout.position.y,
    lookZ: layout.position.z,
  };
  const screen = project(
    plaqueWorldPoint(sample),
    pose,
    GALLERY_ZOOM_DEFAULT,
    1200,
    800,
  );
  assert.ok(screen);
  assert.equal(screen!.visible, true);
  assert.ok(screen!.x > 400 && screen!.x < 800);
  assert.ok(screen!.y > 200 && screen!.y < 800);
});

test("projector hides points behind the camera", () => {
  const project = createGalleryProjector();
  const screen = project(
    { x: 0, y: 1.6, z: 10 },
    { x: 0, y: 1.6, z: 0, lookX: 0, lookY: 1.6, lookZ: -1 },
    GALLERY_ZOOM_DEFAULT,
    1200,
    800,
  );
  assert.ok(screen);
  assert.equal(screen!.visible, false);
});

test("zooming in moves the plaque down the viewport while keeping it under the hang", () => {
  const project = createGalleryProjector();
  const plaque = plaqueWorldPoint(sample);
  const layout = paintingLayout(sample);
  // Stand square to the hang, then dolly closer as zoom rises (same idea as
  // standOffForPainting shrinking with zoom).
  const farPose = {
    x: layout.position.x,
    y: 1.62,
    z: layout.position.z + 4.2,
    lookX: layout.position.x,
    lookY: layout.position.y,
    lookZ: layout.position.z,
  };
  const nearPose = {
    ...farPose,
    z: layout.position.z + 2.2,
  };
  const far = project(plaque, farPose, 1, 1200, 800);
  const near = project(plaque, nearPose, 1.8, 1200, 800);
  assert.ok(far?.visible && near?.visible);
  // Closer → plaque (below look target) drops in the frame.
  assert.ok(near!.y > far!.y);
  // Still horizontally centered on the hang.
  assert.ok(Math.abs(near!.x - far!.x) < 2);
});
