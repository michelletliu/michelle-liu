import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const sectionsUrl = new URL("./sections/", import.meta.url);
const componentSectionUrl = new URL("ComponentSection.tsx", sectionsUrl);
const moduleNames = [
  "ComponentSpecimen.tsx",
  "ButtonSpecimens.tsx",
  "InputSpecimens.tsx",
  "NavigationSpecimens.tsx",
  "MiscSpecimens.tsx",
] as const;

test("the component catalog is split into focused specimen modules", () => {
  for (const moduleName of moduleNames) {
    assert.ok(
      existsSync(new URL(`component-section/${moduleName}`, sectionsUrl)),
      `${moduleName} should exist`,
    );
  }

  const section = readFileSync(componentSectionUrl, "utf8");
  assert.ok(
    section.split("\n").length <= 50,
    "ComponentSection should only compose focused specimen modules",
  );
  assert.doesNotMatch(section, /useState|useLayoutEffect|useRef/);
});

test("specimen DOM exposes stable semantic class names for inspection", () => {
  const specimen = readFileSync(
    new URL("component-section/ComponentSpecimen.tsx", sectionsUrl),
    "utf8",
  );
  const buttons = readFileSync(
    new URL("component-section/ButtonSpecimens.tsx", sectionsUrl),
    "utf8",
  );
  const inputs = readFileSync(
    new URL("component-section/InputSpecimens.tsx", sectionsUrl),
    "utf8",
  );

  assert.match(specimen, /component-specimen-grid/);
  assert.match(specimen, /component-specimen-stage/);
  assert.match(buttons, /button-matrix-size/);
  assert.match(buttons, /button-sample/);
  assert.match(inputs, /input-matrix-composition/);
  assert.match(inputs, /input-sample/);
});
