"use client";

import Link from "next/link";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowUpRight } from "../../../icons/ArrowUpRight";
import { Chevron } from "../../../icons/Chevron";
import ContactBadge from "../../../shared/ContactBadge";
import { INLINE_LINK_CLASS } from "../../../shared/inlineLink";
import Sidebar, { type SidebarNode } from "../../../layout/Sidebar";
import Tooltip from "../../../shared/Tooltip";
import { SubLabel } from "../../primitives";
import {
  SPAN_WIDE,
  Specimen,
  SpecimenGrid,
} from "./ComponentSpecimen";

const NAV_TABS = [
  { id: "work", label: "Work" },
  { id: "art", label: "Art" },
  { id: "about", label: "About" },
] as const;

type NavTabId = (typeof NAV_TABS)[number]["id"];

function NavTabs() {
  const [active, setActive] = useState<NavTabId>("work");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<NavTabId, HTMLButtonElement | null>>({
    work: null,
    art: null,
    about: null,
  });
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    height: 0,
    top: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const tab = tabRefs.current[active];
    if (!container || !tab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
      height: tabRect.height,
      top: tabRect.top - containerRect.top,
      ready: true,
    });
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateIndicator);
    if (containerRef.current) observer.observe(containerRef.current);
    NAV_TABS.forEach((tab) => {
      const element = tabRefs.current[tab.id];
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className="nav-tabs-demo relative flex flex-wrap justify-center gap-1"
    >
      <div
        aria-hidden
        className={`nav-tabs-indicator pointer-events-none absolute left-0 top-0 z-0 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass backdrop-blur-md motion-reduce:transition-none ${
          indicator.ready
            ? "transition-[transform,width] duration-300 ease-out"
            : ""
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
            ref={(element) => {
              tabRefs.current[tab.id] = element;
            }}
            onClick={() => setActive(tab.id)}
            className="nav-tab group relative z-10 cursor-pointer rounded-full border border-transparent px-3.5 pb-1 pt-[5px]"
          >
            <span
              className={`text-lg font-medium tracking-[0.005em] transition-colors duration-200 ease-out ${
                isActive
                  ? "text-[#52525b]"
                  : "text-[#a1a1aa] group-hover:text-[#52525b]"
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
      { id: "ca-poppies", label: "CA Poppies", count: 4 },
      { id: "wonder", label: "Wonder", count: 7 },
      { id: "grapevine", label: "Grapevine", count: 5 },
    ],
  },
];

function SidebarDemo() {
  const [openGroup, setOpenGroup] = useState("fine-art");
  const [active, setActive] = useState("painting");

  const nodes: SidebarNode[] = NAV_GROUPS.map((group) => ({
    kind: "group",
    id: group.id,
    label: group.label,
    active: group.children.some((child) => child.id === active),
    expanded: openGroup === group.id,
    children: group.children,
  }));

  const handleSelect = (id: string) => {
    const group = NAV_GROUPS.find((candidate) => candidate.id === id);
    if (group) {
      setOpenGroup(id);
      setActive(group.children[0].id);
      return;
    }

    const parent = NAV_GROUPS.find((candidate) =>
      candidate.children.some((child) => child.id === id),
    );
    if (parent) {
      setOpenGroup(parent.id);
      setActive(id);
    }
  };

  return (
    <div className="sidebar-demo w-full max-w-[180px]">
      <Sidebar nodes={nodes} activeId={active} onSelect={handleSelect} />
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
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

export function NavigationSpecimens() {
  return (
    <>
      <SubLabel>Navigation</SubLabel>
      <SpecimenGrid>
        <Specimen
          label="Sidebar nav"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <SidebarDemo />
        </Specimen>

        <Specimen label="Nav tabs" span={SPAN_WIDE}>
          <NavTabs />
        </Specimen>

        <Specimen label="Breadcrumb" span={SPAN_WIDE}>
          <div className="breadcrumb-demo flex items-center">
            <button
              type="button"
              className="breadcrumb-link ml-2 flex cursor-pointer items-center justify-center rounded-md px-1.5 py-0.5 transition-colors duration-200 hover:bg-[#f4f4f5]"
            >
              <span className="whitespace-nowrap text-sm font-medium leading-normal text-[#52525b]">
                Work
              </span>
            </button>
            <Chevron
              direction="right"
              className="size-4 shrink-0 text-zinc-500"
            />
            <div className="breadcrumb-current flex items-center justify-center px-1 py-0.5">
              <span className="text-sm font-medium leading-normal text-[#27272a]">
                Project
              </span>
            </div>
          </div>
        </Specimen>

        <Specimen label="Tooltip" span={SPAN_WIDE}>
          <div className="tooltip-demo flex items-end justify-center gap-10">
            <div className="tooltip-example flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top" forceOpen>
                <button
                  type="button"
                  className="tooltip-trigger rounded-full p-2 text-[#a1a1aa]"
                  aria-label="Always-open tooltip"
                  tabIndex={-1}
                >
                  <InfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">Always open</span>
            </div>
            <div className="tooltip-example flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top">
                <button
                  type="button"
                  className="tooltip-trigger rounded-full p-2 text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200/50"
                  aria-label="Show tooltip on hover"
                >
                  <InfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">On hover</span>
            </div>
          </div>
        </Specimen>

        <Specimen
          label="Availability badge"
          span="col-span-1 lg:col-span-8"
        >
          <div className="availability-badge-demo flex flex-wrap items-end justify-center gap-8">
            <div className="flex flex-col items-center gap-3">
              <ContactBadge size="md" />
              <span className="text-xs text-zinc-400">md · About</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ContactBadge size="lg" />
              <span className="text-xs text-zinc-400">lg · Header</span>
            </div>
          </div>
        </Specimen>

        <Specimen
          label="Social / meta link"
          span="col-span-1 lg:col-span-4"
        >
          <Link
            href="/about"
            className={`meta-link-demo group/meta inline-flex items-center text-sm font-medium text-zinc-600 ${INLINE_LINK_CLASS}`}
          >
            Read more
            <span className="ml-1 inline-flex items-center opacity-0 transition-opacity duration-150 ease-out group-hover/meta:opacity-100">
              <ArrowUpRight size="1em" />
            </span>
          </Link>
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
