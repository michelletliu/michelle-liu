import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fieldInput = readFileSync(
  new URL("./FieldInput.tsx", import.meta.url),
  "utf8",
);

test("FieldInput text uses normal weight site-wide", () => {
  assert.match(
    fieldInput,
    /export const fieldInputClassName =\s*"[^"]*\bfont-normal\b[^"]*"/,
  );
  assert.doesNotMatch(
    fieldInput,
    /export const fieldInputClassName =\s*"[^"]*\bfont-medium\b[^"]*"/,
  );
});

test("FieldInput leading icons default to the md icon size", () => {
  assert.match(fieldInput, /size = iconSize\("md"\)/);
  assert.doesNotMatch(fieldInput, /size = iconSize\("inline"\)/);
  assert.doesNotMatch(fieldInput, /size = iconSize\("sm"\)/);
});
