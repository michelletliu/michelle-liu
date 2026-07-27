import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GALLERY_PANEL_CONTENT_ENTER_MS,
  GALLERY_PANEL_CONTENT_EXIT_MS,
  GALLERY_PANEL_MORPH_MS,
  galleryPanelContentTransition,
  galleryPanelMorphTransition,
} from "./galleryMotion.ts";

const actionBarSource = readFileSync(
  new URL("./GalleryActionBar.tsx", import.meta.url),
  "utf8",
);
const pickerSource = readFileSync(
  new URL("./MetArtworkPicker.tsx", import.meta.url),
  "utf8",
);
const cameraSource = readFileSync(
  new URL("./useGalleryCamera.ts", import.meta.url),
  "utf8",
);

test("panel motion is restrained and has no spring overshoot", () => {
  assert.ok(GALLERY_PANEL_MORPH_MS <= 200);
  assert.ok(GALLERY_PANEL_CONTENT_ENTER_MS <= 160);
  assert.ok(GALLERY_PANEL_CONTENT_EXIT_MS < GALLERY_PANEL_CONTENT_ENTER_MS);

  const transition = galleryPanelMorphTransition(false);
  assert.equal(transition.type, "tween");
  assert.equal(transition.duration, GALLERY_PANEL_MORPH_MS / 1000);
  assert.ok(!("bounce" in transition));
  assert.ok(!("stiffness" in transition));
  assert.match(cameraSource, /GALLERY_PANEL_MORPH_MS/);
  assert.doesNotMatch(cameraSource, /FRAMING_EASE_MS\s*=\s*320/);
});

test("reduced motion disables projection and transform animation", () => {
  assert.deepEqual(galleryPanelMorphTransition(true), { duration: 0 });
  assert.deepEqual(galleryPanelContentTransition(true, "enter"), {
    duration: 0,
  });
  assert.match(actionBarSource, /layout=\{!reduceMotion\}/);
  assert.doesNotMatch(actionBarSource, /initial=\{\{[^}]*\b(?:x|y|scale):/s);
});

test("artwork cards crossfade without shared layout ids", () => {
  assert.doesNotMatch(actionBarSource, /layoutId=/);
  assert.doesNotMatch(pickerSource, /layoutId=/);
  assert.match(actionBarSource, /initial=\{\{ opacity: 0 \}\}/);
  assert.match(actionBarSource, /exit=\{\{\s*opacity: 0,/);
});
