import assert from "node:assert/strict";
import test from "node:test";
import { getCaseStudyNavItems } from "./caseStudyNavItems.ts";
import type { ContentSection } from "../../sanity/types.ts";

test("prefers TOC items over section titles and prepends Introduction", () => {
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
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "01", label: "JPL Banner Designs", kind: "item" },
    { id: "02", label: "Labwide Pop-Up", kind: "item" },
  ]);
});

test("falls back to sectionTitleSection when no TOC items", () => {
  const sections = [
    { _key: "s0", _type: "sectionTitleSection", number: "00", title: "Table of Contents" },
    { _key: "s1", _type: "sectionTitleSection", number: "01", title: "Chapter One" },
    { _key: "s2", _type: "sectionTitleSection", number: "02", title: "Chapter Two" },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "01", label: "Chapter One", kind: "item" },
    { id: "02", label: "Chapter Two", kind: "item" },
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
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "item-key", label: "Solo Chapter", kind: "item" },
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
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "02", label: "Real", kind: "item" },
  ]);
});

test("prefers sidebarLabel over title for TOC and section titles", () => {
  const tocSections = [
    {
      _key: "toc",
      _type: "tableOfContentsSection",
      items: [
        {
          _key: "a",
          title: "JPL Banner Designs",
          sidebarLabel: "Banners",
          targetSectionId: "01",
        },
      ],
    },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(tocSections), [
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "01", label: "Banners", kind: "item" },
  ]);

  const titleSections = [
    {
      _key: "s1",
      _type: "sectionTitleSection",
      number: "01",
      title: "Very Long Chapter Title",
      sidebarLabel: "Chapter",
    },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(titleSections), [
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "01", label: "Chapter", kind: "item" },
  ]);
});

test("skips section titles marked hideFromSidebar", () => {
  const sections = [
    {
      _key: "s1",
      _type: "sectionTitleSection",
      number: "01",
      title: "Visible Chapter",
    },
    {
      _key: "s2",
      _type: "sectionTitleSection",
      number: "02",
      title: "Hidden Chapter",
      hideFromSidebar: true,
      sidebarLabel: "Should Not Appear",
    },
    {
      _key: "s3",
      _type: "sectionTitleSection",
      number: "03",
      title: "Also Visible",
    },
  ] as ContentSection[];

  assert.deepEqual(getCaseStudyNavItems(sections), [
    { id: "introduction", label: "Introduction", kind: "heading" },
    { id: "01", label: "Visible Chapter", kind: "item" },
    { id: "03", label: "Also Visible", kind: "item" },
  ]);
});
