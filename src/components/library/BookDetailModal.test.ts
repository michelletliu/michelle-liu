import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modal = readFileSync(
  new URL("./BookDetailModal.tsx", import.meta.url),
  "utf8",
);

test("date arrows stay inline with the first date when ranges wrap", () => {
  const inlineFirstDatePattern =
    /<span className="inline-flex items-center whitespace-nowrap">\s*\{formatBookDate\(book\.dateStarted!\)\}\s*<ArrowRightIcon[\s\S]*?\/>\s*<\/span>\s*<span className="whitespace-nowrap">\{formatBookDate\(finished!\)\}<\/span>/g;

  assert.equal(
    [...modal.matchAll(inlineFirstDatePattern)].length,
    2,
    "mobile and desktop ranges should keep the arrow attached to the first date",
  );
});
