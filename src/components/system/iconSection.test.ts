import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/IconSection.tsx", import.meta.url),
  "utf8",
);

test("filled icon specimens use consistent 20px canvases with optical compensation", () => {
  assert.match(section, /function LockIcon\(\) \{[\s\S]*?<svg className="size-5"/);
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
  assert.match(
    section,
    /name: "Grid fill",[\s\S]*?<GridIcon size=\{FILLED_COMPACT_SIZE\} filled \/>/,
  );
  assert.match(
    section,
    /name: "Squircle",[\s\S]*?<SquircleIcon size=\{FILLED_COMPACT_SIZE\} \/>/,
  );
});
