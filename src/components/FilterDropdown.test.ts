import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns option text while extending the panel left of the trigger", () => {
  assert.match(source, /const PANEL_LEFT_OFFSET = 5/);
  assert.equal(source.match(/rect\.left - PANEL_LEFT_OFFSET/g)?.length, 3);
  assert.match(source, /absolute -left-\[5px\] top-\[calc\(100%\+4px\)\]/);
  assert.match(source, /flex flex-col gap-1 p-1/);
  assert.match(source, /flex items-center px-3 py-1/);
});
