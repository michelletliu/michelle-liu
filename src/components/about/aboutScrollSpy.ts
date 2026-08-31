/** Line from the viewport top used to pick the About section in view. */
export const ABOUT_SCROLL_THRESHOLD_PX = 250;

/**
 * Archive sits on the Community / Philosophy boundary. A section whose bottom
 * is at 0 is flush with the top of the viewport — keep Community until it has
 * clearly scrolled away.
 */
export const COMMUNITY_STILL_VISIBLE_PX = -48;

export type SectionRect<T extends string> = {
  id: T;
  top: number;
  bottom: number;
};

/**
 * Active section is the one that currently contains the threshold line.
 * Using only `top <= threshold` is wrong at section boundaries: scrolling the
 * Community Archive toggle to the top puts Philosophy under the line while
 * the archive panel is still expanding.
 */
export function sectionAtThreshold<T extends string>(
  sections: SectionRect<T>[],
  threshold: number,
): T | null {
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (section.top <= threshold && section.bottom > threshold) {
      return section.id;
    }
  }
  return null;
}

export function firstIntersectingSection<T extends string>(
  sections: SectionRect<T>[],
  viewportHeight: number,
): T | null {
  for (const section of sections) {
    if (section.top < viewportHeight && section.bottom > 0) {
      return section.id;
    }
  }
  return null;
}

export function communityOwnsNav(
  community: SectionRect<string> | undefined,
  archive: { top: number; bottom: number } | null | undefined,
): boolean {
  const archiveAtBoundary =
    Boolean(archive) &&
    archive!.bottom > COMMUNITY_STILL_VISIBLE_PX &&
    archive!.top < ABOUT_SCROLL_THRESHOLD_PX + 80;
  if (archiveAtBoundary) return true;
  return Boolean(
    community &&
      community.top <= ABOUT_SCROLL_THRESHOLD_PX &&
      community.bottom > COMMUNITY_STILL_VISIBLE_PX,
  );
}

/**
 * Expanding/collapsing Archive shrinks Community to a short strip at the
 * section boundary. Philosophy then contains the spy line even though the
 * Archive control is still on screen. Keep Community until Archive / the
 * community section has fully left the top of the viewport.
 */
export function resolveAboutCategory<T extends string>(
  sections: SectionRect<T>[],
  threshold: number,
  viewportHeight: number,
  archive?: { top: number; bottom: number } | null,
): T | null {
  const picked =
    sectionAtThreshold(sections, threshold) ??
    firstIntersectingSection(sections, viewportHeight);
  const community = sections.find((section) => section.id === "community");
  if (picked === "philosophy" && communityOwnsNav(community, archive)) {
    return "community" as T;
  }
  return picked;
}
