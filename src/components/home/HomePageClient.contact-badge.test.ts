import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeSource = readFileSync(new URL("./HomePageClient.tsx", import.meta.url), "utf8");
const badgeSource = readFileSync(
  new URL("../shared/ContactBadge.tsx", import.meta.url),
  "utf8",
);
const cssSource = readFileSync(
  new URL("../../styles/globals.css", import.meta.url),
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
  assert.match(badgeSource, /resolvedSize/);
  assert.match(badgeSource, /"contact-badge"/);
  assert.match(cssSource, /\.contact-badge\.lg \.contact-badge-text/);
  assert.match(cssSource, /\.contact-badge\.lg\.expanded/);
  assert.match(badgeSource, /touch\s+<\/a>!/);
  assert.doesNotMatch(badgeSource, /touch!\s+<\/a>/);
});

test("fades the pulse ring out instead of snapping it off", () => {
  assert.match(badgeSource, /contact-badge-pulse/);
  assert.match(badgeSource, /isExpanded \? "off" : "on"/);
  assert.match(cssSource, /\.contact-badge-pulse\s*\{[^}]*transition:\s*opacity 300ms/s);
  assert.doesNotMatch(badgeSource, /green-pulse-ring-off/);
  assert.doesNotMatch(cssSource, /green-pulse-ring-off/);
});

test("keeps the hover badge open within an 8px cursor buffer", () => {
  assert.match(badgeSource, /hover-mode/);
  assert.match(
    cssSource,
    /\.contact-badge\.hover-mode::before\s*\{[^}]*pointer-events:\s*auto[^}]*inset:\s*-0\.5rem/s,
  );
  assert.doesNotMatch(
    cssSource,
    /\.contact-badge\.hover-mode::before\s*\{[^}]*pointer-events:\s*none/s,
  );
});

test("keeps the contact link clickable above the hover buffer", () => {
  assert.match(badgeSource, /contact-badge-text/);
  assert.match(badgeSource, /contact-badge-link/);
  assert.match(cssSource, /\.contact-badge-text\s*\{[^}]*z-index:\s*10/s);
});

test("shows the header badge at its large size in the design system", () => {
  assert.match(specimenSource, /<ContactBadge size="lg" \/>/);
  assert.match(specimenSource, /lg · Header/);
  assert.doesNotMatch(specimenSource, /sm · Header/);
});
