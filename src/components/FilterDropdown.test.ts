import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns option text to the trigger with tighter outer vertical padding", () => {
  assert.match(source, /flex flex-col gap-1 px-1 py-1/);
  assert.match(source, /flex items-center px-2 py-1/);
});
