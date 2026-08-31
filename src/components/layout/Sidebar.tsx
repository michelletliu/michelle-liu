import type { ReactNode } from "react";
import clsx from "clsx";
import { Chevron } from "../icons/Chevron";
import { iconSize } from "../shared/iconSizes";

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

const INDENT = ["", "pl-3", "pl-6"] as const;

export type SidebarLeaf = {
  id: string;
  label: string;
  /** Optional trailing count, e.g. "Books 12". Hidden when undefined or 0. */
  count?: number;
  /**
   * Nested disclosure (e.g. Archive under Community). Clicking the row calls
   * `onSelect(id)` so the parent can toggle `expanded`; nested children are
   * not themselves nested.
   */
  nested?: {
    expanded: boolean;
    children: SidebarLeaf[];
  };
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

function Expandable({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "grid w-full min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out",
        expanded
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!expanded}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Leaf({
  leaf,
  activeId,
  indent = 0,
  onSelect,
}: {
  leaf: SidebarLeaf;
  activeId?: string;
  indent?: 0 | 1 | 2;
  onSelect: (id: string) => void;
}) {
  if (leaf.nested) {
    const panelId = `${leaf.id}-panel`;
    return (
      <div className="flex w-full min-w-0 flex-col items-start">
        <button
          type="button"
          aria-expanded={leaf.nested.expanded}
          aria-controls={panelId}
          onClick={() => onSelect(leaf.id)}
          className={clsx(
            "group flex min-h-8 items-center gap-1 px-0.5 py-0 rounded-full cursor-pointer lg:min-h-0",
            INDENT[indent],
          )}
        >
          <span
            className={clsx(
              LEAF_TEXT,
              "group-hover:text-zinc-400",
              leaf.nested.expanded ? "text-zinc-350" : "text-zinc-300",
            )}
          >
            {leaf.label}
          </span>
          <Chevron
            size={iconSize("xs")}
            className={clsx(
              "translate-y-px text-zinc-300 transition-[color,transform] duration-200 ease-out group-hover:text-zinc-400",
              leaf.nested.expanded && "rotate-90",
            )}
          />
        </button>
        <div id={panelId} className="w-full min-w-0">
          <Expandable expanded={leaf.nested.expanded}>
            <div className="flex flex-col items-start gap-2 pt-2">
              {leaf.nested.children.map((child) => (
                <Leaf
                  key={child.id}
                  leaf={child}
                  activeId={activeId}
                  indent={Math.min(indent + 1, 2) as 0 | 1 | 2}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </Expandable>
        </div>
      </div>
    );
  }

  const showCount = leaf.count !== undefined && leaf.count > 0;
  const active = activeId === leaf.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(leaf.id)}
      className={clsx(
        "flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors",
        INDENT[indent],
      )}
    >
      <span
        className={clsx(
          LEAF_TEXT,
          active ? "text-blue-500" : "text-zinc-400 hover:text-zinc-500",
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
              activeId={activeId}
              onSelect={onSelect}
            />
          );
        }

        return (
          <div key={node.id} className="flex w-full min-w-0 flex-col items-start">
            {/* Group header — clickable, darker when its section is active. */}
            <button
              type="button"
              onClick={() => onSelect(node.id)}
              className="flex items-center px-0.5 py-0 cursor-pointer"
            >
              <span
                className={clsx(
                  "text-base font-medium tracking-wide leading-normal transition-colors",
                  node.active ? "text-zinc-500" : "text-zinc-400 hover:text-zinc-500",
                )}
              >
                {node.label}
              </span>
            </button>

            {/*
              Expand via grid-rows 0fr→1fr (not max-height). Spacing lives inside
              the clipped row so collapsed groups don't leave a residual gap.
            */}
            <Expandable expanded={node.expanded}>
              <div className="flex flex-col items-start gap-2 pt-2">
                {node.children.map((child) => (
                  <Leaf
                    key={child.id}
                    leaf={child}
                    activeId={activeId}
                    indent={1}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </Expandable>
          </div>
        );
      })}
    </nav>
  );
}
