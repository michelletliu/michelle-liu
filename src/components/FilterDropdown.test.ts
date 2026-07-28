import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns and sizes the panel symmetrically around the trigger", () => {
  assert.match(source, /const PANEL_LEFT_OFFSET = 5/);
  assert.match(source, /const PANEL_GAP = 2/);
  assert.match(source, /const PANEL_WIDTH_EXPANSION = PANEL_LEFT_OFFSET \* 2/);
  assert.match(source, /const PANEL_MIN_WIDTH = 180/);
  assert.match(source, /Math\.max\(rect\.width \+ PANEL_WIDTH_EXPANSION, PANEL_MIN_WIDTH\)/);
  assert.match(source, /rect\.left - \(width - rect\.width\) \/ 2/);
  assert.equal(source.match(/rect\.bottom \+ PANEL_GAP/g)?.length, 3);
  assert.match(source, /el\.style\.width = `\$\{snapRef\.current\.width\}px`/);
  assert.match(source, /min-w-\[180px\]/);
  assert.match(source, /absolute left-1\/2 top-\[calc\(100%\+2px\)\] w-\[calc\(100%\+10px\)\] -translate-x-1\/2/);
  assert.match(source, /flex flex-col gap-1 p-1/);
  assert.match(source, /flex items-center px-3 py-1/);
  assert.match(source, /rounded-2xl/);
  assert.match(source, /rounded-\[11px\]/);
});
