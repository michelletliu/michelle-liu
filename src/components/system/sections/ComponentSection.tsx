"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "../../ArrowUpRight";
import ContactBadge from "../../ContactBadge";
import Sidebar, { type SidebarNode } from "../../Sidebar";
import Tooltip from "../../Tooltip";
import LiquidGlassButton from "../../art/LiquidGlassButton";
import { ChevronRightIcon } from "../../art/ChevronIcons";
import { PlusIcon, SendIcon } from "../../library/icons";
import { Section, SubLabel, TagChip } from "../primitives";

const X_LOGO_PATH =
  "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

function SpecimenInfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 10.75V16.5M12 7.75V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpecimenExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 4H4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 20H20V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Shared bento tile for component specimens.
 * - Soft zinc-50 rounded card behind every specimen
 * - `h-full` + grid `items-stretch` → equal height within a row
 * - `span` varies width (bento); never clips content (no overflow-hidden)
 */
function Specimen({
  label,
  children,
  className = "",
  span = "col-span-2 md:col-span-4",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  /** Tailwind col-span utilities for the parent 12-col bento grid */
  span?: string;
}) {
  return (
    <div className={`flex h-full min-w-0 flex-col gap-3 ${span}`}>
      <div
        className={`flex min-h-40 w-full flex-1 items-center justify-center gap-4 overflow-visible rounded-2xl bg-zinc-50 px-6 py-8 ${className}`}
      >
        {children}
      </div>
      <div className="text-sm leading-snug text-zinc-400 text-pretty">{label}</div>
    </div>
  );
}

/** 12-col bento: variable widths, equal row height via items-stretch. */
const SPECIMEN_GRID = "grid grid-cols-2 items-stretch gap-x-5 gap-y-8 md:grid-cols-12";
/** ~1/4 — icon / compact controls */
const SPAN_NARROW = "col-span-1 md:col-span-3";
/** ~1/3 — default mid-size specimens */
const SPAN_MID = "col-span-2 md:col-span-4";
/** ~1/2 — primary CTAs, dual controls */
const SPAN_WIDE = "col-span-2 md:col-span-6";
/** ~2/3 — long copy (e.g. Contact CTA) */
const SPAN_XWIDE = "col-span-2 md:col-span-8";

const LIBRARY_OPTIONS = [
  { label: "favorites", count: 8 },
  { label: "all", count: 32 },
  { label: "2026", count: 11 },
  { label: "2025", count: 13 },
];

const SHELF_OPTIONS = [
  { label: "Books ★", count: 5 },
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
        className={`flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 transition-colors cursor-pointer ${
          md ? "py-1.5" : "py-1"
        }`}
      >
        <span className={`font-['Michelle',sans-serif] font-medium text-zinc-500 ${textCls}`}>
          {active}
          <span className="text-zinc-400"> {activeCount}</span>
        </span>
        <svg
          className={`size-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`rounded-xl border border-zinc-100 bg-white shadow-elevated ${
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
                  } ${isActive ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                >
                  <span
                    className={`font-['Michelle',sans-serif] font-medium ${textCls} ${
                      isActive ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {o.label}
                    <span className={isActive ? "text-zinc-400" : "text-zinc-300"}> {o.count}</span>
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
    <Section id="components" title="Components">
      <SubLabel>Navigation & pills</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen
          label="Sidebar nav — grouped, expandable sub-headings (click to switch)"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <SidebarSpecimen />
        </Specimen>

        <Specimen label="Nav tabs — glass active pill" span={SPAN_WIDE}>
          <div className="flex flex-wrap justify-center gap-1">
            <span className="rounded-full border border-white/50 bg-zinc-200/60 px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#52525b] shadow-glass backdrop-blur-md">
              Work
            </span>
            <span className="rounded-full border border-transparent px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#a1a1aa]">
              Art
            </span>
            <span className="rounded-full border border-transparent px-3.5 pb-1 pt-[5px] text-lg font-medium tracking-[0.005em] text-[#a1a1aa]">
              About
            </span>
          </div>
        </Specimen>

        <Specimen label="Project title pill" span={SPAN_MID}>
          <div className="flex items-center justify-center rounded-full border border-[#f4f4f5] bg-white px-3 pb-[4.8px] pt-[5px]">
            <p className="text-base font-medium tracking-[0.005em] text-[#18181b]">
              Polaroid <span className="text-[#a1a1aa]">• 2024</span>
            </p>
          </div>
        </Specimen>

        <Specimen label="Tag badges — canonical / one-off / experiment" span={SPAN_MID}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <TagChip tag="canonical" />
            <TagChip tag="one-off" />
            <TagChip tag="experiment" />
          </div>
        </Specimen>

        <Specimen label="Filter pill (active / rest)" span={SPAN_MID}>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-zinc-500/10 px-3 py-1.5 text-sm text-zinc-600">All</span>
            <span className="rounded-full px-3 py-1.5 text-sm text-zinc-400">Books</span>
            <span className="rounded-full px-3 py-1.5 text-sm text-zinc-400">Film</span>
          </div>
        </Specimen>

        <Specimen
          label="Filter dropdown — md (Library)"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <FilterDropdown size="md" options={LIBRARY_OPTIONS} initialActive="2026" />
        </Specimen>

        <Specimen
          label="Filter dropdown — sm (About shelf)"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <FilterDropdown size="sm" options={SHELF_OPTIONS} initialActive="2026" />
        </Specimen>

        <Specimen label="Tooltip" span={SPAN_WIDE}>
          <div className="flex items-end justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top" forceOpen>
                <button
                  type="button"
                  className="rounded-full p-2 text-[#a1a1aa]"
                  aria-label="Always-open tooltip"
                  tabIndex={-1}
                >
                  <SpecimenInfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">Always open</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top">
                <button
                  type="button"
                  className="rounded-full p-2 text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200/50"
                  aria-label="Show tooltip on hover"
                >
                  <SpecimenInfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">On hover</span>
            </div>
          </div>
        </Specimen>

        <Specimen label="Availability badge" span={SPAN_MID}>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap text-sm text-emerald-600">Available for work</span>
          </div>
        </Specimen>

        <Specimen label="Social / meta link" span={SPAN_NARROW}>
          <a className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-blue-500">
            Read more <ArrowUpRight />
          </a>
        </Specimen>
      </div>

      <SubLabel>Buttons</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Primary CTA" span={SPAN_WIDE}>
          <button className="flex items-center justify-center gap-1.5 rounded-full border border-blue-400 bg-blue-500 px-4 py-1.5 transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400">
            <span className="font-['Michelle',sans-serif] text-base font-semibold text-white">
              Try It Out!
            </span>
          </button>
        </Specimen>

        <Specimen label="View on X" span={SPAN_WIDE}>
          <button className="flex items-center justify-center gap-1 rounded-full border border-blue-400 bg-blue-500 px-3 py-1 transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400">
            <span className="font-['Michelle',sans-serif] text-sm font-semibold text-white whitespace-nowrap">
              View on
            </span>
            <svg className="block h-3 w-3 fill-white" viewBox="0 0 19 18" aria-hidden>
              <path d={X_LOGO_PATH} />
            </svg>
            <span className="inline-flex items-center text-white">
              <ArrowUpRight size="12px" />
            </span>
          </button>
        </Specimen>

        <Specimen label="Secondary button" span={SPAN_MID}>
          <button className="rounded-full border border-[#e4e4e7] bg-[#fafafa] px-5 py-2.5 text-base font-medium text-zinc-700 transition-colors hover:bg-[#f4f4f5]">
            View all projects
          </button>
        </Specimen>

        <Specimen label="Dark CTA (experiment)" span={SPAN_MID}>
          <button className="rounded-full bg-zinc-900 px-5 py-2.5 font-mono text-[15px] font-medium tracking-[0.75px] text-white transition-colors hover:bg-zinc-700">
            GENERATE
          </button>
        </Specimen>

        <Specimen label="Quiet action" span={SPAN_MID}>
          <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-200">
            Try Again
          </button>
        </Specimen>

        <Specimen label="Contact CTA" span={SPAN_XWIDE}>
          <ContactBadge className="shrink-0 gap-1.5 px-3 py-1.5" />
        </Specimen>

        <Specimen label="Ghost text" span={SPAN_NARROW}>
          <button className="text-left text-base leading-5 text-[#a1a1aa] transition-colors hover:text-[#71717a]">
            Read more
          </button>
        </Specimen>

        <Specimen label="Ghost mono (experiment)" span={SPAN_WIDE}>
          <button className="group flex items-center justify-center gap-3.5 px-6 py-2 transition-colors">
            <span className="whitespace-nowrap font-mono text-[15px] font-semibold text-zinc-500 transition-colors group-hover:text-zinc-700">
              Upload Actual Data
            </span>
          </button>
        </Specimen>

        <Specimen label="Skip link" span={SPAN_NARROW}>
          <button className="flex flex-col items-start gap-0.5 text-left text-xs font-medium leading-tight text-zinc-400 transition-colors hover:text-blue-500">
            <span>↓ SKIP TO</span>
            <span>DESIGNS</span>
          </button>
        </Specimen>

        <Specimen label="Breadcrumb ghost" span={SPAN_NARROW}>
          <button className="rounded-md px-1.5 py-0.5 text-sm font-medium text-[#52525b] transition-colors hover:bg-[#f4f4f5]">
            Work
          </button>
        </Specimen>

        <Specimen label="Icon — info" span={SPAN_NARROW}>
          <button
            className="rounded-full p-2 text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200/50"
            aria-label="Project info"
          >
            <SpecimenInfoIcon />
          </button>
        </Specimen>

        <Specimen label="Icon — expand" span={SPAN_NARROW}>
          <button
            className="flex size-6 items-center justify-center rounded-lg text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200"
            aria-label="Expand to full page"
          >
            <SpecimenExpandIcon />
          </button>
        </Specimen>

        <Specimen label="Icon — add" span={SPAN_NARROW}>
          <button
            className="flex size-9 items-center justify-center rounded-full bg-zinc-500/10 text-zinc-400 transition-all duration-300 hover:bg-[rgba(0,0,0,0.1)]"
            aria-label="Add book"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </Specimen>

        <Specimen label="Icon — submit" span={SPAN_NARROW}>
          <button
            className="flex size-10 items-center justify-center rounded-full border border-blue-400 bg-blue-500 text-white transition-colors hover:bg-blue-400"
            aria-label="Submit"
          >
            <SendIcon className="-ml-0.5 w-5 pt-0.5" />
          </button>
        </Specimen>

        <Specimen label="Modal close" span={SPAN_NARROW} className="!bg-zinc-200/80">
          <button
            className="flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 transition-colors hover:bg-zinc-100"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </Specimen>

        <Specimen
          label="Glass carousel arrow"
          span={SPAN_NARROW}
          className="!bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
        >
          <LiquidGlassButton className="text-zinc-500 hover:text-zinc-700" aria-label="Scroll right">
            <ChevronRightIcon className="size-5 translate-x-px" />
          </LiquidGlassButton>
        </Specimen>
      </div>

      <SubLabel>Loaders</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Spinner — sm / md / lg" span={SPAN_MID}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-400" />
        </Specimen>

        <Specimen label="Shimmer skeleton" span={SPAN_MID}>
          <div className="flex flex-col gap-2">
            <div className="animate-shimmer h-4 w-40 rounded-md" />
            <div className="animate-shimmer h-4 w-28 rounded-md" />
            <div className="animate-shimmer h-16 w-40 rounded-xl" />
          </div>
        </Specimen>

        <Specimen label="Film loading dots" span={SPAN_MID}>
          <div className="flex items-end gap-1.5 text-zinc-400">
            <span className="text-sm">Loading</span>
            <span className="mb-0.5 flex gap-0.5">
              {[0, 0.2, 0.4].map((d) => (
                <span
                  key={d}
                  className="h-1 w-1 rounded-full bg-zinc-400"
                  style={{ animation: `sys-pulse 1.4s ease-in-out ${d}s infinite` }}
                />
              ))}
            </span>
          </div>
        </Specimen>
      </div>

      <SubLabel>Cards</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Card — shadow-default" span={SPAN_MID} className="!bg-zinc-100">
          <div className="flex h-24 w-48 flex-col justify-end rounded-3xl border border-zinc-100 bg-white p-4 shadow-default">
            <span className="text-sm font-medium text-zinc-700">Media card</span>
            <span className="text-xs text-zinc-400">rounded-3xl · shadow-default</span>
          </div>
        </Specimen>

        <Specimen label="Book cover" span={SPAN_NARROW} className="!bg-zinc-100">
          <div className="h-28 w-20 rounded-sm bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-media" />
        </Specimen>

        <Specimen label="Quote card" span={SPAN_WIDE} className="!bg-zinc-100">
          <div className="flex h-24 w-48 flex-col justify-center rounded-3xl border border-zinc-100 bg-white px-4 shadow-default">
            <span className="text-2xl tracking-[0.01em] text-zinc-700">“delightful.”</span>
          </div>
        </Specimen>
      </div>
    </Section>
  );
}
