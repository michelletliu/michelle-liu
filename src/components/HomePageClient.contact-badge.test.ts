import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");

test("uses base-size contact badge and deeper intro fade on Work", () => {
  assert.match(source, /isContactBadgeExpanded \? "opacity-20" : "opacity-100"/);
  assert.match(
    source,
    /<ContactBadge[\s\S]*?size="md"[\s\S]*?onExpandedChange=\{setIsContactBadgeExpanded\}/,
  );
});
