import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/IconSection.tsx", import.meta.url),
  "utf8",
);
const tokens = readFileSync(new URL("./tokens.ts", import.meta.url), "utf8");
const filmPage = readFileSync(
  new URL("../film/FilmPage.tsx", import.meta.url),
  "utf8",
);

test("icon size ramp uses semantic xs/sm/md/lg/xl names", () => {
  assert.match(
    section,
    /const ICON_SIZE_RAMP: IconSizeName\[] = \[\s*"xs",\s*"sm",\s*"md",\s*"lg",\s*"xl",\s*\]/,
  );
  assert.doesNotMatch(section, /"meta"|"inline"|"toolbar"|"touch"|"hero"/);
});

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
    /name: "Coffee",[\s\S]*?<FilledAssetIcon src=\{coffeeFillIcon\} className="size-5" \/>/,
  );
  assert.match(
    section,
    /name: "Grid",[\s\S]*?<GridIcon size=\{MD\} filled \/>/,
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
  assert.match(tokens, /icons: \["Size", "Filled", "Stroke", "Social"\]/);
});

test("media controls are separate, smaller specimens without an unused rewind glyph", () => {
  assert.match(
    section,
    /name: "Pause",[\s\S]*?sample: <FilmPauseIcon \/>[\s\S]*?name: "Play",[\s\S]*?sample: <FilmPlayIcon \/>/,
  );
  assert.match(
    section,
    /function FilmPlayIcon\(\) \{[\s\S]*?<svg className="size-4"/,
  );
  assert.match(
    section,
    /function FilmPauseIcon\(\) \{[\s\S]*?<svg className="size-4"/,
  );
  assert.doesNotMatch(section, /FilmRewindIcon|Play \/ pause \/ rewind/);
  assert.doesNotMatch(filmPage, /function FilmRewindIcon/);
});

test("sun and moon use separate alphabetized specimens", () => {
  assert.match(
    section,
    /name: "Moon",[\s\S]*?sample: <MoonIcon \/>[\s\S]*?name: "Pause"[\s\S]*?name: "Squircle"[\s\S]*?name: "Sun",[\s\S]*?sample: <SunIcon \/>/,
  );
  assert.doesNotMatch(section, /name: "Sun \/ moon"/);
});

test("eye and eye-off use separate alphabetized specimens", () => {
  assert.match(
    section,
    /name: "Eye",[\s\S]*?sample: <EyeIcon \/>[\s\S]*?name: "Eye off",[\s\S]*?sample: <EyeOffIcon \/>/,
  );
  assert.doesNotMatch(section, /name: "Eye \/ eye-off"/);
});

test("stroke icons include Search in alphabetical order", () => {
  assert.match(
    section,
    /name: "Plus"[\s\S]*?name: "Search",[\s\S]*?sample: <SearchIcon \/>[\s\S]*?name: "Send"/,
  );
  assert.match(
    section,
    /function SearchIcon\(\) \{[\s\S]*?<svg className="size-5"[\s\S]*?strokeWidth=\{ICON_STROKE_WIDTH\}/,
  );
});