import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const startupCardSource = readFileSync(
  new URL("./StartupCard.tsx", import.meta.url),
  "utf8",
);
const aboutPageSource = readFileSync(
  new URL("./AboutPage.tsx", import.meta.url),
  "utf8",
);

test("matches the Apple experience logo size at each breakpoint", () => {
  assert.match(
    startupCardSource,
    /className="relative size-14 md:size-20 shrink-0 overflow-hidden rounded-full/,
  );
  assert.match(aboutPageSource, /className="w-14 md:w-auto"/);
});

test("keeps the startup row flush with the experience logos", () => {
  assert.doesNotMatch(aboutPageSource, /md:-ml-2/);
});

test("fills available width while capping startup spacing at gap-16", () => {
  assert.match(
    aboutPageSource,
    /className="mx-auto flex w-full max-w-\[26rem\] flex-wrap justify-between gap-y-6 md:mx-0 md:max-w-lg"/,
  );
  assert.doesNotMatch(aboutPageSource, /(?:sm|md|lg):gap-x-(?:8|12)/);
});
