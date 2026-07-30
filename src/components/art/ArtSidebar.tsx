import Sidebar, { type SidebarNode } from "../layout/Sidebar";

export type ArtCategory = "painting" | "conceptual" | "graphite" | "sketchbook" | "murals";

type ArtSidebarProps = {
  className?: string;
  activeCategory: ArtCategory;
  onCategoryClick: (category: ArtCategory) => void;
  /** Counts for each category (optional) */
  counts?: Partial<Record<ArtCategory, number>>;
  /** Sketchbook labels for subcategories (from sidebarLabel field or first word of title) */
  sketchbookLabels?: string[];
  /** Image counts for each sketchbook */
  sketchbookImageCounts?: number[];
  /** Active sketchbook index (when sketchbook category is active) */
  activeSketchbookIndex?: number;
  /** Callback when a specific sketchbook is clicked */
  onSketchbookClick?: (index: number) => void;
  /** Mural labels for subcategories (from sidebarLabel field or first word of title) */
  muralLabels?: string[];
  /** Active mural index (when murals category is active) */
  activeMuralIndex?: number;
  /** Callback when a specific mural is clicked */
  onMuralClick?: (index: number) => void;
};

// Fine Art subcategories (indented)
const FINE_ART_CATEGORIES: { id: ArtCategory; label: string }[] = [
  { id: "painting", label: "Painting" },
  { id: "conceptual", label: "Conceptual" },
  { id: "graphite", label: "Graphite" },
];

export default function ArtSidebar({
  className,
  activeCategory,
  onCategoryClick,
  counts,
  sketchbookLabels = [],
  sketchbookImageCounts = [],
  activeSketchbookIndex,
  onSketchbookClick,
  muralLabels = [],
  activeMuralIndex,
  onMuralClick,
}: ArtSidebarProps) {
  const isFineArtActive = FINE_ART_CATEGORIES.some((cat) => cat.id === activeCategory);
  const isSketchbookActive = activeCategory === "sketchbook";
  const isMuralsActive = activeCategory === "murals";

  const nodes: SidebarNode[] = [
    {
      kind: "group",
      id: "fine-art",
      label: "Fine Art",
      active: isFineArtActive,
      expanded: isFineArtActive,
      children: FINE_ART_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: counts?.[cat.id],
      })),
    },
    {
      kind: "group",
      id: "sketchbook",
      label: "Sketchbook",
      active: isSketchbookActive,
      expanded: isSketchbookActive,
      children: sketchbookLabels.map((label, index) => ({
        id: `sketchbook-${index}`,
        label,
        count: sketchbookImageCounts[index],
      })),
    },
    {
      kind: "group",
      id: "murals",
      label: "Murals",
      active: isMuralsActive,
      expanded: isMuralsActive,
      children: muralLabels.map((label, index) => ({
        id: `mural-${index}`,
        label,
      })),
    },
  ];

  // Which leaf reads as active depends on the current section.
  let activeId: string = activeCategory;
  if (isSketchbookActive && activeSketchbookIndex !== undefined) {
    activeId = `sketchbook-${activeSketchbookIndex}`;
  }
  if (isMuralsActive && activeMuralIndex !== undefined) {
    activeId = `mural-${activeMuralIndex}`;
  }

  const handleSelect = (id: string) => {
    if (id === "fine-art") {
      onCategoryClick("painting");
    } else if (id === "sketchbook") {
      onCategoryClick("sketchbook");
    } else if (id === "murals") {
      onCategoryClick("murals");
    } else if (id.startsWith("sketchbook-")) {
      onSketchbookClick?.(Number(id.slice("sketchbook-".length)));
    } else if (id.startsWith("mural-")) {
      onMuralClick?.(Number(id.slice("mural-".length)));
    } else {
      // Fine Art subcategory (painting / conceptual / graphite)
      onCategoryClick(id as ArtCategory);
    }
  };

  return <Sidebar className={className} nodes={nodes} activeId={activeId} onSelect={handleSelect} />;
}
