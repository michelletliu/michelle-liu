import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sectionSource = readFileSync(
  new URL("./sections/MotionSection.tsx", import.meta.url),
  "utf8",
);
const tokensSource = readFileSync(new URL("./tokens.ts", import.meta.url), "utf8");

test("film-dot-pulse uses a distinct staggered ellipsis preview", () => {
  assert.match(
    tokensSource,
    /name: "film-dot-pulse"[^}]+keyframe: "film-dot-pulse"/,
  );
  assert.match(sectionSource, /case "film-dot-pulse":/);
  assert.match(sectionSource, /animationDelay: "0s"/);
  assert.match(sectionSource, /animationDelay: "0\.2s"/);
  assert.match(sectionSource, /animationDelay: "0\.4s"/);
});
