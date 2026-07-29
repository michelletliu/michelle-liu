import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/SpacingSection.tsx", import.meta.url),
  "utf8",
);
const tokens = readFileSync(new URL("./tokens.ts", import.meta.url), "utf8");

test("primary page gutter uses a slash between desktop and mobile values", () => {
  assert.match(tokens, /value: "64px \/ 24px", usage: "★ Primary page gutter"/);
  assert.doesNotMatch(tokens, /value: "64px → 24px"/);
});

test("layout widths omit the misleading Screentime phone frame token", () => {
  assert.doesNotMatch(tokens, /Screentime phone widths/);
  assert.doesNotMatch(section, /case "w-\[337px\] \/ \[402px\]"/);
});

test("PhoneFrame keeps iPhone 16 Pro ratio with rounder corners and shorter default height", () => {
  assert.match(section, /aspect-\[402\/874\]/);
  assert.match(section, /rounded-\[30%\/15%\]/);
  assert.match(section, /rounded-\[28%\/14%\]/);
  assert.match(
    section,
    /function PhoneFrame\([\s\S]*?heightClass = "h-\[64px\]"/,
  );
  assert.doesNotMatch(section, /rounded-\[22%\/11%\]/);
  assert.doesNotMatch(section, /rounded-\[20%\/10%\]/);
  assert.doesNotMatch(section, /rounded-\[18%\/9%\]/);
  assert.doesNotMatch(section, /rounded-\[16%\/8%\]/);
  assert.doesNotMatch(section, /rounded-\[15%\/7\.5%\]/);
  assert.doesNotMatch(section, /rounded-\[13%\/6\.5%\]/);
});

test("BrowserFrame uses 16:10 laptop aspect instead of a fixed height", () => {
  assert.match(
    section,
    /function BrowserFrame\([\s\S]*?aspect-\[16\/10\]/,
  );
  assert.doesNotMatch(
    section,
    /function BrowserFrame\([\s\S]*?heightClass = "h-\[72px\]"/,
  );
});

test("Layout width samples use shorter phones and constrained 16:10 browsers", () => {
  assert.match(section, /PhoneFrame heightClass="h-\[76px\]"/);
  assert.match(
    section,
    /BrowserFrame className="[^"]*max-w-\[112px\]/,
  );
  assert.match(
    section,
    /case "px-\[175px\] \/ md:px-\[8%\]":[\s\S]*?w-\[96px\][\s\S]*?w-\[72px\]/,
  );
  assert.match(
    section,
    /case "px-\[175px\] \/ md:px-\[8%\]":[\s\S]*?items-center justify-center/,
  );
  assert.doesNotMatch(
    section,
    /case "px-\[175px\] \/ md:px-\[8%\]":[\s\S]*?items-start justify-center/,
  );
  assert.match(
    section,
    /case "px-\[175px\] \/ md:px-\[8%\]":[\s\S]*?>xl · 175px<[\s\S]*?>md · 8%</,
  );
  assert.match(
    section,
    /case "w-\[calc\(100%\*10\/12\)\]":[\s\S]*?max-w-\[200px\][\s\S]*?<BrowserFrame/,
  );
  assert.doesNotMatch(section, /heightClass="h-\[88px\]"/);
  assert.doesNotMatch(section, /heightClass="h-\[70px\]"/);
  assert.doesNotMatch(section, /heightClass="h-\[84px\]"/);
});

test("modal width cards fill a separate two-column row", () => {
  assert.match(
    section,
    /gutters\.slice\(0, 3\)\.map[\s\S]*?mt-9 grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-2[\s\S]*?gutters\.slice\(3\)\.map/,
  );
});
