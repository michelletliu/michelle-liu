import type { ContentSection, TableOfContentsSection, SectionTitleSection } from "../../sanity/types";

export const INTRODUCTION_NAV_ID = "introduction";

export type CaseStudyNavItem = {
  id: string;
  label: string;
  /** Sidebar group heading (e.g. Introduction) vs chapter leaf. */
  kind?: "heading" | "item";
};

function trimLabel(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function navFromToc(section: TableOfContentsSection): CaseStudyNavItem[] {
  const items = section.items ?? [];
  return items.flatMap((item) => {
    const label = trimLabel(item.sidebarLabel) || trimLabel(item.title);
    if (!label) return [];
    const id = trimLabel(item.targetSectionId) || item._key;
    return [{ id, label, kind: "item" as const }];
  });
}

function navFromSectionTitles(sections: ContentSection[]): CaseStudyNavItem[] {
  return sections.flatMap((section) => {
    if (section._type !== "sectionTitleSection") return [];
    const titleSection = section as SectionTitleSection;
    if (titleSection.hideFromSidebar) return [];
    const title = trimLabel(titleSection.title);
    if (!title) return [];
    const number = trimLabel(titleSection.number);
    if (number === "00" && /table of contents/i.test(title)) return [];
    const label = trimLabel(titleSection.sidebarLabel) || title;
    const id = number || titleSection._key;
    return [{ id, label, kind: "item" as const }];
  });
}

function withIntroduction(chapters: CaseStudyNavItem[]): CaseStudyNavItem[] {
  if (chapters.length === 0) return [];
  return [
    { id: INTRODUCTION_NAV_ID, label: "Introduction", kind: "heading" },
    ...chapters,
  ];
}

export function getCaseStudyNavItems(sections: ContentSection[]): CaseStudyNavItem[] {
  for (const section of sections) {
    if (section._type !== "tableOfContentsSection") continue;
    const items = navFromToc(section as TableOfContentsSection);
    if (items.length > 0) return withIntroduction(items);
  }
  return withIntroduction(navFromSectionTitles(sections));
}
