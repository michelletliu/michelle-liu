import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./PageHeader.tsx", import.meta.url),
  "utf8",
);

test("replays the description fade-up whenever a page header mounts", () => {
  assert.match(
    source,
    /style=\{\{\s*animation:\s*"projectCardEnter 360ms cubic-bezier\(0\.25, 0\.46, 0\.45, 0\.94\) both",?\s*\}\}/,
  );
  assert.doesNotMatch(
    source,
    /heroAnimationPlayed\s*\?\s*undefined\s*:/,
  );
});
