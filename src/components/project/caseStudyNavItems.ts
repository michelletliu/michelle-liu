import type { ContentSection, TableOfContentsSection, SectionTitleSection } from "../../sanity/types";

export type CaseStudyNavItem = {
  id: string;
  label: string;
};

function trimLabel(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function navFromToc(section: TableOfContentsSection): CaseStudyNavItem[] {
  const items = section.items ?? [];
  return items.flatMap((item) => {
    const label = trimLabel(item.title);
    if (!label) return [];
    const id = trimLabel(item.targetSectionId) || item._key;
    return [{ id, label }];
  });
}

function navFromSectionTitles(sections: ContentSection[]): CaseStudyNavItem[] {
  return sections.flatMap((section) => {
    if (section._type !== "sectionTitleSection") return [];
    const titleSection = section as SectionTitleSection;
    const label = trimLabel(titleSection.title);
    if (!label) return [];
    const number = trimLabel(titleSection.number);
    if (number === "00" && /table of contents/i.test(label)) return [];
    const id = number || titleSection._key;
    return [{ id, label }];
  });
}

export function getCaseStudyNavItems(sections: ContentSection[]): CaseStudyNavItem[] {
  for (const section of sections) {
    if (section._type !== "tableOfContentsSection") continue;
    const items = navFromToc(section as TableOfContentsSection);
    if (items.length > 0) return items;
  }
  return navFromSectionTitles(sections);
}
