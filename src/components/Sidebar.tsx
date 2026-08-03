import clsx from "clsx";

/**
 * Shared left-nav sidebar used across About, Art, and the /system page.
 * About is the gold standard — this extracts its exact styling and behavior
 * into a single data-driven component so every page stays in sync.
 *
 * Structure is fully declarative: pass `nodes` (flat items and/or collapsible
 * groups), the currently active leaf id, and an `onSelect` handler. Groups
 * expand/collapse with the same animation and colour their header zinc when
 * their section is active; active leaves render blue.
 */

export type SidebarLeaf = {
  id: string;
  label: string;
  /** Optional trailing count, e.g. "Books 12". Hidden when undefined or 0. */
  count?: number;
};

export type SidebarNode =
  | ({ kind: "item" } & SidebarLeaf)
  | {
      kind: "group";
      id: string;
      label: string;
      /** Header turns zinc-500 when this group's section is active. */
      active: boolean;
      /** Whether the children are expanded into view. */
      expanded: boolean;
      children: SidebarLeaf[];
    };

export type SidebarProps = {
  nodes: SidebarNode[];
  /** id of the active leaf (top-level item or group child) — rendered blue. */
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
  "aria-label"?: string;
};

const LEAF_TEXT =
  "text-base font-medium tracking-wide leading-normal text-left transition-colors";

function Leaf({
  leaf,
  active,
  indented,
  onSelect,
}: {
  leaf: SidebarLeaf;
  active: boolean;
  indented?: boolean;
  onSelect: (id: string) => void;
}) {
  const showCount = leaf.count !== undefined && leaf.count > 0;
  return (
    <button
      onClick={() => onSelect(leaf.id)}
      className={clsx(
        "flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors",
        indented && "pl-3"
      )}
    >
      <span
        className={clsx(
          LEAF_TEXT,
          active ? "text-blue-500" : "text-zinc-400 hover:text-zinc-500"
        )}
      >
        {leaf.label}
        {showCount && <span className="text-zinc-300 ml-1">{leaf.count}</span>}
      </span>
    </button>
  );
}

export default function Sidebar({
  nodes,
  activeId,
  onSelect,
  className,
  "aria-label": ariaLabel = "Sections",
}: SidebarProps) {
  return (
    <nav aria-label={ariaLabel} className={clsx("flex flex-col gap-2 items-start", className)}>
      {nodes.map((node) => {
        if (node.kind === "item") {
          return (
            <Leaf
              key={node.id}
              leaf={node}
              active={activeId === node.id}
              onSelect={onSelect}
            />
          );
        }

        return (
          <div key={node.id} className="flex flex-col items-start">
            {/* Group header — clickable, darker when its section is active. */}
            <button
              onClick={() => onSelect(node.id)}
              className="flex items-center px-0.5 py-0 cursor-pointer"
            >
              <span
                className={clsx(
                  "text-base font-medium tracking-wide leading-normal transition-colors",
                  node.active ? "text-zinc-500" : "text-zinc-400 hover:text-zinc-500"
                )}
              >
                {node.label}
              </span>
            </button>

            {/*
              Expand via grid-rows 0fr→1fr (not max-height). Spacing lives inside
              the clipped row so collapsed groups don't leave a residual gap.
            */}
            <div
              className={clsx(
                "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out",
                node.expanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "pointer-events-none grid-rows-[0fr] opacity-0"
              )}
              aria-hidden={!node.expanded}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="flex flex-col items-start gap-2 pt-2">
                  {node.children.map((child) => (
                    <Leaf
                      key={child.id}
                      leaf={child}
                      active={activeId === child.id}
                      indented
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
