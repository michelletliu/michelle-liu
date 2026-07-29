import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("./sections/SpacingSection.tsx", import.meta.url),
  "utf8",
);

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
  assert.match(section, /PhoneFrame heightClass="h-\[62px\]"/);
  assert.match(section, /PhoneFrame heightClass="h-\[74px\]"/);
  assert.match(
    section,
    /BrowserFrame className="[^"]*max-w-\[112px\]/,
  );
  assert.match(
    section,
    /case "px-\[175px\] \/ md:px-\[8%\]":[\s\S]*?max-w-\[96px\][\s\S]*?max-w-\[96px\]/,
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
