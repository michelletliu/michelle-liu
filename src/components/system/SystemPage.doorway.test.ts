import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SystemPage.tsx", import.meta.url), "utf8");

test("doorway-back hard-assigns from section paths so one click leaves DS", () => {
  assert.match(source, /data-blueprint-doorway-back/);
  assert.match(
    source,
    /document\.addEventListener\("click", onClick, true\)/,
  );
  assert.match(source, /const onSectionPath = window\.location\.pathname\.startsWith/);
  assert.match(source, /DESIGN_SYSTEM_BASE_PATH/);
  assert.match(source, /window\.location\.assign\(href\)/);
  assert.match(
    source,
    /if \(onSectionPath\) \{\s*window\.location\.assign\(href\);\s*return;\s*\}/,
  );
});
