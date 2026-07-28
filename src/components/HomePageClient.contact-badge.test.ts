import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeSource = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");
const badgeSource = readFileSync(new URL("./ContactBadge.tsx", import.meta.url), "utf8");
const specimenSource = readFileSync(
  new URL("./system/sections/ComponentSection.tsx", import.meta.url),
  "utf8",
);

test("uses large contact text and deeper intro fade on Work", () => {
  assert.match(homeSource, /isContactBadgeExpanded \? "opacity-20" : "opacity-100"/);
  assert.match(
    homeSource,
    /<ContactBadge[\s\S]*?size="lg"[\s\S]*?onExpandedChange=\{setIsContactBadgeExpanded\}/,
  );
  assert.match(badgeSource, /resolvedSize === "lg" \? "text-lg"/);
  assert.match(
    badgeSource,
    /resolvedSize === "lg" &&\s+"gap-1 py-0 pl-2 pr-3 md:-ml-0\.5"/,
  );
  assert.match(badgeSource, /touch\s+<\/a>!/);
  assert.doesNotMatch(badgeSource, /touch!\s+<\/a>/);
});

test("shows the header badge at its large size in the design system", () => {
  assert.match(specimenSource, /<ContactBadge size="lg" \/>/);
  assert.match(specimenSource, /lg · Header/);
  assert.doesNotMatch(specimenSource, /sm · Header/);
});
