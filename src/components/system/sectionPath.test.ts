import assert from "node:assert/strict";
import test from "node:test";
import {
  DESIGN_SYSTEM_BASE_PATH,
  pathForSectionId,
  sectionIdFromPathSlug,
  sectionPathSlug,
  tocSections,
} from "./tokens.ts";

test("Overview has no path slug and maps to the bare base path", () => {
  assert.equal(sectionPathSlug("intro"), null);
  assert.equal(pathForSectionId("intro"), DESIGN_SYSTEM_BASE_PATH);
  assert.equal(sectionIdFromPathSlug("overview"), null);
});

test("Iconography slugifies the label, not the DOM id", () => {
  assert.equal(sectionPathSlug("icons"), "iconography");
  assert.equal(sectionIdFromPathSlug("iconography"), "icons");
  assert.equal(pathForSectionId("icons"), "/design-system/iconography");
});

test("every toc section round-trips label slug ↔ id (Overview excluded from slug)", () => {
  for (const { id, label } of tocSections) {
    if (id === "intro") {
      assert.equal(sectionPathSlug(id), null);
      continue;
    }
    const slug = sectionPathSlug(id);
    assert.ok(slug);
    assert.equal(slug, label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    assert.equal(sectionIdFromPathSlug(slug!), id);
    assert.equal(pathForSectionId(id), `${DESIGN_SYSTEM_BASE_PATH}/${slug}`);
  }
});

test("unknown slug and unknown id are safe", () => {
  assert.equal(sectionIdFromPathSlug("not-a-section"), null);
  assert.equal(sectionPathSlug("not-a-section"), null);
  assert.equal(pathForSectionId("not-a-section"), DESIGN_SYSTEM_BASE_PATH);
});
