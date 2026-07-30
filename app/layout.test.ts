import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(
  new URL("./layout.tsx", import.meta.url),
  "utf8",
);

test("root layout leaves <head> for Next.js to fill with styles and metadata", () => {
  assert.doesNotMatch(layoutSource, /<head[^>]*\n?[^>]*dangerouslySetInnerHTML/);
});

test("the page-source greeting still ships with the document", () => {
  assert.match(layoutSource, /hi, curious stranger :\)/);
  assert.match(layoutSource, /dangerouslySetInnerHTML=\{\{ __html: devtoolsComment \}\}/);
});
