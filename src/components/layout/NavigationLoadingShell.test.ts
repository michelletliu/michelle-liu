import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shellSource = readFileSync(
  new URL("./NavigationLoadingShell.tsx", import.meta.url),
  "utf8",
);
const artSource = readFileSync(
  new URL("../../app/art/loading.tsx", import.meta.url),
  "utf8",
);
const aboutSource = readFileSync(
  new URL("../../app/about/loading.tsx", import.meta.url),
  "utf8",
);
const pageHeaderSource = readFileSync(
  new URL("./PageHeader.tsx", import.meta.url),
  "utf8",
);
const navigationTabsSource = readFileSync(
  new URL("./NavigationTabs.tsx", import.meta.url),
  "utf8",
);
const combinedSource = `${shellSource}\n${artSource}\n${aboutSource}`;
const tabMapSource = shellSource.match(
  /\{tabs\.map\(\(tab\) => \(([\s\S]*?)\)\)\}/,
)?.[1];

function assertSharedGeometry(productionSource: string, snippet: string) {
  assert.ok(
    productionSource.includes(snippet),
    `production geometry is missing: ${snippet}`,
  );
  assert.ok(shellSource.includes(snippet), `loading shell geometry drifted: ${snippet}`);
}

test("route loading shells align to production geometry without spinners", () => {
  assert.doesNotMatch(combinedSource, /LoadingSpinner|animate-spin|Loading\.\.\./);
  assert.match(artSource, /activeTab="art"/);
  assert.match(aboutSource, /activeTab="about"/);

  assertSharedGeometry(
    pageHeaderSource,
    "content-stretch flex flex-col items-start px-16 pt-8 pb-8 max-md:px-6 max-md:pt-8 max-md:pb-4 relative w-full",
  );
  assertSharedGeometry(
    pageHeaderSource,
    "content-stretch flex flex-col gap-4 items-start pt-14 px-16 max-md:px-6 max-md:pt-20 relative w-full max-md:min-h-[210px] md:min-h-[176px]",
  );
  assertSharedGeometry(
    navigationTabsSource,
    "content-stretch flex flex-col items-center pb-4 max-md:pb-1.75 pt-0 px-0 relative shrink-0 w-full",
  );
  assertSharedGeometry(
    navigationTabsSource,
    "content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-6 relative w-full",
  );
  assertSharedGeometry(
    navigationTabsSource,
    "px-16 max-md:px-6 w-full pt-3",
  );
  assertSharedGeometry(
    navigationTabsSource,
    "bg-zinc-100 h-px shrink-0 w-full",
  );

  assert.match(shellSource, /header-gradient/);
  assert.match(shellSource, /Rectangle Grain 1\.png/);
  assert.match(shellSource, /backgroundRepeat: "repeat"/);
  assert.match(shellSource, /backgroundSize: "auto"/);
  assert.match(shellSource, /opacity: 0\.8/);

  assert.match(shellSource, /id: "work".*id: "art".*id: "about"/s);
  assert.match(shellSource, /tab\.id === activeTab/);
  assert.match(shellSource, /\{tab\.label\}/);
  assert.match(
    shellSource,
    /px-3\.5 pt-\[5px\] pb-\[4px\][\s\S]*font-\['Michelle',sans-serif\][\s\S]*text-lg text-nowrap/,
  );
  assert.ok(tabMapSource);
  assert.doesNotMatch(tabMapSource, /\bw-(?:\[[^\]]+\]|\d+(?:\.\d+)?)\b/);
  assert.match(shellSource, /w-\[202px\]/);
  assert.match(
    shellSource,
    /flex flex-col md:flex-row gap-10 md:gap-16 items-center md:items-start w-full max-w-5xl/,
  );
  assert.match(shellSource, /w-72 md:w-76/);
  assert.match(shellSource, /activeTab === "about" \? "gap-20" : "gap-12"/);
  assert.match(shellSource, /aria-hidden="true"/);
});
