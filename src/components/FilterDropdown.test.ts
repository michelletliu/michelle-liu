import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");

test("aligns option text to the trigger with tighter outer vertical padding", () => {
  assert.match(source, /flex flex-col gap-1 px-1 py-1/);
  assert.match(source, /flex items-center px-2 py-1/);
});

test("matches dropdown panel width to the filter pill", () => {
  assert.doesNotMatch(source, /min-w-\[140px\]/);
  assert.match(source, /el\.style\.width = `\$\{snapRef\.current\.width\}px`/);
  assert.match(source, /panelRef\.current\.style\.width = `\$\{rect\.width\}px`/);
  assert.match(source, /absolute left-0 top-\[calc\(100%\+4px\)\] w-full/);
});
