import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const copiedFigmaExport = join(
  srcRoot,
  "assets/receipt/Screen Time Receipt",
);

function runtimeSourceFiles(directory: string): string[] {
  if (directory === copiedFigmaExport) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimeSourceFiles(path);
    if (
      ![".ts", ".tsx"].includes(extname(entry.name)) ||
      entry.name === "radii.test.ts"
    ) {
      return [];
    }
    return [path];
  });
}

test("runtime components use canonical radius utilities", () => {
  const noncanonical = /rounded-\[(?:7|11|12|16|24|100)px\]/;
  const violations = runtimeSourceFiles(srcRoot).filter((path) =>
    noncanonical.test(readFileSync(path, "utf8")),
  );

  assert.deepEqual(violations, []);
});

test("the radius page contains no experimental radius group", () => {
  const tokens = readFileSync(new URL("./tokens.ts", import.meta.url), "utf8");
  const section = readFileSync(
    new URL("./sections/RadiusSection.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(tokens, /oddRadii/);
  assert.doesNotMatch(section, /Experiment radii|oddRadii/);
});

test("round and squircle specimens meet in the center with blue strokes when the grid is on", () => {
  const section = readFileSync(
    new URL("./sections/RadiusSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    section,
    /translate-x-\[calc\(50%\+1rem\)\] sm:translate-x-\[calc\(50%\+2rem\)\]/,
  );
  assert.match(
    section,
    /-translate-x-\[calc\(50%\+1rem\)\] sm:-translate-x-\[calc\(50%\+2rem\)\]/,
  );
  assert.match(section, /transition-transform/);
  assert.doesNotMatch(section, /transition-\[transform,filter\]/);
  assert.match(section, /37 99 235/);
  assert.match(section, /strokeAlpha: 0\.95/);
  assert.match(section, /strokeAlpha: 0\.38/);
  assert.match(section, /const RADIUS = 56/);
  assert.match(section, /backgroundSize: "10% 10%"/);
  assert.match(section, /strokeAlpha: 0\.38/);
  assert.match(section, /strokeAlpha: 0\.95/);
  assert.match(section, /const COMPARE_STROKE = 2/);
  assert.doesNotMatch(section, /gridStrokeWidth/);
  assert.doesNotMatch(section, /overlayCorners/);
});

test("token card title and usage use gap-0 with a medium-weight title", () => {
  const primitives = readFileSync(
    new URL("./primitives.tsx", import.meta.url),
    "utf8",
  );

  assert.match(primitives, /className="flex flex-col gap-0 pl-2"/);
  assert.match(
    primitives,
    /text-base font-medium text-zinc-700/,
  );
  assert.doesNotMatch(
    primitives,
    /usage \? "gap-0\.5" : "gap-0"/,
  );
  assert.doesNotMatch(
    primitives,
    /text-base font-normal text-zinc-700/,
  );
});
