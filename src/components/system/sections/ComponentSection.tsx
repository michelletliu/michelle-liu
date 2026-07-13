"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "../../ArrowUpRight";
import Sidebar, { type SidebarNode } from "../../Sidebar";
import { Section, SubLabel, TagChip } from "../primitives";

function Specimen({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex min-h-[128px] flex-1 items-center justify-center gap-4 rounded-xl bg-gray-50 p-6 ring-1 ring-inset ring-black/5 ${className}`}
      >
        {children}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

const LIBRARY_OPTIONS = [
  { label: "favorites", count: 8 },
  { label: "all", count: 32 },
  { label: "2026", count: 11 },
  { label: "2025", count: 13 },
];

const SHELF_OPTIONS = [
  { label: "★ Books", count: 5 },
  { label: "2026", count: 11 },
  { label: "2025", count: 13 },
  { label: "2024", count: 7 },
];

type FilterOption = { label: string; count: number };
type FilterSize = "sm" | "md";

/**
 * Live replica of the Library / About-shelf filter dropdown, unified into one
 * component with sm + md size variants. Both share the same corner-radius
 * pattern (rounded-full trigger, rounded-xl menu, rounded-[10px] options);
 * only text size and padding change between sizes.
 */
function FilterDropdown({
  size,
  options,
  initialActive,
}: {
  size: FilterSize;
  options: FilterOption[];
  initialActive: string;
}) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(initialActive);
  const activeCount = options.find((o) => o.label === active)?.count;

  const md = size === "md";
  const textCls = md ? "text-base tracking-[0.01em]" : "text-sm tracking-wide";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 transition-colors cursor-pointer ${
          md ? "py-1.5" : "py-1"
        }`}
      >
        <span className={`font-['Michelle',sans-serif] font-medium text-gray-500 ${textCls}`}>
          {active}
          <span className="text-gray-400"> {activeCount}</span>
        </span>
        <svg
          className={`size-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`rounded-xl border border-gray-100 bg-white shadow-lg ${
            md ? "w-36" : "min-w-[140px]"
          }`}
        >
          <div className="flex flex-col gap-1 px-1.5 py-1.5">
            {options.map((o) => {
              const isActive = active === o.label;
              return (
                <button
                  key={o.label}
                  onClick={() => setActive(o.label)}
                  className={`flex items-center rounded-[10px] px-3 text-left transition-colors ${
                    md ? "py-1" : "py-1.5"
                  } ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <span
                    className={`font-['Michelle',sans-serif] font-medium ${textCls} ${
                      isActive ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {o.label}
                    <span className={isActive ? "text-gray-400" : "text-gray-300"}> {o.count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Grouped nav groups with sub-headings — mirrors the Art sidebar accordion.
const NAV_GROUPS = [
  {
    id: "fine-art",
    label: "Fine Art",
    children: [
      { id: "painting", label: "Painting", count: 15 },
      { id: "conceptual", label: "Conceptual", count: 4 },
      { id: "graphite", label: "Graphite", count: 3 },
    ],
  },
  {
    id: "sketchbook",
    label: "Sketchbook",
    children: [
      { id: "travel", label: "Travel", count: 12 },
      { id: "figure", label: "Figure", count: 9 },
    ],
  },
  {
    id: "murals",
    label: "Murals",
    children: [
      { id: "cafe", label: "Café wall", count: 1 },
      { id: "campus", label: "Campus", count: 2 },
    ],
  },
];

/** Live instance of the shared Sidebar with expandable sub-headings. */
function SidebarSpecimen() {
  const [openGroup, setOpenGroup] = useState("fine-art");
  const [active, setActive] = useState("painting");

  const nodes: SidebarNode[] = NAV_GROUPS.map((g) => ({
    kind: "group",
    id: g.id,
    label: g.label,
    active: g.children.some((c) => c.id === active),
    expanded: openGroup === g.id,
    children: g.children,
  }));

  const handleSelect = (id: string) => {
    const group = NAV_GROUPS.find((g) => g.id === id);
    if (group) {
      setOpenGroup(id);
      setActive(group.children[0].id);
      return;
    }
    const parent = NAV_GROUPS.find((g) => g.children.some((c) => c.id === id));
    if (parent) {
      setOpenGroup(parent.id);
      setActive(id);
    }
  };

  return (
    <div className="w-full max-w-[180px]">
      <Sidebar nodes={nodes} activeId={active} onSelect={handleSelect} />
    </div>
  );
}

export default function ComponentSection() {
  return (
    <Section
      id="components"
      title="Components"
      subtitle="Live instances of the shared building blocks — navigation, pills, buttons, cards, loaders, and icons."
    >
      <SubLabel>Navigation & pills</SubLabel>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <Specimen
          label="Sidebar nav — grouped, expandable sub-headings (click to switch)"
          className="!items-start !justify-start"
        >
          <SidebarSpecimen />
        </Specimen>

        <Specimen label="Nav tabs — glass active pill">
          <div className="flex gap-1">
            <span className="rounded-full border border-white/50 bg-gray-200/60 px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#4b5563] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02)] backdrop-blur-md">
              Work
            </span>
            <span className="rounded-full border border-transparent px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#9ca3af]">
              Art
            </span>
            <span className="rounded-full border border-transparent px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#9ca3af]">
              About
            </span>
          </div>
        </Specimen>

        <Specimen label="Project title pill">
          <div className="flex items-center justify-center rounded-full border border-[#f3f4f6] bg-white px-3 pb-[4.8px] pt-[5px]">
            <p className="text-base font-medium tracking-[0.005em] text-[#111827]">
              Polaroid <span className="text-[#9ca3af]">• 2024</span>
            </p>
          </div>
        </Specimen>

        <Specimen label="Tag badges — canonical / one-off / experiment">
          <div className="flex flex-wrap items-center gap-2">
            <TagChip tag="canonical" />
            <TagChip tag="one-off" />
            <TagChip tag="experiment" />
          </div>
        </Specimen>

        <Specimen label="Filter pill (active / rest)">
          <div className="flex gap-2">
            <span className="rounded-full bg-gray-500/10 px-3 py-1.5 text-sm text-gray-600">All</span>
            <span className="rounded-full px-3 py-1.5 text-sm text-gray-400">Books</span>
            <span className="rounded-full px-3 py-1.5 text-sm text-gray-400">Film</span>
          </div>
        </Specimen>

        <Specimen label="Filter dropdown — md (Library)">
          <FilterDropdown size="md" options={LIBRARY_OPTIONS} initialActive="2026" />
        </Specimen>

        <Specimen label="Filter dropdown — sm (About shelf)">
          <FilterDropdown size="sm" options={SHELF_OPTIONS} initialActive="2026" />
        </Specimen>

        <Specimen label="Tooltip">
          <div className="rounded-[8px] bg-gray-800 px-2.5 py-1.5 text-sm text-white shadow-lg">
            Tooltip label
          </div>
        </Specimen>

        <Specimen label="Availability badge">
          <div className="flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm text-emerald-600">Available for work</span>
          </div>
        </Specimen>

        <Specimen label="Social / meta link">
          <a className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500">
            Read more <ArrowUpRight />
          </a>
        </Specimen>
      </div>

      <SubLabel>Buttons</SubLabel>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <Specimen label="Primary CTA">
          <button className="flex items-center justify-center gap-1.5 rounded-full border border-blue-400 bg-blue-500 px-4 py-1.5 transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400">
            <span className="font-['Michelle',sans-serif] text-base font-semibold text-white">
              Try It Out!
            </span>
          </button>
        </Specimen>

        <Specimen label="Secondary button">
          <button className="rounded-full border border-[#e5e7eb] bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700">
            View all projects
          </button>
        </Specimen>

        <Specimen label="Dark CTA (experiment)">
          <button className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium tracking-[0.75px] text-white transition-colors hover:bg-zinc-700">
            GENERATE
          </button>
        </Specimen>
      </div>

      <SubLabel>Loaders</SubLabel>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <Specimen label="Spinner — sm / md / lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-400" />
        </Specimen>

        <Specimen label="Shimmer skeleton">
          <div className="flex flex-col gap-2">
            <div className="animate-shimmer h-4 w-40 rounded-md" />
            <div className="animate-shimmer h-4 w-28 rounded-md" />
            <div className="animate-shimmer h-16 w-40 rounded-xl" />
          </div>
        </Specimen>

        <Specimen label="Film loading dots">
          <div className="flex items-end gap-1.5 text-gray-400">
            <span className="text-sm">Loading</span>
            <span className="mb-0.5 flex gap-0.5">
              {[0, 0.2, 0.4].map((d) => (
                <span
                  key={d}
                  className="h-1 w-1 rounded-full bg-gray-400"
                  style={{ animation: `sys-pulse 1.4s ease-in-out ${d}s infinite` }}
                />
              ))}
            </span>
          </div>
        </Specimen>
      </div>

      <SubLabel>Cards</SubLabel>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <Specimen label="Card — shadow-default" className="!bg-gray-100">
          <div className="flex h-24 w-48 flex-col justify-end rounded-3xl border border-gray-100 bg-white p-4 shadow-[0px_4px_16px_0px_rgba(209,213,219,0.65)]">
            <span className="text-sm font-medium text-gray-700">Media card</span>
            <span className="text-xs text-gray-400">rounded-3xl · shadow-default</span>
          </div>
        </Specimen>

        <Specimen label="Book cover" className="!bg-gray-100">
          <div className="h-28 w-20 rounded-sm bg-gradient-to-br from-gray-300 to-gray-400 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]" />
        </Specimen>

        <Specimen label="Quote card" className="!bg-gray-100">
          <div className="flex h-24 w-48 flex-col justify-center rounded-3xl border border-gray-100 bg-white px-4 shadow-[0px_4px_16px_0px_rgba(209,213,219,0.65)]">
            <span className="text-2xl tracking-[0.01em] text-gray-700">“delightful.”</span>
          </div>
        </Specimen>
      </div>
    </Section>
  );
}
