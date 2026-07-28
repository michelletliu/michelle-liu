import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeSource = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");
const badgeSource = readFileSync(new URL("./ContactBadge.tsx", import.meta.url), "utf8");

test("uses large contact text and deeper intro fade on Work", () => {
  assert.match(homeSource, /isContactBadgeExpanded \? "opacity-20" : "opacity-100"/);
  assert.match(
    homeSource,
    /<ContactBadge[\s\S]*?size="lg"[\s\S]*?onExpandedChange=\{setIsContactBadgeExpanded\}/,
  );
  assert.match(badgeSource, /resolvedSize === "lg" \? "text-lg"/);
  assert.match(
    badgeSource,
    /resolvedSize === "lg" &&\s+"gap-1 py-0 pl-2 pr-3"/,
  );
});
