"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowUpRight } from "../../ArrowUpRight";
import ContactBadge from "../../ContactBadge";
import { FieldInput, FieldShell } from "../../FieldInput";
import { FilterDropdown } from "../../FilterDropdown";
import Sidebar, { type SidebarNode } from "../../Sidebar";
import Tooltip from "../../Tooltip";
import LiquidGlassButton from "../../art/LiquidGlassButton";
import { Chevron, ChevronRightIcon } from "../../Chevron";
import { Close } from "../../Close";
import { iconSize } from "../../iconSizes";
import { ArrowRightIcon } from "../../Arrow";
import { PlusIcon, SendIcon } from "../../library/icons";
import { Section, SubLabel, TagChip } from "../primitives";
import type { Tag } from "../tokens";

/**
 * Sitewide ghost affordance — transparent resting surface, zinc wash on hover.
 * Pair with the control’s DS radius (rounded-full / rounded-lg / rounded-md).
 */
const GHOST_SURFACE =
  "bg-transparent transition-colors duration-200 hover:bg-zinc-100";
/** Ghost text tint used when the control has no fill (links, mono, skip). */
const GHOST_TEXT =
  "bg-transparent text-zinc-500 transition-colors duration-200 hover:text-zinc-700";

const X_LOGO_PATH =
  "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

function SpecimenInfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path
        d="M12 10.75V16.5M12 7.75V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SpecimenExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 4H4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M4 4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M14 20H20V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M20 20L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Shared bento tile for component specimens.
 * - Soft zinc-50 rounded card behind every specimen
 * - Outer + card are always `w-full` so the bg fills the grid cell (never shrink-wrap)
 * - `min-h-64` keeps short specimens (e.g. tag badges) level with neighbors
 * - Mobile (< lg): full content-column width; lg+: variable bento spans
 * - `h-full` + grid `items-stretch` / `justify-items-stretch` → equal height + full cell width
 * - Never clips content (no overflow-hidden)
 * - Inner children stay content-sized and centered; only the bg card stretches
 */
function Specimen({
  label,
  children,
  className = "",
  span = "col-span-1 lg:col-span-4",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  /** Tailwind col-span utilities for the parent 12-col bento grid */
  span?: string;
}) {
  return (
    <div className={`flex h-full w-full min-w-0 flex-col gap-3 self-stretch ${span}`}>
      <div
        className={`flex min-h-64 w-full min-w-0 flex-1 items-center justify-center gap-4 overflow-visible rounded-2xl bg-zinc-50 px-6 py-8 ${className}`}
      >
        {children}
      </div>
      <div className="text-sm leading-snug text-zinc-400 text-pretty">{label}</div>
    </div>
  );
}

/**
 * Mobile: single column so every zinc-50 card fills the content width
 * (page px-6 / md:px-16 padding still applies). lg+: 12-col bento packing.
 */
const SPECIMEN_GRID =
  "grid grid-cols-1 items-stretch justify-items-stretch gap-y-8 lg:grid-cols-12 lg:gap-x-5";
/** ~1/4 — icon / compact controls */
const SPAN_NARROW = "col-span-1 lg:col-span-3";
/** ~1/3 — default mid-size specimens */
const SPAN_MID = "col-span-1 lg:col-span-4";
/** ~1/2 — primary CTAs, dual controls */
const SPAN_WIDE = "col-span-1 lg:col-span-6";
/** ~2/3 — long copy (e.g. Contact CTA) */
const SPAN_XWIDE = "col-span-1 lg:col-span-8";

const LIBRARY_OPTIONS = [
  { value: "favorites", label: "favorites", count: 8 },
  { value: "all", label: "all", count: 32 },
  { value: "2026", label: "2026", count: 11 },
  { value: "2025", label: "2025", count: 13 },
];

const SHELF_OPTIONS = [
  { value: "books", label: "Books ★", count: 5 },
  { value: "2026", label: "2026", count: 11 },
  { value: "2025", label: "2025", count: 13 },
  { value: "2024", label: "2024", count: 7 },
];

const FILTER_PILLS = [
  { id: "books", label: "★ Books", count: 5 },
  { id: "2026", label: "2026", count: 10 },
  { id: "2025", label: "2025", count: 13 },
];

const NAV_TABS = [
  { id: "work", label: "Work" },
  { id: "art", label: "Art" },
  { id: "about", label: "About" },
] as const;

type NavTabId = (typeof NAV_TABS)[number]["id"];

/** Sliding-pill nav tabs — same interaction as NavigationTabs, local state only. */
function NavTabsSpecimen() {
  const [active, setActive] = useState<NavTabId>("work");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<NavTabId, HTMLButtonElement | null>>({
    work: null,
    art: null,
    about: null,
  });
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, top: 0, ready: false });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const tab = tabRefs.current[active];
    if (!container || !tab) return;
    const c = container.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    setIndicator({
      left: t.left - c.left,
      width: t.width,
      height: t.height,
      top: t.top - c.top,
      ready: true,
    });
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateIndicator);
    if (containerRef.current) observer.observe(containerRef.current);
    NAV_TABS.forEach((tab) => {
      const el = tabRefs.current[tab.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap justify-center gap-1">
      <div
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-0 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass backdrop-blur-md motion-reduce:transition-none ${
          indicator.ready ? "transition-[transform,width] duration-300 ease-out" : ""
        }`}
        style={{
          transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
          width: indicator.width,
          height: indicator.height,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {NAV_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => setActive(tab.id)}
            className="group relative z-10 cursor-pointer rounded-full border border-transparent px-3.5 pb-1 pt-[5px]"
          >
            <span
              className={`text-lg font-medium tracking-[0.005em] transition-colors duration-200 ease-out ${
                isActive ? "text-[#52525b]" : "text-[#a1a1aa] group-hover:text-[#52525b]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Shelf-style filter pills — toggle active/rest on click. */
function FilterPillsSpecimen() {
  const [active, setActive] = useState("books");

  return (
    <div className="flex flex-wrap justify-center gap-2 font-['Michelle',sans-serif] text-sm font-medium tracking-wide">
      {FILTER_PILLS.map((pill) => {
        const isActive = active === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => setActive(pill.id)}
            className={`cursor-pointer rounded-full px-3 py-1.5 transition-colors ${
              isActive ? "bg-zinc-500/10" : "hover:bg-zinc-500/5"
            }`}
          >
            <span className={isActive ? "text-zinc-500" : "text-zinc-400"}>
              {pill.label}{" "}
              <span className={isActive ? "text-zinc-400" : "text-zinc-300"}>{pill.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Featured work-card title pill chrome — matches HomePageClient ProjectCard. */
function ProjectTitlePill({
  suffix,
  suffixClassName,
}: {
  suffix: string;
  suffixClassName: string;
}) {
  return (
    <div className="flex items-center justify-center rounded-full border border-zinc-100 bg-white px-3 pb-[4.8px] pt-[5px]">
      <p className="font-['Michelle',sans-serif] text-base font-medium leading-[1.4] tracking-[0.005em] text-zinc-900">
        Polaroid <span className={suffixClassName}>• {suffix}</span>
      </p>
    </div>
  );
}

/** Two static states of the project title pill — year at rest, Try It Out! on hover. */
function ProjectTitlePillSpecimen() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill suffix="2024" suffixClassName="text-zinc-400" />
        <span className="text-xs text-zinc-400">Default</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill suffix="Try It Out!" suffixClassName="text-blue-400" />
        <span className="text-xs text-zinc-400">Hover</span>
      </div>
    </div>
  );
}

const TAG_BADGE_TAGS: Tag[] = ["canonical", "one-off", "experiment"];

/** Provenance tag chips — decorative labels, non-interactive. */
function TagBadgesSpecimen() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {TAG_BADGE_TAGS.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  );
}

/** Live FilterDropdown with local active value. */
function FilterDropdownSpecimen({
  options,
  initialActive,
}: {
  options: { value: string; label: string; count: number }[];
  initialActive: string;
}) {
  const [active, setActive] = useState(initialActive);
  return (
    <FilterDropdown
      options={options}
      activeValue={active}
      onChange={setActive}
      defaultOpen
    />
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
          label="Sidebar nav"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <SidebarSpecimen />
        </Specimen>

        <Specimen label="Nav tabs" span={SPAN_WIDE}>
          <NavTabsSpecimen />
        </Specimen>

        <Specimen label="Project title pill" span={SPAN_WIDE}>
          <ProjectTitlePillSpecimen />
        </Specimen>

        <Specimen label="Tag badges" span={SPAN_WIDE}>
          <TagBadgesSpecimen />
        </Specimen>

        <Specimen label="Filter pill" span={SPAN_WIDE}>
          <FilterPillsSpecimen />
        </Specimen>

        <Specimen
          label="Filter dropdown"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <FilterDropdownSpecimen options={LIBRARY_OPTIONS} initialActive="2026" />
        </Specimen>

        <Specimen
          label="Filter dropdown"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <FilterDropdownSpecimen options={SHELF_OPTIONS} initialActive="2026" />
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

        <Specimen label="Availability badge" span={SPAN_WIDE}>
          <button
            type="button"
            className="flex shrink-0 cursor-default items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1.5 transition-colors hover:bg-emerald-50"
            aria-label="Available for work"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap text-sm text-emerald-600">Available for work</span>
          </button>
        </Specimen>

        <Specimen label="Social / meta link" span={SPAN_WIDE}>
          <a
            href="#components"
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-zinc-600 transition-colors hover:text-blue-500"
            onClick={(e) => e.preventDefault()}
          >
            Read more <ArrowUpRight />
          </a>
        </Specimen>
      </div>

      <SubLabel note="Pill field shared by password gates and the library submit-book modal. Idle border transparent → zinc-300 on focus; red-400 on error.">
        Inputs
      </SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Text" span={SPAN_WIDE}>
          <FieldShell className="max-w-[280px]">
            <FieldInput type="text" placeholder="Book Title" defaultValue="" aria-label="Text input specimen" />
          </FieldShell>
        </Specimen>

        <Specimen label="Password" span={SPAN_WIDE}>
          <FieldShell className="max-w-[280px] justify-between">
            <FieldInput type="password" placeholder="Enter" defaultValue="" aria-label="Password input specimen" />
            <span className="size-3.5 shrink-0 text-zinc-400" aria-hidden>
              <ArrowRightIcon size="14px" className="block size-full" />
            </span>
          </FieldShell>
        </Specimen>

        <Specimen label="Focused" span={SPAN_WIDE}>
          <FieldShell active className="max-w-[240px]">
            <FieldInput type="text" defaultValue="Michelle" aria-label="Focused input specimen" readOnly />
          </FieldShell>
        </Specimen>

        <Specimen label="Muted (library)" span={SPAN_WIDE}>
          <FieldShell tone="muted" className="max-w-[240px]">
            <FieldInput
              type="text"
              placeholder="Say Hi"
              defaultValue=""
              className="px-3.5"
              aria-label="Muted library input specimen"
            />
          </FieldShell>
        </Specimen>

        <Specimen label="Disabled" span={SPAN_WIDE}>
          <FieldShell className="max-w-[240px]">
            <FieldInput type="text" placeholder="Unavailable" disabled aria-label="Disabled input specimen" />
          </FieldShell>
        </Specimen>

        <Specimen label="Error" span={SPAN_WIDE}>
          <FieldShell error className="max-w-[240px]">
            <FieldInput type="password" placeholder="Enter" defaultValue="••••" aria-label="Error input specimen" readOnly />
          </FieldShell>
        </Specimen>
      </div>

      <SubLabel>Buttons</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Primary CTA" span={SPAN_MID}>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-full border border-blue-400 bg-blue-500 px-4 py-1.5 transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400"
          >
            <span className="font-['Michelle',sans-serif] text-base font-semibold text-white">
              Try It Out!
            </span>
          </button>
        </Specimen>

        <Specimen
          label="Primary ghost · bg-transparent · hover:bg-blue-50 · rounded-full"
          span={SPAN_MID}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-4 py-1.5 text-blue-500 transition-colors duration-200 ease-out hover:bg-blue-50"
          >
            <span className="font-['Michelle',sans-serif] text-base font-semibold">
              Try It Out!
            </span>
          </button>
        </Specimen>

        <Specimen label="View on X" span={SPAN_MID}>
          <button
            type="button"
            className="flex items-center justify-center gap-1 rounded-full border border-blue-400 bg-blue-500 px-3 py-1 transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400"
          >
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

        <Specimen
          label="Link ghost · no fill · hover:text-blue-500 (ExperimentModal)"
          span={SPAN_MID}
        >
          <button
            type="button"
            className="group inline-flex items-center justify-center gap-1 rounded-full px-3 py-1 transition-colors duration-200 ease-out"
          >
            <span className="font-['Michelle',sans-serif] text-sm font-medium text-zinc-500 whitespace-nowrap transition-colors group-hover:text-blue-500">
              sundays.rsvp
            </span>
            <span className="inline-flex items-center text-zinc-500 transition-colors group-hover:text-blue-500">
              <ArrowUpRight size="12px" />
            </span>
          </button>
        </Specimen>

        <Specimen label="Secondary" span={SPAN_MID}>
          <button
            type="button"
            className="rounded-full border border-[#e4e4e7] bg-[#fafafa] px-5 py-2.5 text-base font-medium text-zinc-700 transition-colors hover:bg-[#f4f4f5]"
          >
            View all projects
          </button>
        </Specimen>

        <Specimen
          label="Secondary ghost · bg-transparent · hover:bg-zinc-100 · rounded-full"
          span={SPAN_MID}
        >
          <button
            type="button"
            className={`rounded-full border border-transparent px-5 py-2.5 text-base font-medium text-zinc-700 ${GHOST_SURFACE}`}
          >
            View all projects
          </button>
        </Specimen>

        <Specimen label="Quiet action" span={SPAN_MID}>
          <button
            type="button"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Try Again
          </button>
        </Specimen>

        <Specimen
          label="Quiet ghost · bg-transparent · hover:bg-zinc-100 · rounded-lg"
          span={SPAN_MID}
        >
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm text-zinc-700 ${GHOST_SURFACE}`}
          >
            Try Again
          </button>
        </Specimen>

        <Specimen label="Dark CTA (experiment)" span={SPAN_MID}>
          <button
            type="button"
            className="rounded-full bg-zinc-900 px-5 py-2.5 font-mono text-[15px] font-medium tracking-[0.75px] text-white transition-colors hover:bg-zinc-700"
          >
            GENERATE
          </button>
        </Specimen>

        <Specimen
          label="Dark ghost (experiment) · bg-transparent · hover:bg-zinc-100"
          span={SPAN_MID}
        >
          <button
            type="button"
            className={`rounded-full px-5 py-2.5 font-mono text-[15px] font-medium tracking-[0.75px] text-zinc-900 ${GHOST_SURFACE}`}
          >
            GENERATE
          </button>
        </Specimen>

        <Specimen label="Contact CTA" span={SPAN_XWIDE}>
          <ContactBadge className="shrink-0 gap-1.5 px-3 py-1.5" />
        </Specimen>

        <Specimen label="Ghost text · color-only hover" span={SPAN_MID}>
          <button
            type="button"
            className={`text-left text-base leading-5 ${GHOST_TEXT}`}
          >
            Read more
          </button>
        </Specimen>

        <Specimen label="Ghost mono (experiment) · color-only hover" span={SPAN_WIDE}>
          <button type="button" className={`group flex items-center justify-center gap-3.5 px-6 py-2 ${GHOST_TEXT}`}>
            <span className="whitespace-nowrap font-mono text-[15px] font-semibold">
              Upload Actual Data
            </span>
          </button>
        </Specimen>

        <Specimen label="Skip link · color-only hover" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex flex-col items-start gap-0.5 bg-transparent text-left text-xs font-medium leading-tight text-zinc-400 transition-colors hover:text-blue-500"
          >
            <span>↓ SKIP TO</span>
            <span>DESIGNS</span>
          </button>
        </Specimen>

        <Specimen
          label="Breadcrumb ghost · bg-transparent · hover:bg-zinc-100 · rounded-md"
          span={SPAN_NARROW}
        >
          <button
            type="button"
            className={`rounded-md px-1.5 py-0.5 text-sm font-medium text-[#52525b] ${GHOST_SURFACE}`}
          >
            Work
          </button>
        </Specimen>
      </div>

      <SubLabel>Icon buttons</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Primary · size-10 · rounded-full" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full border border-blue-400 bg-blue-500 text-white transition-colors duration-200 hover:border-blue-300 hover:bg-blue-400"
            aria-label="Submit"
          >
            <SendIcon className="-ml-0.5 w-5 pt-0.5" />
          </button>
        </Specimen>

        <Specimen
          label="Primary ghost · bg-transparent · hover:bg-blue-50 · rounded-full"
          span={SPAN_NARROW}
        >
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-transparent text-blue-500 transition-colors duration-200 hover:bg-blue-50"
            aria-label="Submit"
          >
            <SendIcon className="-ml-0.5 w-5 pt-0.5" />
          </button>
        </Specimen>

        <Specimen label="Secondary · size-10 · rounded-full" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full border border-[#e4e4e7] bg-[#fafafa] text-zinc-700 transition-colors duration-200 hover:bg-[#f4f4f5]"
            aria-label="Next"
          >
            <Chevron direction="right" size={iconSize("toolbar")} />
          </button>
        </Specimen>

        <Specimen
          label="Secondary ghost · bg-transparent · hover:bg-zinc-100 · rounded-full"
          span={SPAN_NARROW}
        >
          <button
            type="button"
            className={`flex size-10 items-center justify-center rounded-full text-zinc-700 ${GHOST_SURFACE}`}
            aria-label="Next"
          >
            <Chevron direction="right" size={iconSize("toolbar")} />
          </button>
        </Specimen>

        <Specimen label="Quiet · size-10 · rounded-lg" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors duration-200 hover:bg-zinc-200"
            aria-label="Expand"
          >
            <Chevron direction="down" size={iconSize("toolbar")} />
          </button>
        </Specimen>

        <Specimen
          label="Quiet ghost · bg-transparent · hover:bg-zinc-100 · rounded-lg · sticky morph"
          span={SPAN_NARROW}
        >
          <button
            type="button"
            className={`flex size-10 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-500 ${GHOST_SURFACE}`}
            aria-label="Open menu"
          >
            <Chevron direction="down" size={iconSize("touch")} />
          </button>
        </Specimen>

        <Specimen label="Dark (experiment) · size-10 · rounded-full" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors duration-200 hover:bg-zinc-700"
            aria-label="Generate"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </Specimen>

        <Specimen
          label="Dark ghost (experiment) · bg-transparent · hover:bg-zinc-100"
          span={SPAN_NARROW}
        >
          <button
            type="button"
            className={`flex size-10 items-center justify-center rounded-full text-zinc-900 ${GHOST_SURFACE}`}
            aria-label="Generate"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </Specimen>

        <Specimen label="Info · rounded-full · soft wash" span={SPAN_NARROW}>
          <button
            type="button"
            className="rounded-full p-2 text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200/50"
            aria-label="Project info"
          >
            <SpecimenInfoIcon />
          </button>
        </Specimen>

        <Specimen label="Expand · size-6 · rounded-lg ghost" span={SPAN_NARROW}>
          <button
            type="button"
            className={`flex size-6 items-center justify-center rounded-lg text-[#a1a1aa] hover:text-zinc-600 ${GHOST_SURFACE}`}
            aria-label="Expand to full page"
          >
            <SpecimenExpandIcon />
          </button>
        </Specimen>

        <Specimen label="Add · size-9 · tinted fill" span={SPAN_NARROW}>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-zinc-500/10 text-zinc-400 transition-all duration-200 hover:bg-[rgba(0,0,0,0.1)]"
            aria-label="Add book"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </Specimen>

        <Specimen label="Modal close · size-8 · rounded-full" span={SPAN_NARROW} className="!bg-zinc-200/80">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 transition-colors duration-200 hover:bg-zinc-100"
            aria-label="Close"
          >
            <Close size={iconSize("touch")} />
          </button>
        </Specimen>

        <Specimen
          label="Modal close ghost · bg-transparent · hover:bg-zinc-100 · rounded-full"
          span={SPAN_NARROW}
          className="!bg-zinc-200/80"
        >
          <button
            type="button"
            className={`flex size-8 items-center justify-center rounded-full text-zinc-500 ${GHOST_SURFACE}`}
            aria-label="Close"
          >
            <Close size={iconSize("touch")} />
          </button>
        </Specimen>

        <Specimen
          label="Glass carousel arrow"
          span={SPAN_WIDE}
          className="!bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
        >
          <LiquidGlassButton className="text-zinc-500 hover:text-zinc-700" aria-label="Scroll right">
            <ChevronRightIcon size={iconSize("toolbar")} className="translate-x-px" />
          </LiquidGlassButton>
        </Specimen>
      </div>

      <SubLabel>Loaders</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Spinner" span={SPAN_MID}>
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
          <style>{`@keyframes film-dot-pulse{0%,80%,100%{opacity:.15}40%{opacity:1}}.film-dot{animation:film-dot-pulse 1.4s ease-in-out infinite;opacity:.15}`}</style>
          <p className="text-sm text-zinc-600">
            Loading
            <span className="film-dot" style={{ animationDelay: "0s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.4s" }}>.</span>
          </p>
        </Specimen>
      </div>

      <SubLabel>Cards</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Card" span={SPAN_MID} className="!bg-zinc-100">
          <button
            type="button"
            className="flex h-24 w-48 cursor-pointer flex-col justify-end rounded-3xl border border-zinc-100 bg-white p-4 shadow-default shadow-default-hover transition-transform duration-200 hover:scale-[1.01]"
          >
            <span className="text-sm font-medium text-zinc-700">Media card</span>
            <span className="text-xs text-zinc-400">rounded-3xl · shadow-default</span>
          </button>
        </Specimen>

        <Specimen label="Book cover" span={SPAN_MID} className="!bg-zinc-100">
          <button
            type="button"
            className="h-28 w-20 cursor-pointer rounded-sm bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-media transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]"
            aria-label="Book cover"
          />
        </Specimen>

        <Specimen label="Quote card" span={SPAN_MID} className="!bg-zinc-100">
          <button
            type="button"
            className="flex h-24 w-48 cursor-pointer flex-col justify-center rounded-3xl border border-zinc-100 bg-white px-4 shadow-default shadow-default-hover transition-transform duration-200 hover:scale-[1.01]"
          >
            <span className="text-2xl tracking-[0.01em] text-zinc-700">“delightful.”</span>
          </button>
        </Specimen>
      </div>
    </Section>
  );
}
