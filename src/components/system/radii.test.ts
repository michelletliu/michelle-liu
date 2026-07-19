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

test("round and squircle specimens overlay each other's corner segments", () => {
  const section = readFileSync(
    new URL("./sections/RadiusSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    section,
    /\{ label: "Round", d: ROUND_PATH, overlayCorners: SQUIRCLE_CORNERS \}/,
  );
  assert.match(
    section,
    /\{ label: "Squircle", d: SQUIRCLE_PATH, overlayCorners: ROUND_CORNERS \}/,
  );
  assert.match(section, /strokeOpacity=\{showGrid \? 0\.15 : 0\.3\}/);
  assert.match(section, /filled=\{showGrid\}/);
});

test("token card labels and usage copy have no vertical gap", () => {
  const primitives = readFileSync(
    new URL("./primitives.tsx", import.meta.url),
    "utf8",
  );

  assert.match(primitives, /className="flex flex-col gap-0 pl-2"/);
  assert.doesNotMatch(primitives, /className="flex flex-col gap-1 pl-2"/);
});
