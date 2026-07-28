import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("keeps 12px horizontal text inset with production vertical spacing", () => {
  assert.match(source, /flex flex-col gap-1 px-0\.5 py-1\.5/);
  assert.match(source, /flex items-center px-2\.5 py-1/);
});
