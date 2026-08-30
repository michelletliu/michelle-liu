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

test("receipt chrome sticks on scroll instead of using viewport-fixed positioning", () => {
  assert.match(
    screentimeSource,
    /pointer-events-none sticky top-0 z-40/,
  );
  assert.match(
    screentimeSource,
    /InfoButton\s+project=\{projectInfo\}\s+className="relative z-50 flex h-8 items-center md:h-11"/,
  );
  assert.doesNotMatch(
    screentimeSource,
    /className=\{`fixed top-8 left-6/,
  );
});
