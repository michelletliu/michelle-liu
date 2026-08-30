import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ProjectModal.tsx", import.meta.url), "utf8");

test("table of contents background is full-bleed with 800px inner content", () => {
  assert.match(
    source,
    /fullBleed =\s*[\s\S]*?tableOfContentsSection[\s\S]*?sectionHeaderBar/,
  );
  assert.match(
    source,
    /ref=\{tocRef\}[\s\S]{0,280}max-w-\[800px\]/,
  );
  assert.doesNotMatch(
    source,
    /ref=\{tocRef\}[\s\S]{0,400}xl:px-\[175px\]/,
  );
});

test("table of contents cards use compact padding", () => {
  assert.match(
    source,
    /px-4\.5 py-5 md:px-5\.5 md:py-6 bg-white rounded-2xl/,
  );
  assert.doesNotMatch(
    source,
    /p-6 md:p-8 md:py-12 bg-white/,
  );
});

test("header bars stay full-bleed", () => {
  assert.match(
    source,
    /section\._type === "sectionHeaderBar"/,
  );
});
