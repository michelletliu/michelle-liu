import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./FilterDropdown.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(
  new URL("../../styles/globals.css", import.meta.url),
  "utf8",
);

test("aligns option text to the trigger with tighter outer vertical padding", () => {
  assert.match(source, /filter-dropdown-options/);
  assert.match(source, /filter-dropdown-option/);
  assert.match(
    cssSource,
    /\.filter-dropdown-options\s*\{[^}]*padding:\s*0\.25rem/s,
  );
  assert.match(
    cssSource,
    /\.filter-dropdown-option\s*\{[^}]*padding:\s*0\.25rem 0\.5rem/s,
  );
});

test("panel hugs content with trigger as min width and single-line options", () => {
  assert.doesNotMatch(source, /min-w-\[140px\]/);
  assert.doesNotMatch(source, /el\.style\.width = `\$\{snapRef\.current\.width\}px`/);
  assert.doesNotMatch(source, /panelRef\.current\.style\.width = `\$\{rect\.width\}px`/);
  assert.match(source, /el\.style\.minWidth = `\$\{snapRef\.current\.width\}px`/);
  assert.match(source, /panelRef\.current\.style\.minWidth = `\$\{rect\.width\}px`/);
  assert.match(source, /filter-dropdown-panel/);
  assert.match(cssSource, /\.filter-dropdown-panel\.inline/);
  assert.match(
    cssSource,
    /\.filter-dropdown-option-label\s*\{[^}]*white-space:\s*nowrap/s,
  );
});
