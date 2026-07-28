import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/ComponentSection.tsx", import.meta.url),
  "utf8",
);

test("input matrix labels live outside the horizontal scroller", () => {
  assert.doesNotMatch(section, /INPUT_MATRIX_STICKY_COL/);
  assert.match(
    section,
    /md:grid-cols-\[7\.5rem_minmax\(0,1fr\)\]/,
  );
});

test("input matrix renders fades at both horizontal edges", () => {
  assert.match(
    section,
    /left-0 z-10 w-10 bg-gradient-to-r from-zinc-50 to-transparent/,
  );
  assert.match(
    section,
    /right-0 z-10 w-10 bg-gradient-to-l from-zinc-50 to-transparent/,
  );
});
