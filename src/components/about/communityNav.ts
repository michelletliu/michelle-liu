import type { SidebarLeaf } from "../layout/Sidebar";

/** Reserved sidebar id — not a Sanity document id. */
export const COMMUNITY_ARCHIVE_ID = "__community-archive";

export type CommunityNavItem = {
  id: string;
  sidebarName?: string;
  isArchived?: boolean;
};

export function splitCommunityNav<T extends CommunityNavItem>(items: T[]) {
  const named = items.filter((item): item is T & { sidebarName: string } =>
    Boolean(item.sidebarName),
  );
  return {
    active: named.filter((item) => !item.isArchived),
    archived: named.filter((item) => Boolean(item.isArchived)),
  };
}

/** Active communities keep their Sanity order; archived ones follow after. */
export function orderCommunitiesForDisplay<T extends CommunityNavItem>(
  items: T[],
): T[] {
  return [
    ...items.filter((item) => !item.isArchived),
    ...items.filter((item) => Boolean(item.isArchived)),
  ];
}

export function communitySidebarLeaves({
  active,
  archived,
  archiveOpen,
}: {
  active: CommunityNavItem[];
  archived: CommunityNavItem[];
  archiveOpen: boolean;
}): SidebarLeaf[] {
  const leaves: SidebarLeaf[] = active.map((community) => ({
    id: community.id,
    label: community.sidebarName ?? "",
  }));

  if (archived.length > 0) {
    leaves.push({
      id: COMMUNITY_ARCHIVE_ID,
      label: "Archive",
      nested: {
        expanded: archiveOpen,
        children: archived.map((community) => ({
          id: community.id,
          label: community.sidebarName ?? "",
        })),
      },
    });
  }

  return leaves;
}
