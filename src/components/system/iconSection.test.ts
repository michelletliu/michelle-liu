import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/IconSection.tsx", import.meta.url),
  "utf8",
);

test("filled icon specimens use consistent optical sizing", () => {
  assert.match(section, /function LockIcon\(\) \{[\s\S]*?<svg className="size-5"/);
  assert.match(
    section,
    /name: "Academic cap",[\s\S]*?<FilledAssetIcon src=\{academicCapIcon\} className="size-6" \/>/,
  );
  assert.match(
    section,
    /name: "Apple",[\s\S]*?<svg className="size-5"[\s\S]*?APPLE_LOGO_PATH/,
  );
  assert.match(
    section,
    /name: "Favorites star",[\s\S]*?className="flex size-5 items-center justify-center text-xl leading-none/,
  );
  assert.match(
    section,
    /name: "Heart fill",[\s\S]*?<FilledAssetIcon src=\{heartFillIcon\} \/>/,
  );
  assert.match(
    section,
    /name: "Circle",[\s\S]*?<CircleIcon size=\{FILLED_COMPACT_SIZE\} \/>/,
  );
  assert.match(section, /const FILLED_COMPACT_SIZE = 24/);
  assert.match(
    section,
    /name: "Coffee",[\s\S]*?<FilledAssetIcon src=\{coffeeFillIcon\} className="size-6" \/>/,
  );
  assert.match(
    section,
    /name: "Grid fill",[\s\S]*?<GridIcon size=\{FILLED_COMPACT_SIZE\} filled \/>/,
  );
  assert.match(
    section,
    /name: "Map pin",[\s\S]*?<FilledAssetIcon src=\{mapPinIcon\} className="size-6" \/>/,
  );
  assert.match(
    section,
    /name: "Squircle",[\s\S]*?<SquircleIcon size=\{FILLED_COMPACT_SIZE\} \/>/,
  );
});

test("social icons include GitHub in LinkedIn → X → Instagram → Luma → GitHub order", () => {
  assert.match(
    section,
    /const socialIcons: IconSpecimen\[] = \[[\s\S]*?name: "LinkedIn"[\s\S]*?name: "X"[\s\S]*?name: "Instagram"[\s\S]*?name: "Luma"[\s\S]*?name: "GitHub"/,
  );
});

test("icon category headings do not render explanatory subtext", () => {
  assert.doesNotMatch(section, /Solid glyphs\. Zinc-500\./);
  assert.doesNotMatch(section, /Social marks\. Zinc-500\./);
  assert.doesNotMatch(section, /Text-zinc-500 · StrokeWidth 1\.5/);
});

test("icon categories render as Filled → Stroke → Social", () => {
  assert.match(
    section,
    /<SubLabel>Filled<\/SubLabel>[\s\S]*?filledIcons\.map[\s\S]*?<SubLabel>Stroke<\/SubLabel>[\s\S]*?uiIcons\.map[\s\S]*?<SubLabel>Social<\/SubLabel>[\s\S]*?socialIcons\.map/,
  );
  assert.doesNotMatch(section, /<SubLabel>(?:Filled|Stroke) icons<\/SubLabel>/);
});