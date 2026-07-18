import assert from "node:assert/strict";
import test from "node:test";
import { getCaseStudyNavItems } from "./caseStudyNavItems.ts";
import type { ContentSection } from "../../sanity/types.ts";

test("prefers TOC items over section titles", () => {
  const sections = [
    {
      _key: "toc",
      _type: "tableOfContentsSection",
      items: [
        { _key: "a", title: "JPL Banner Designs", targetSectionId: "01", number: "01" },
        { _key: "b", title: "Labwide Pop-Up", targetSectionId: "02", number: "02" },
      ],
    },
    { _key: "s1", _type: "sectionTitleSection", number: "01", title: "HR Communications Banners" },
    { _key: "s2", _type: "sectionTitleSection", number: "02", title: "Something Else" },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "01", label: "JPL Banner Designs" },
    { id: "02", label: "Labwide Pop-Up" },
  ]);
});

test("falls back to sectionTitleSection when no TOC items", () => {
  const sections = [
    { _key: "s0", _type: "sectionTitleSection", number: "00", title: "Table of Contents" },
    { _key: "s1", _type: "sectionTitleSection", number: "01", title: "Chapter One" },
    { _key: "s2", _type: "sectionTitleSection", number: "02", title: "Chapter Two" },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "01", label: "Chapter One" },
    { id: "02", label: "Chapter Two" },
  ]);
});

test("uses _key when targetSectionId / number missing", () => {
  const sections = [
    {
      _key: "toc",
      _type: "tableOfContentsSection",
      items: [{ _key: "item-key", title: "Solo Chapter" }],
    },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "item-key", label: "Solo Chapter" },
  ]);
});

test("returns empty array when neither source has titles", () => {
  const sections = [
    { _key: "img", _type: "imageSection", image: undefined },
  ] as unknown as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), []);
});

test("skips TOC items with empty titles", () => {
  const sections = [
    {
      _key: "toc",
      _type: "tableOfContentsSection",
      items: [
        { _key: "a", title: "  ", targetSectionId: "01" },
        { _key: "b", title: "Real", targetSectionId: "02" },
      ],
    },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "02", label: "Real" },
  ]);
});
