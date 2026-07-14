"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowUpRight } from "../../ArrowUpRight";
import { FieldInput, FieldLeadingIcon, FieldShell, SearchMagnifierIcon } from "../../FieldInput";
import { FilterDropdown } from "../../FilterDropdown";
import Sidebar, { type SidebarNode } from "../../Sidebar";
import Tooltip from "../../Tooltip";
import LiquidGlassButton from "../../art/LiquidGlassButton";
import { Chevron, ChevronRightIcon } from "../../Chevron";
import { iconSize } from "../../iconSizes";
import { ArrowRightIcon } from "../../Arrow";
import { SendIcon } from "../../library/icons";
import { Section, SubLabel, TagChip } from "../primitives";
import type { Tag } from "../tokens";

/**
 * Ghost affordance — transparent resting surface, translucent zinc wash on hover
 * so the specimen (or page) background still shows through.
 * Pair with the control’s DS radius (rounded-full / rounded-xl / rounded-md).
 */
const GHOST_SURFACE =
  "bg-transparent transition-colors duration-200 hover:bg-zinc-900/5";

/** Canonical button class patterns for DS specimens — not a site-wide API. */
type SpecButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
type SpecButtonSize = "sm" | "md" | "lg";

/** Translucent hover washes — background shows through under the control. */
const HOVER_WASH_ZINC = "hover:bg-zinc-900/5";
const HOVER_WASH_ZINC_STRONG = "hover:bg-zinc-500/10";

const SPEC_BUTTON_VARIANT: Record<SpecButtonVariant, string> = {
  primary:
    "border border-blue-400 bg-blue-500 text-white hover:border-blue-300 hover:bg-blue-400",
  secondary:
    `border border-[#e4e4e7] bg-[#fafafa] text-zinc-700 ${HOVER_WASH_ZINC}`,
  tertiary: `bg-zinc-100 text-zinc-700 ${HOVER_WASH_ZINC_STRONG}`,
  ghost: `${GHOST_SURFACE} text-zinc-700`,
};

const SPEC_BUTTON_RADIUS: Record<SpecButtonVariant, string> = {
  primary: "rounded-full",
  secondary: "rounded-full",
  tertiary: "rounded-xl",
  ghost: "rounded-full",
};

const SPEC_BUTTON_SIZE_TEXT: Record<SpecButtonSize, string> = {
  sm: "gap-1 px-3 py-1 text-sm",
  md: "gap-1.5 px-4 py-1.5 text-base",
  lg: "gap-1.5 px-5 py-2.5 text-base",
};

const SPEC_BUTTON_SIZE_ICON: Record<SpecButtonSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

function SpecButton({
  variant,
  size = "md",
  icon = false,
  children,
  className = "",
  type = "button",
  ...props
}: {
  variant: SpecButtonVariant;
  size?: SpecButtonSize;
  icon?: boolean;
  children?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  const radius = SPEC_BUTTON_RADIUS[variant];
  const tone = SPEC_BUTTON_VARIANT[variant];
  const sizing = icon ? SPEC_BUTTON_SIZE_ICON[size] : SPEC_BUTTON_SIZE_TEXT[size];
  const typeFace =
    !icon && variant === "primary"
      ? "font-['Michelle',sans-serif] font-semibold"
      : "font-medium";

  return (
    <button
      {...props}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center transition-colors duration-200 ease-out ${radius} ${tone} ${sizing} ${typeFace} ${className}`}
    >
      {children}
    </button>
  );
}

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

/** Mobile sheet Filter — muted FieldShell + leading magnifier. */
function SearchFieldSpecimen() {
  const [value, setValue] = useState("");

  return (
    <FieldShell tone="muted" className="max-w-[280px] gap-2">
      <FieldLeadingIcon>
        <SearchMagnifierIcon />
      </FieldLeadingIcon>
      <FieldInput
        type="text"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Filter"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Search input specimen"
        className="pr-3 font-medium tracking-[0.01em] text-zinc-700"
      />
    </FieldShell>
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

function InputSpecimensSection() {
  return (
    <>
      <SubLabel note="Pill field shared by password gates, library modal, and mobile Filter. Leading icons use FieldLeadingIcon (size-5) with FieldInput h-5 / leading-5 / p-0.">
        Inputs
      </SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Text" span={SPAN_WIDE}>
          <FieldShell className="max-w-[280px]">
            <FieldInput type="text" placeholder="Book Title" defaultValue="" aria-label="Text input specimen" />
          </FieldShell>
        </Specimen>

        <Specimen label="Search · leading icon" span={SPAN_WIDE}>
          <SearchFieldSpecimen />
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
    </>
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
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap text-sm text-emerald-600">Available for work</span>
          </button>
        </Specimen>

        <Specimen label="Social / meta link" span={SPAN_WIDE}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-zinc-600 transition-colors hover:text-blue-500"
          >
            Read more <ArrowUpRight />
          </button>
        </Specimen>
      </div>

      <InputSpecimensSection />

      <SubLabel note="Axes: variant · size · icon · glass · color. Specimens encode site class patterns (not a shared Button API).">
        Buttons
      </SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Primary CTA · blue" span={SPAN_MID}>
          <SpecButton variant="primary">Try It Out!</SpecButton>
        </Specimen>

        <Specimen label="Secondary CTA · zinc" span={SPAN_MID}>
          <SpecButton variant="secondary" size="lg">
            View all projects
          </SpecButton>
        </Specimen>

        <Specimen label="Tertiary · quiet fill" span={SPAN_MID}>
          <SpecButton variant="tertiary" size="sm">
            Try Again
          </SpecButton>
        </Specimen>

        <Specimen label="Ghost · transparent + wash" span={SPAN_MID}>
          <SpecButton variant="ghost">Read more</SpecButton>
        </Specimen>

        <Specimen label="Sizes · sm / md / lg" span={SPAN_WIDE}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SpecButton variant="primary" size="sm">
              Small
            </SpecButton>
            <SpecButton variant="primary" size="md">
              Medium
            </SpecButton>
            <SpecButton variant="primary" size="lg">
              Large
            </SpecButton>
          </div>
        </Specimen>

        <Specimen label="Icon + text · primary" span={SPAN_MID}>
          <SpecButton variant="primary" size="sm" className="gap-1">
            <span>Continue</span>
            <ArrowUpRight size="12px" />
          </SpecButton>
        </Specimen>

        <Specimen label="Icon + text · secondary" span={SPAN_MID}>
          <SpecButton variant="secondary" size="md" className="gap-1.5">
            <span>Next</span>
            <Chevron direction="right" size={iconSize("inline")} />
          </SpecButton>
        </Specimen>

        <Specimen label="Icon · primary" span={SPAN_NARROW}>
          <SpecButton variant="primary" icon aria-label="Send">
            <SendIcon className="-ml-0.5 w-5 pt-0.5" />
          </SpecButton>
        </Specimen>

        <Specimen label="Icon · secondary" span={SPAN_NARROW}>
          <SpecButton variant="secondary" icon aria-label="Next">
            <Chevron direction="right" size={iconSize("toolbar")} />
          </SpecButton>
        </Specimen>

        <Specimen label="Icon · tertiary" span={SPAN_NARROW}>
          <SpecButton variant="tertiary" icon aria-label="Expand">
            <Chevron direction="down" size={iconSize("toolbar")} />
          </SpecButton>
        </Specimen>

        <Specimen label="Icon · ghost" span={SPAN_NARROW}>
          <SpecButton variant="ghost" icon aria-label="Open menu">
            <Chevron direction="down" size={iconSize("toolbar")} />
          </SpecButton>
        </Specimen>

        <Specimen
          label="Glass · carousel arrow (in use)"
          span={SPAN_WIDE}
          className="!bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
        >
          <LiquidGlassButton className="text-zinc-500 hover:text-zinc-700" aria-label="Scroll right">
            <ChevronRightIcon size={iconSize("toolbar")} className="translate-x-px" />
          </LiquidGlassButton>
        </Specimen>
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 text-pretty">
        In use (not shown): Contact CTA · View on X · Skip link · Breadcrumb · Info · Modal close.
        Colors stay minimal (blue primary, zinc secondary); no destructive CTA on site.
      </p>

      <SubLabel>Loaders</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Spinner" span={SPAN_MID}>
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="size-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-400" />
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
