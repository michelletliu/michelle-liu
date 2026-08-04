import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fieldInput = readFileSync(
  new URL("./FieldInput.tsx", import.meta.url),
  "utf8",
);
const globalsCss = readFileSync(
  new URL("../../styles/globals.css", import.meta.url),
  "utf8",
);

test("FieldInput uses the semantic field-input class", () => {
  assert.match(fieldInput, /export const fieldInputClassName = "field-input"/);
});

test("FieldInput text uses normal weight site-wide", () => {
  assert.match(globalsCss, /\.field-input\s*\{[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(
    globalsCss,
    /\.field-input\s*\{[^}]*font-weight:\s*500/s,
  );
});

test("FieldInput leading icons default to the md icon size", () => {
  assert.match(fieldInput, /size = iconSize\("md"\)/);
  assert.doesNotMatch(fieldInput, /size = iconSize\("inline"\)/);
  assert.doesNotMatch(fieldInput, /size = iconSize\("sm"\)/);
});
