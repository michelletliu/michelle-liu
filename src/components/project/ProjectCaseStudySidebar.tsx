import Sidebar, { type SidebarNode } from "../layout/Sidebar";
import type { CaseStudyNavItem } from "./caseStudyNavItems";

type ProjectCaseStudySidebarProps = {
  items: CaseStudyNavItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
};

export default function ProjectCaseStudySidebar({
  items,
  activeId,
  onSelect,
  className,
}: ProjectCaseStudySidebarProps) {
  if (items.length === 0) return null;

  const nodes: SidebarNode[] = items.map((item) => ({
    kind: "item" as const,
    id: item.id,
    label: item.label,
  }));

  return (
    <Sidebar
      className={className}
      nodes={nodes}
      activeId={activeId}
      onSelect={onSelect}
      aria-label="Case study sections"
    />
  );
}
