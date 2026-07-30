import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screentimeSource = readFileSync(
  new URL("./ScreentimePage.tsx", import.meta.url),
  "utf8",
);

test("receipt clears the fixed logo on mobile", () => {
  assert.match(
    screentimeSource,
    /receipt-screen-container[^"]*\bpt-20\b[^"]*\bmd:pt-16\b/,
  );
});

test("simulated home indicator is not rendered", () => {
  assert.doesNotMatch(screentimeSource, /HomeIndicator/);
});
