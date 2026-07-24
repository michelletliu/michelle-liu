import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./NavigationTabs.tsx", import.meta.url),
  "utf8",
);
const doorwaySource = readFileSync(
  new URL("./DesignSystemLogoLink.tsx", import.meta.url),
  "utf8",
);
const projectModalSource = readFileSync(
  new URL("./project/ProjectModal.tsx", import.meta.url),
  "utf8",
);
const preloadSource = readFileSync(
  new URL("../sanity/preload.ts", import.meta.url),
  "utf8",
);
const homeSource = readFileSync(
  new URL("./HomePageClient.tsx", import.meta.url),
  "utf8",
);

test("does not compile every inactive tab automatically on mount", () => {
  assert.doesNotMatch(
    source,
    /useEffect\(\(\) => \{[\s\S]*?prefetchTab\(tab\.href\)[\s\S]*?\}, \[activeTab, prefetchTab\]\)/,
  );
  assert.match(source, /prefetch=\{false\}/);
  assert.match(source, /process\.env\.NODE_ENV === "development"/);
});

test("finishes the pill transform before changing routes", () => {
  assert.match(source, /pendingHrefRef/);
  assert.match(source, /event\.preventDefault\(\)[\s\S]*pendingHrefRef\.current = tab\.href/);
  assert.match(source, /onTransitionEnd=\{handleIndicatorTransitionEnd\}/);
  assert.match(source, /event\.propertyName !== "transform"/);
  assert.match(source, /router\.push\(href, \{ scroll: false \}\)/);
});

test("does not compile the design system automatically on mount", () => {
  assert.doesNotMatch(doorwaySource, /onMouseEnter=\{prefetchDoorway\}/);
  assert.match(doorwaySource, /process\.env\.NODE_ENV === "development"/);
});

test("doorway click uses capture-phase nav so morph re-renders cannot drop it", () => {
  assert.match(doorwaySource, /data-blueprint-doorway/);
  assert.match(
    doorwaySource,
    /document\.addEventListener\("click", onClick, true\)/,
  );
  assert.doesNotMatch(doorwaySource, /onClick=\{handleClick\}/);
});

test("project preloads and modal opens share one in-flight request", () => {
  assert.doesNotMatch(projectModalSource, /async function fetchProjectByCompany/);
  assert.match(preloadSource, /const projectRequests = new Map/);
  assert.match(homeSource, /process\.env\.NODE_ENV !== "development"/);
});
