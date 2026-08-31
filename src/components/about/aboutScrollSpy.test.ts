import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_SCROLL_THRESHOLD_PX,
  firstIntersectingSection,
  resolveAboutCategory,
  sectionAtThreshold,
} from "./aboutScrollSpy.ts";

test("sectionAtThreshold keeps community while the archive panel fills the spy line", () => {
  const sections = [
    { id: "community", top: -1800, bottom: 680 },
    { id: "philosophy", top: 680, bottom: 1400 },
  ];
  assert.equal(
    sectionAtThreshold(sections, ABOUT_SCROLL_THRESHOLD_PX),
    "community",
  );
});

test("sectionAtThreshold selects philosophy when community no longer contains the spy line", () => {
  const sections = [
    { id: "community", top: -1800, bottom: 80 },
    { id: "philosophy", top: 80, bottom: 900 },
  ];
  assert.equal(
    sectionAtThreshold(sections, ABOUT_SCROLL_THRESHOLD_PX),
    "philosophy",
  );
});

test("resolveAboutCategory keeps community while Archive is still on screen", () => {
  const sections = [
    { id: "community", top: -1800, bottom: 80 },
    { id: "philosophy", top: 80, bottom: 900 },
  ];
  assert.equal(
    resolveAboutCategory(sections, ABOUT_SCROLL_THRESHOLD_PX, 800),
    "community",
  );
});

test("resolveAboutCategory keeps community when Archive is flush with the top edge", () => {
  const sections = [
    { id: "community", top: -2243, bottom: 0 },
    { id: "philosophy", top: 80, bottom: 900 },
  ];
  assert.equal(
    resolveAboutCategory(sections, ABOUT_SCROLL_THRESHOLD_PX, 800, {
      top: -32,
      bottom: 0,
    }),
    "community",
  );
});

test("resolveAboutCategory selects philosophy only after community has left the viewport", () => {
  const sections = [
    { id: "community", top: -1800, bottom: -80 },
    { id: "philosophy", top: -12, bottom: 900 },
  ];
  assert.equal(
    resolveAboutCategory(sections, ABOUT_SCROLL_THRESHOLD_PX, 800, {
      top: -120,
      bottom: -80,
    }),
    "philosophy",
  );
});

test("resolveAboutCategory does not keep community when Archive is far below the fold", () => {
  const sections = [
    { id: "hi", top: -20, bottom: 400 },
    { id: "community", top: 900, bottom: 1600 },
    { id: "philosophy", top: 1600, bottom: 2200 },
  ];
  assert.equal(
    resolveAboutCategory(sections, ABOUT_SCROLL_THRESHOLD_PX, 800, {
      top: 1825,
      bottom: 1857,
    }),
    "hi",
  );
});

test("firstIntersectingSection falls back to the first on-screen section", () => {
  const sections = [
    { id: "hi", top: -200, bottom: -20 },
    { id: "experience", top: 40, bottom: 400 },
  ];
  assert.equal(firstIntersectingSection(sections, 800), "experience");
});
