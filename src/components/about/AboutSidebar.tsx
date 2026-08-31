import Sidebar, { type SidebarNode } from "../layout/Sidebar";
import {
  COMMUNITY_ARCHIVE_ID,
  communitySidebarLeaves,
  splitCommunityNav,
} from "./communityNav";

// Sidebar navigation categories
export type AboutCategory = "hi" | "experience" | "community" | "philosophy" | "shelf" | "lore";

// Shelf subcategories
export type ShelfSubcategory = "books" | "music" | "movies";

// Shelf subcategories (indented under SHELF)
const SHELF_SUBCATEGORIES: { id: ShelfSubcategory; label: string }[] = [
  { id: "books", label: "Books" },
  { id: "music", label: "Music" },
  { id: "movies", label: "Movies" },
];

// Community item from Sanity (for sidebar display)
export type CommunitySidebarItem = {
  id: string;
  sidebarName: string;
  isArchived?: boolean;
};

export type AboutSidebarProps = {
  activeCategory: AboutCategory;
  onCategoryClick: (category: AboutCategory) => void;
  /** Community items with their sidebar names */
  communityItems?: CommunitySidebarItem[];
  /** Active community ID (when community category is active) */
  activeCommunityId?: string;
  /** Callback when a specific community is clicked */
  onCommunityClick?: (communityId: string) => void;
  /** Whether the Archive disclosure is expanded */
  archiveOpen?: boolean;
  /** Toggle the Archive disclosure */
  onArchiveToggle?: () => void;
  /** Active shelf subcategory (when shelf category is active) */
  activeShelfSubcategory?: ShelfSubcategory;
  /** Callback when a specific shelf subcategory is clicked */
  onShelfSubcategoryClick?: (subcategory: ShelfSubcategory) => void;
  /** Counts for each shelf subcategory */
  shelfCounts?: Partial<Record<ShelfSubcategory, number>>;
  /**
   * `full` — About sections (desktop rail).
   * `communities` — community names + Archive only (mobile jump list).
   */
  variant?: "full" | "communities";
  className?: string;
};

export default function AboutSidebar({
  activeCategory,
  onCategoryClick,
  communityItems = [],
  activeCommunityId,
  onCommunityClick,
  archiveOpen = false,
  onArchiveToggle,
  activeShelfSubcategory,
  onShelfSubcategoryClick,
  shelfCounts,
  variant = "full",
  className,
}: AboutSidebarProps) {
  const isCommunityActive = activeCategory === "community";
  const isShelfActive = activeCategory === "shelf";

  const { active: activeCommunities, archived: archivedCommunities } =
    splitCommunityNav(communityItems);
  const communityLeaves = communitySidebarLeaves({
    active: activeCommunities,
    archived: archivedCommunities,
    archiveOpen,
  });
  const firstCommunityId =
    activeCommunities[0]?.id ?? archivedCommunities[0]?.id;

  const handleSelect = (id: string) => {
    if (id === COMMUNITY_ARCHIVE_ID) {
      onArchiveToggle?.();
      return;
    }

    switch (id) {
      case "hi":
      case "experience":
      case "philosophy":
      case "lore":
        onCategoryClick(id as AboutCategory);
        break;
      case "community":
        onCategoryClick("community");
        if (firstCommunityId) onCommunityClick?.(firstCommunityId);
        break;
      case "shelf":
        onCategoryClick("shelf");
        onShelfSubcategoryClick?.("books");
        break;
      case "books":
      case "music":
      case "movies":
        onCategoryClick("shelf");
        onShelfSubcategoryClick?.(id as ShelfSubcategory);
        break;
      default:
        onCategoryClick("community");
        onCommunityClick?.(id);
    }
  };

  if (variant === "communities") {
    if (communityLeaves.length === 0) return null;
    return (
      <Sidebar
        className={className}
        nodes={communityLeaves.map((leaf) => ({ kind: "item" as const, ...leaf }))}
        activeId={activeCommunityId}
        onSelect={handleSelect}
        aria-label="Communities"
      />
    );
  }

  const nodes: SidebarNode[] = [
    { kind: "item", id: "hi", label: "Hi!" },
    { kind: "item", id: "experience", label: "Experience" },
    {
      kind: "group",
      id: "community",
      label: "Community",
      active: isCommunityActive,
      expanded: (isCommunityActive || archiveOpen) && communityLeaves.length > 0,
      children: communityLeaves,
    },
    { kind: "item", id: "philosophy", label: "Philosophy" },
    {
      kind: "group",
      id: "shelf",
      label: "Shelf",
      active: isShelfActive,
      expanded: isShelfActive,
      children: SHELF_SUBCATEGORIES.map((s) => ({
        id: s.id,
        label: s.label,
        count: shelfCounts?.[s.id],
      })),
    },
    { kind: "item", id: "lore", label: "Lore" },
  ];

  // Which leaf reads as active depends on the current section.
  let activeId: string = activeCategory;
  if (isCommunityActive && activeCommunityId) activeId = activeCommunityId;
  if (isShelfActive && activeShelfSubcategory) activeId = activeShelfSubcategory;

  return (
    <Sidebar
      className={className}
      nodes={nodes}
      activeId={activeId}
      onSelect={handleSelect}
    />
  );
}
