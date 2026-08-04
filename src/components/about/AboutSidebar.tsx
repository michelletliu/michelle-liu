import Sidebar, { type SidebarNode } from "../layout/Sidebar";

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
  /** Active shelf subcategory (when shelf category is active) */
  activeShelfSubcategory?: ShelfSubcategory;
  /** Callback when a specific shelf subcategory is clicked */
  onShelfSubcategoryClick?: (subcategory: ShelfSubcategory) => void;
  /** Counts for each shelf subcategory */
  shelfCounts?: Partial<Record<ShelfSubcategory, number>>;
};

export default function AboutSidebar({
  activeCategory,
  onCategoryClick,
  communityItems = [],
  activeCommunityId,
  onCommunityClick,
  activeShelfSubcategory,
  onShelfSubcategoryClick,
  shelfCounts,
}: AboutSidebarProps) {
  const isCommunityActive = activeCategory === "community";
  const isShelfActive = activeCategory === "shelf";

  // Only communities with a sidebar name are shown.
  const visibleCommunities = communityItems.filter((c) => c.sidebarName);

  const nodes: SidebarNode[] = [
    { kind: "item", id: "hi", label: "Hi!" },
    { kind: "item", id: "experience", label: "Experience" },
    {
      kind: "group",
      id: "community",
      label: "Community",
      active: isCommunityActive,
      expanded: isCommunityActive && visibleCommunities.length > 0,
      children: visibleCommunities.map((c) => ({ id: c.id, label: c.sidebarName })),
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

  const handleSelect = (id: string) => {
    switch (id) {
      case "hi":
      case "experience":
      case "philosophy":
      case "lore":
        onCategoryClick(id as AboutCategory);
        break;
      case "community":
        onCategoryClick("community");
        if (visibleCommunities.length > 0) onCommunityClick?.(visibleCommunities[0].id);
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
        // Community child (Sanity id)
        onCategoryClick("community");
        onCommunityClick?.(id);
    }
  };

  return <Sidebar nodes={nodes} activeId={activeId} onSelect={handleSelect} />;
}
