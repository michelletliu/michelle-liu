import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/ColorSection.tsx", import.meta.url),
  "utf8",
);

test("color overview uses fixed 32px swatches on mobile", () => {
  assert.match(section, /grid-cols-\[repeat\(auto-fill,32px\)\]/);
  assert.match(
    section,
    /mid:grid-cols-\[repeat\(auto-fill,minmax\(44px,1fr\)\)\]/,
  );
});

test("color category tabs scroll horizontally behind a trailing blur", () => {
  assert.match(section, /scrollbar-hide overflow-x-auto/);
  assert.match(section, /backdrop-blur-sm/);
  assert.match(section, /mask-image:linear-gradient\(to_right,transparent,black\)/);
});
