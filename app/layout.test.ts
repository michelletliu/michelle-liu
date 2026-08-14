import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(
  new URL("./layout.tsx", import.meta.url),
  "utf8",
);
const restoreSource = readFileSync(
  new URL("../src/components/shared/HomeScrollRestoreScript.tsx", import.meta.url),
  "utf8",
);

test("root layout leaves <head> for Next.js to fill with styles and metadata", () => {
  assert.doesNotMatch(layoutSource, /<head[^>]*\n?[^>]*dangerouslySetInnerHTML/);
});

test("the page-source greeting still ships with the document", () => {
  assert.match(layoutSource, /hi, curious stranger :\)/);
  assert.match(layoutSource, /dangerouslySetInnerHTML=\{\{ __html: devtoolsComment \}\}/);
});

test("home-scroll restore is not a React <script> child of the layout", () => {
  assert.doesNotMatch(layoutSource, /<script/);
  assert.match(layoutSource, /<HomeScrollRestoreScript/);
  assert.match(restoreSource, /useServerInsertedHTML/);
  assert.match(restoreSource, /HOME_SCROLL_RESTORE_SCRIPT/);
});
