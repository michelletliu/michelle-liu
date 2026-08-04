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

test("color categories use a dropdown on mobile and pills from mid upward", () => {
  assert.match(section, /import \{ FilterDropdown \} from "\.\.\/\.\.\/shared\/FilterDropdown"/);
  assert.match(
    section,
    /<FilterDropdown[\s\S]*?className="mb-4 mid:hidden"[\s\S]*?usePortal/,
  );
  assert.match(section, /className="mb-4 hidden mid:block"/);
  assert.doesNotMatch(section, /scrollbar-hide overflow-x-auto/);
});
