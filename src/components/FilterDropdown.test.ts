import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("uses 10px option padding while preserving the trigger's 12px text inset", () => {
  assert.match(source, /flex flex-col gap-0\.5 px-0\.5 py-1/);
  assert.match(source, /flex items-center px-2\.5 py-0\.5/);
});
