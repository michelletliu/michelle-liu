import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns and sizes the panel symmetrically around the trigger", () => {
  assert.match(source, /const PANEL_LEFT_OFFSET = 5/);
  assert.match(source, /const PANEL_GAP = 2/);
  assert.match(source, /const PANEL_WIDTH_EXPANSION = PANEL_LEFT_OFFSET \* 2/);
  assert.equal(source.match(/rect\.left - PANEL_LEFT_OFFSET/g)?.length, 3);
  assert.equal(source.match(/rect\.bottom \+ PANEL_GAP/g)?.length, 3);
  assert.match(source, /rect\.width \+ PANEL_WIDTH_EXPANSION/);
  assert.match(source, /el\.style\.width = `\$\{snapRef\.current\.width\}px`/);
  assert.match(source, /min-w-\[140px\]/);
  assert.match(source, /absolute -left-\[5px\] top-\[calc\(100%\+2px\)\] w-\[calc\(100%\+10px\)\]/);
  assert.match(source, /flex flex-col gap-1 p-1/);
  assert.match(source, /flex items-center px-3 py-1/);
});
