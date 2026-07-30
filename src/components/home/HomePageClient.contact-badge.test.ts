import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeSource = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");
const badgeSource = readFileSync(
  new URL("../shared/ContactBadge.tsx", import.meta.url),
  "utf8",
);
const specimenSource = readFileSync(
  new URL(
    "../system/sections/component-section/NavigationSpecimens.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("uses large contact text and deeper intro fade on Work", () => {
  assert.match(homeSource, /isContactBadgeExpanded \? "opacity-20" : "opacity-100"/);
  assert.match(homeSource, /isContactBadgeExpanded \? "opacity-10" : "opacity-100"/);
  assert.match(
    homeSource,
    /maskImage: "linear-gradient\(to right, #000, rgba\(0, 0, 0, 0\.5\)\)"/,
  );
  assert.match(
    homeSource,
    /WebkitMaskImage: "linear-gradient\(to right, #000, rgba\(0, 0, 0, 0\.5\)\)"/,
  );
  assert.match(
    homeSource,
    /moments[\s\S]*?\{" "\}of delight & human connection\./,
  );
  assert.match(
    homeSource,
    /<ContactBadge[\s\S]*?size="lg"[\s\S]*?onExpandedChange=\{setIsContactBadgeExpanded\}/,
  );
  assert.match(badgeSource, /resolvedSize === "lg" \? "text-lg"/);
  assert.match(
    badgeSource,
    /resolvedSize === "lg" &&\s+"gap-1 py-0 pl-1 pr-3 md:ml-0\.5"/,
  );
  assert.match(badgeSource, /touch\s+<\/a>!/);
  assert.doesNotMatch(badgeSource, /touch!\s+<\/a>/);
});

test("fades the pulse ring out instead of snapping it off", () => {
  const cssSource = readFileSync(new URL("../../styles/globals.css", import.meta.url), "utf8");
  assert.match(
    badgeSource,
    /transition-opacity duration-300 ease-out",\s+isExpanded \? "opacity-0" : "opacity-100"/,
  );
  assert.doesNotMatch(badgeSource, /green-pulse-ring-off/);
  assert.doesNotMatch(cssSource, /green-pulse-ring-off/);
});

test("keeps the hover badge open within an 8px cursor buffer", () => {
  assert.match(
    badgeSource,
    /hoverMode &&\s+"[^"]*before:pointer-events-auto[^"]*before:-inset-2[^"]*"/,
  );
  assert.doesNotMatch(badgeSource, /before:pointer-events-none/);
});

test("keeps the contact link clickable above the hover buffer", () => {
  assert.match(
    badgeSource,
    /"relative z-10 overflow-hidden text-nowrap font-\['Michelle:Medium',sans-serif\]/,
  );
});

test("shows the header badge at its large size in the design system", () => {
  assert.match(specimenSource, /<ContactBadge size="lg" \/>/);
  assert.match(specimenSource, /lg · Header/);
  assert.doesNotMatch(specimenSource, /sm · Header/);
});
