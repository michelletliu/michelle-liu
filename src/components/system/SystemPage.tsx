"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Sidebar, { type SidebarNode } from "../Sidebar";
import BlueprintLogo from "../BlueprintLogo";
import {
  markBlueprintDoorwayNav,
  getDoorwayReturnPath,
  doorwayReturnLabel,
} from "../blueprintDoorwayNav";
import { warmDoorwayReturn } from "../doorwayWarm";
import Footer from "../Footer";
import { Chevron } from "../Chevron";
import { Close } from "../Close";
import {
  FieldInput,
  FieldLeadingIcon,
  FieldShell,
  SearchMagnifierIcon,
} from "../FieldInput";
import { iconSize } from "../iconSizes";
import { useScrollLock } from "../../utils/useScrollLock";
import {
  tocSections,
  tocSubsections,
  subSlug,
  pathForSectionId,
  sectionIdFromPathSlug,
  DESIGN_SYSTEM_BASE_PATH,
} from "./tokens";
import { TagChip } from "./primitives";
// Light token sections ship with the shell so above-the-fold content isn't
// blocked on a dynamic() waterfall (skeleton → chunk → fade).
import ColorSection from "./sections/ColorSection";
import TypographySection from "./sections/TypographySection";
import ShadowSection from "./sections/ShadowSection";
import SpacingSection from "./sections/SpacingSection";
import BorderSection from "./sections/BorderSection";

/** Lightweight placeholder while heavy specimen chunks arrive. */
function SectionSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      aria-hidden
      className={`mb-16 animate-pulse rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-100 ${
        tall ? "h-[28rem]" : "h-48"
      }`}
    />
  );
}

// Heavy specimen / demo sections — keep out of the initial SystemPage chunk.
const MaterialSection = dynamic(() => import("./sections/MaterialSection"), {
  loading: () => <SectionSkeleton tall />,
});
const MotionSection = dynamic(() => import("./sections/MotionSection"), {
  loading: () => <SectionSkeleton tall />,
});
const IconSection = dynamic(() => import("./sections/IconSection"), {
  loading: () => <SectionSkeleton tall />,
});
const ComponentSection = dynamic(() => import("./sections/ComponentSection"), {
  loading: () => <SectionSkeleton tall />,
});

/**
 * Icon-button hit target — SpecButton icon **md** (`size-10` / 40px),
 * rounded-xl (not pill). Shared by sticky-bar slot, sheet close slot, and
 * the floating morph control.
 */
const MORPH_CONTROL_BOX = "size-10";
/**
 * One glyph size for both morph states — touch (24). Close/Chevron share
 * comparable path bounds in the 24 viewBox so glyphs match optically.
 */
const MORPH_ICON = iconSize("touch");
/** Spacer for the floating chevron↔X control (size-10 hit target). */
const MORPH_SLOT = `${MORPH_CONTROL_BOX} shrink-0`;

/**
 * Shared control: down-chevron morphs into Close X (and reverse).
 * CSS transitions (not Framer Motion) — FM opacity could stick at 0 after
 * rapid open/close, making the X disappear while the sheet stays open.
 */
function ChevronCloseMorph({ open }: { open: boolean }) {
  return (
    <span
      className="relative inline-flex size-6 items-center justify-center overflow-visible"
      aria-hidden
    >
      <span
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-out",
          open ? "scale-75 opacity-0" : "scale-100 opacity-100",
        )}
      >
        <Chevron direction="down" size={MORPH_ICON} />
      </span>
      <span
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-out",
          open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-45 opacity-0",
        )}
      >
        <Close size={MORPH_ICON} />
      </span>
    </span>
  );
}

/** Matches Chevron toolbar width so flat rows align with expandable ones. */
const LEADING_ICON_SLOT = "w-5 shrink-0";
/**
 * Sheet TOC row. With list `px-2`, `pl-5.5` puts the chevron column at the same
 * x as Filter’s magnifier (shell px-5 + muted px-1 + leading ml-1.5). `gap-2.5`
 * then lines labels up with the Filter placeholder.
 */
const SHEET_ROW =
  "flex w-full min-h-11 items-center gap-2.5 rounded-xl py-2.5 pl-5.5 pr-3 text-left transition-colors duration-200 hover:bg-zinc-50";

type SheetLeaf = { id: string; label: string };
type SheetRow =
  | { kind: "item"; id: string; label: string }
  | { kind: "group"; id: string; label: string; children: SheetLeaf[] };

/**
 * Mobile section picker — HIG-inspired local bar + full-screen sheet.
 * Mirrors desktop Sidebar colors/expand behavior; chevron morphs into Close.
 */
function MobileSectionMenu({
  activeSection,
  activeId,
  expandedSection,
  onToggleExpand,
  onSelect,
}: {
  activeSection: string;
  activeId: string;
  expandedSection: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const barSlotRef = useRef<HTMLSpanElement>(null);
  const sheetSlotRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [togglePos, setTogglePos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const activeLabel =
    tocSections.find((s) => s.id === activeSection)?.label ?? tocSections[0].label;

  useScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Floating toggle tracks the sticky-bar slot when closed, and the sheet
  // header slot when open (fixed sheet — stable under keyboard / scroll-lock).
  useLayoutEffect(() => {
    if (!mounted) return;
    const measure = () => {
      const slot = open
        ? sheetSlotRef.current ?? barSlotRef.current
        : barSlotRef.current;
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      // display:none / pre-layout → zeros; don't park the control at 0,0.
      if (r.width < 1 || r.height < 1) return;
      setTogglePos((prev) => {
        if (prev && prev.top === r.top && prev.left === r.left) return prev;
        return { top: r.top, left: r.left };
      });
    };
    measure();
    // Keyboard / filter focus can shift the visual viewport after open.
    const settle = open ? window.setTimeout(measure, 120) : undefined;
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    return () => {
      if (settle !== undefined) window.clearTimeout(settle);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
    };
  }, [mounted, open]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        if (window.innerWidth < 1024) {
          triggerRef.current?.focus();
        }
      }
      return;
    }
    wasOpenRef.current = true;
    const t = window.setTimeout(() => filterRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === "Tab") {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const focusable = sheet.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const filtering = filter.trim().length > 0;

  const rows = useMemo<SheetRow[]>(() => {
    const q = filter.trim().toLowerCase();
    const out: SheetRow[] = [];
    for (const s of tocSections) {
      const subs = tocSubsections[s.id] ?? [];
      if (subs.length === 0) {
        if (!q || s.label.toLowerCase().includes(q)) {
          out.push({ kind: "item", id: s.id, label: s.label });
        }
        continue;
      }
      const allChildren = subs.map((label) => ({ id: subSlug(label), label }));
      if (!q) {
        out.push({ kind: "group", id: s.id, label: s.label, children: allChildren });
        continue;
      }
      const sectionHit = s.label.toLowerCase().includes(q);
      const children = sectionHit
        ? allChildren
        : allChildren.filter((c) => c.label.toLowerCase().includes(q));
      if (sectionHit || children.length > 0) {
        out.push({ kind: "group", id: s.id, label: s.label, children });
      }
    }
    return out;
  }, [filter]);

  const close = () => setOpen(false);
  const openMenu = () => setOpen(true);

  const selectLeaf = (id: string) => {
    close();
    window.setTimeout(() => onSelect(id), 0);
  };

  const floatingToggle = mounted
    ? createPortal(
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={
            open
              ? "Close section menu"
              : `Open section menu. Current: ${activeLabel}`
          }
          className={clsx(
            // SpecButton tertiary icon · md: size-10, rounded-xl, translucent wash
            "fixed z-[70] flex items-center justify-center overflow-visible rounded-xl bg-transparent text-zinc-500",
            "transition-colors duration-200 hover:bg-zinc-900/5 hover:text-zinc-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
            "lg:hidden",
            MORPH_CONTROL_BOX,
          )}
          // Position via style (not FM animate) so opacity can’t stick at 0.
          style={{
            top: togglePos?.top ?? 0,
            left: togglePos?.left ?? 0,
            opacity: togglePos ? 1 : 0,
            pointerEvents: togglePos ? "auto" : "none",
          }}
        >
          <ChevronCloseMorph open={open} />
        </button>,
        document.body,
      )
    : null;

  const sheet =
    open && mounted
      ? createPortal(
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Design System sections"
            className="fixed inset-0 z-[60] flex flex-col bg-white animate-in fade-in duration-200 lg:hidden"
          >
            {/*
              Mirror sticky bar chrome (pt-8 pb-6 / mid:pt-10 + h-8/h-10 +
              pr-5 md slot) so the reserved close slot sits under the floating
              control. pt-8 matches the home seal (PageHeader pt-8); mid:pt-10
              tracks the sticky bar when the seal grows. pl-2.5 = FieldShell
              muted px-1 + FieldLeadingIcon ml-1.5 so the title lines up with
              the Filter magnifier’s left edge.
            */}
            <div className="px-5 pt-8 pb-6 mid:pt-10">
              <div className="flex h-8 w-full items-center overflow-visible pl-2.5">
                <div className="flex h-10 w-full items-center gap-3 overflow-visible">
                  <h2 className="min-w-0 flex-1 overflow-visible text-lg font-medium leading-normal tracking-wide text-zinc-900">
                    Design System
                  </h2>
                  <span ref={sheetSlotRef} className={MORPH_SLOT} aria-hidden />
                </div>
              </div>
            </div>

            <div className="px-5 pb-3">
              <FieldShell tone="muted" className="gap-2.5">
                <FieldLeadingIcon className="!text-zinc-500">
                  <SearchMagnifierIcon />
                </FieldLeadingIcon>
                <FieldInput
                  ref={filterRef}
                  type="text"
                  inputMode="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Filter sections"
                  className="pr-3 font-medium tracking-[0.01em] text-zinc-800 placeholder:text-zinc-500"
                />
              </FieldShell>
            </div>

            <div
              role="listbox"
              aria-label="Sections"
              className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {rows.length === 0 ? (
                <p className="px-3 py-6 text-base text-zinc-500">No matching sections</p>
              ) : (
                <ul className="flex flex-col gap-px py-1">
                  {rows.map((row) => {
                    if (row.kind === "item") {
                      const active = activeId === row.id;
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => selectLeaf(row.id)}
                            className={SHEET_ROW}
                          >
                            <span className={LEADING_ICON_SLOT} aria-hidden />
                            <span
                              className={clsx(
                                "text-base font-medium tracking-wide leading-5 transition-colors duration-200",
                                active
                                  ? "text-blue-500"
                                  : "text-zinc-500 hover:text-zinc-600",
                              )}
                            >
                              {row.label}
                            </span>
                          </button>
                        </li>
                      );
                    }

                    const groupActive = activeSection === row.id;
                    const expanded = filtering || expandedSection === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => {
                            if (!filtering) onToggleExpand(row.id);
                          }}
                          className={SHEET_ROW}
                        >
                          <Chevron
                            direction="right"
                            size={iconSize("toolbar")}
                            className={clsx(
                              "shrink-0 transition-transform duration-200 ease-out",
                              expanded ? "rotate-90 text-zinc-500" : "text-zinc-400",
                            )}
                          />
                          <span
                            className={clsx(
                              "text-base font-medium tracking-wide leading-5 transition-colors duration-200",
                              // Open/active group one step darker than resting toggles.
                              groupActive || expanded
                                ? "text-zinc-600"
                                : "text-zinc-500 hover:text-zinc-600",
                            )}
                          >
                            {row.label}
                          </span>
                        </button>
                        <div
                          className={clsx(
                            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                            expanded
                              ? "grid-rows-[1fr] opacity-100"
                              : "pointer-events-none grid-rows-[0fr] opacity-0",
                          )}
                          aria-hidden={!expanded}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <ul className="flex flex-col gap-px pb-1 pt-0.5">
                              {row.children.map((child) => {
                                const active = activeId === child.id;
                                return (
                                  <li key={child.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={active}
                                      onClick={() => selectLeaf(child.id)}
                                      className={SHEET_ROW}
                                    >
                                      {/* Same chevron column as group headers so labels share one left edge. */}
                                      <span className={LEADING_ICON_SLOT} aria-hidden />
                                      <span
                                        className={clsx(
                                          "text-base font-medium tracking-wide leading-5 transition-colors duration-200",
                                          active
                                            ? "text-blue-500"
                                            : "text-zinc-400 hover:text-zinc-500",
                                        )}
                                      >
                                        {child.label}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {/*
        Outer h-8 matches the mobile seal hit target (size-8). Full-width
        inner button (h-10) spans the bar so the morph slot isn’t clipped by
        the nav’s pr-5 — Overview + chevron share the seal’s vertical midline.
        leading-normal keeps descenders (e.g. “g”) from clipping under truncate.
      */}
      <div className="flex h-8 w-full items-center overflow-visible">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Current section: ${activeLabel}. Open section menu.`}
          onClick={openMenu}
          className="flex h-10 w-full min-w-0 items-center gap-3 overflow-visible text-left text-base font-medium leading-normal tracking-wide text-zinc-900 transition-colors duration-200"
        >
          <span className="min-w-0 flex-1 truncate">{activeLabel}</span>
          <span ref={barSlotRef} className={MORPH_SLOT} aria-hidden />
        </button>
      </div>
      {floatingToggle}
      {sheet}
    </>
  );
}

function sectionHasSubs(id: string) {
  return (tocSubsections[id] ?? []).length > 0;
}

/** Sticky offset for the desktop TOC rail while the fixed logo is visible (top-28). */
const TOC_STICKY_TOP_PX = 112;
/** Sticky offset once the logo is hidden near the footer — no reserved clearance. */
const TOC_STICKY_TOP_COLLAPSED_PX = 0;

function replaceDesignSystemPath(sectionId: string) {
  const nextPath = pathForSectionId(sectionId);
  if (typeof window === "undefined") return;
  if (window.location.pathname === nextPath) return;
  window.history.replaceState(null, "", nextPath);
}

export default function SystemPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>(tocSections[0].id);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [initialPathResolved, setInitialPathResolved] = useState(false);
  // Sticky expand: only switch which group is open when a *grouped* section
  // becomes active. Flat sections (Overview, Shadows) leave the prior group
  // open so scroll-spy boundary flicker can't thrash open/close animations.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Sticky-until-footer: TOC sticks until the footer would collide, then docks.
  // Logo stays position:fixed (reliable hit target). On lg+ it hides once the
  // footer enters the viewport so only the footer brand shows near the bottom;
  // on mobile it stays top-left at all times.
  const zoneRef = useRef<HTMLDivElement>(null);
  const mobileStickySentinelRef = useRef<HTMLDivElement>(null);
  const desktopChromeRef = useRef<HTMLDivElement>(null);
  const [desktopDocked, setDesktopDocked] = useState(false);
  const [logoHidden, setLogoHidden] = useState(false);
  /** True when the mobile section bar is stuck and overlapping content below. */
  const [mobileNavStuck, setMobileNavStuck] = useState(false);
  // Where the seal returns — Art / About / Work. "/" until client reads the
  // doorway marker (avoids SSR/sessionStorage hydration mismatch).
  const [returnHref, setReturnHref] = useState("/");

  // Logo doorway + route entry: bare routes land at the top; section routes
  // wait for their (possibly dynamic) section before scrolling.
  // Prefetch + warm the return tab immediately — including `/` (previously
  // skipped, which made DS → Work feel cold every time).
  // Do NOT clearBlueprintDoorwaySticky here — unmount must leave the mark for
  // the destination seal so it stays resting while the pointer hasn't moved.
  useEffect(() => {
    const href = getDoorwayReturnPath();
    setReturnHref(href);
    router.prefetch(href);
    warmDoorwayReturn(href);

    const parts = window.location.pathname
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean);
    const slug = parts[0] === "design-system" ? parts[1] : undefined;

    if (!slug) {
      window.scrollTo(0, 0);
      setInitialPathResolved(true);
      return;
    }

    const sectionId = sectionIdFromPathSlug(slug);
    if (!sectionId) {
      window.history.replaceState(null, "", DESIGN_SYSTEM_BASE_PATH);
      setActiveSection(tocSections[0].id);
      setActiveSub(null);
      window.scrollTo(0, 0);
      setInitialPathResolved(true);
      return;
    }

    setActiveSection(sectionId);
    setActiveSub(null);

    let cancelled = false;
    const started = performance.now();
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        setInitialPathResolved(true);
        return;
      }
      if (performance.now() - started > 2000) {
        setInitialPathResolved(true);
        return;
      }
      requestAnimationFrame(tryScroll);
    };
    tryScroll();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Mobile sticky bar: show bottom hairline only once the bar is stuck
  // (sentinel above it has scrolled out of view → content passes underneath).
  useEffect(() => {
    const sentinel = mobileStickySentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setMobileNavStuck(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // Capture-phase doorway-back navigation. Next/Link soft-nav can miss while
  // the blueprint morph re-renders mid-click; a document capture listener
  // always sees the gesture (and still respects cmd/ctrl-click via early return).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.("a[data-blueprint-doorway-back]");
      if (!a) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (getComputedStyle(a).pointerEvents === "none") return;
      e.preventDefault();
      const href = getDoorwayReturnPath();
      // Kick module load before push so we don't wait on a cold HomePageClient.
      warmDoorwayReturn(href);
      markBlueprintDoorwayNav();

      // Section paths use history.replaceState so SystemPage stays mounted
      // while scrolling. That desyncs the App Router from the browser URL, and
      // soft push then no-ops — only scrollTo(0) ran, so a scrolled seal needed
      // two clicks (first: jump to DS top; second: actually leave). Hard-assign
      // from a section path leaves in one gesture; warmed chunks still hit cache.
      const onSectionPath = window.location.pathname.startsWith(
        `${DESIGN_SYSTEM_BASE_PATH}/`,
      );
      if (onSectionPath) {
        window.location.assign(href);
        return;
      }

      window.scrollTo(0, 0);
      router.push(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    let raf = 0;
    const update = () => {
      const footer = zone.nextElementSibling as HTMLElement | null;
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;

      // Desktop only: hide as soon as any part of the footer is on-screen.
      // Mobile keeps the seal fixed top-left even over the footer.
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const nextLogoHidden = isDesktop && footerTop < window.innerHeight;
      setLogoHidden((prev) => (prev === nextLogoHidden ? prev : nextLogoHidden));

      const desktop = desktopChromeRef.current;
      if (desktop) {
        // Dock when the sticky TOC's bottom would cross the footer top.
        // Use the current logo visibility state to match the actual sticky top
        // (which follows logoHidden with a 200ms transition).
        const stickyTop = logoHidden
          ? TOC_STICKY_TOP_COLLAPSED_PX
          : TOC_STICKY_TOP_PX;
        const next = footerTop <= stickyTop + desktop.offsetHeight;
        setDesktopDocked((prev) => (prev === next ? prev : next));
      }
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    const footer = zone.nextElementSibling;
    const io =
      footer &&
      new IntersectionObserver(onScrollOrResize, {
        root: null,
        threshold: [0, 0.01, 0.1, 1],
      });
    if (footer && io) io.observe(footer);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      io?.disconnect();
    };
  }, [logoHidden]);

  // Flat, document-ordered list of every scroll anchor (sections + subheadings).
  const anchors = useMemo(() => {
    const list: { id: string; section: string; isSection: boolean }[] = [];
    for (const s of tocSections) {
      list.push({ id: s.id, section: s.id, isSection: true });
      for (const label of tocSubsections[s.id] ?? []) {
        list.push({ id: subSlug(label), section: s.id, isSection: false });
      }
    }
    return list;
  }, []);

  const subToSection = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of anchors) if (!a.isSection) map[a.id] = a.section;
    return map;
  }, [anchors]);

  useEffect(() => {
    if (sectionHasSubs(activeSection)) {
      setExpandedSection(activeSection);
    }
  }, [activeSection]);

  // Each section becomes an expandable group of its subheadings; sections with
  // none (Overview, Shadows) stay flat items.
  const navNodes = useMemo<SidebarNode[]>(
    () =>
      tocSections.map((s) => {
        const subs = tocSubsections[s.id] ?? [];
        if (subs.length === 0) {
          return { kind: "item", id: s.id, label: s.label };
        }
        return {
          kind: "group",
          id: s.id,
          label: s.label,
          active: activeSection === s.id,
          expanded: expandedSection === s.id,
          children: subs.map((label) => ({ id: subSlug(label), label })),
        };
      }),
    [activeSection, expandedSection]
  );

  // Scroll-spy: last anchor whose top crossed the reference line. rAF-coalesced
  // and equality-guarded so boundary jitter doesn't re-render / re-expand.
  useEffect(() => {
    if (!initialPathResolved) return;

    const LINE = 140;
    let raf = 0;
    let lastSection = tocSections[0].id;
    let lastSub: string | null = null;

    const compute = () => {
      let curSection = tocSections[0].id;
      let curSub: string | null = null;
      for (const a of anchors) {
        const el = document.getElementById(a.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top > LINE) break;
        if (a.isSection) {
          curSection = a.section;
          curSub = null;
        } else {
          curSection = a.section;
          curSub = a.id;
        }
      }
      if (curSection === lastSection && curSub === lastSub) return;
      lastSection = curSection;
      lastSub = curSub;
      setActiveSection(curSection);
      setActiveSub(curSub);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [anchors, initialPathResolved]);

  const activeId = activeSub ?? activeSection;

  useEffect(() => {
    if (!initialPathResolved) return;
    replaceDesignSystemPath(activeSection);
  }, [activeSection, initialPathResolved]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (subToSection[id]) {
      const parent = subToSection[id];
      setActiveSection(parent);
      setActiveSub(id);
      replaceDesignSystemPath(parent);
    } else {
      setActiveSection(id);
      setActiveSub(null);
      replaceDesignSystemPath(id);
    }
  };

  return (
    <div className="design-system-page min-h-dvh bg-white font-['Michelle',sans-serif] text-base text-zinc-500">
      <style>{`
        .design-system-page code,
        .design-system-page .font-mono {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          letter-spacing: -0.02em;
        }
      `}</style>

      {/*
        Fixed logo doorway — always a real hit target above body::before (z-40)
        and the mobile section nav. On lg+ hides near the footer so it can't
        cover the footer brand; on mobile stays top-left at all times.
      */}
      <Link
        href={returnHref}
        prefetch
        data-blueprint-doorway-back=""
        aria-label={doorwayReturnLabel(returnHref)}
        aria-hidden={logoHidden}
        tabIndex={logoHidden ? -1 : undefined}
        onMouseEnter={() => {
          router.prefetch(returnHref);
          warmDoorwayReturn(returnHref);
        }}
        onFocus={() => {
          router.prefetch(returnHref);
          warmDoorwayReturn(returnHref);
        }}
        onTouchStart={() => {
          router.prefetch(returnHref);
          warmDoorwayReturn(returnHref);
        }}
        onPointerDown={() => {
          router.prefetch(returnHref);
          warmDoorwayReturn(returnHref);
        }}
        className={`group fixed left-6 top-8 z-50 size-8 overflow-visible transition-[opacity,transform] duration-200 ease-out [@media(hover:hover)]:hover:scale-[1.02] active:scale-95 mid:left-16 mid:size-11 ${
          logoHidden ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <BlueprintLogo mode="always" />
        <span className="sr-only">Michelle Liu</span>
      </Link>

      {/*
        Content zone above the footer. TOC sticks until the footer would
        collide, then docks to the zone bottom so it can't cover the footer.
      */}
      <div ref={zoneRef} className="relative">
        {/*
          Mobile section menu — shares the seal's top + height (top-8 / size-8,
          mid: size-11 at left-16) so the Overview + chevron band centers on the
          seal and matches the home red seal (PageHeader pt-8). Inner row stays
          h-10 for the morph control and overflows ±4px inside that band.
          pl-18 / mid:pl-32 clears the seal; pt-8 pb-4 matches the sheet header
          chrome on small screens. mid:pt-10 mid:pb-6 recenters the h-8 band on
          the larger mid seal. Bottom hairline only when stuck (sentinel leaves
          the viewport).
        */}
        <div
          ref={mobileStickySentinelRef}
          className="h-px w-full lg:hidden"
          aria-hidden
        />
        <nav
          aria-label="Sections"
          className={clsx(
            "sticky top-0 z-40 bg-white/90 pt-8 pb-4 pl-18 pr-5 backdrop-blur-md transition-[border-color] duration-200 mid:pt-10 mid:pb-6 mid:pl-32 lg:hidden",
            mobileNavStuck ? "border-b border-zinc-100" : "border-b border-transparent",
          )}
        >
          <MobileSectionMenu
            activeSection={activeSection}
            activeId={activeId}
            expandedSection={expandedSection}
            onToggleExpand={(id) =>
              setExpandedSection((prev) => (prev === id ? null : id))
            }
            onSelect={scrollTo}
          />
        </nav>

        {/*
          Desktop: main is centered in the viewport (max-w-[720px] mx-auto),
          matching Liveline-style equal gutters. TOC is absolute in the left
          gutter so it does not push main off-center. Inner chrome stays sticky
          (top-28 clears fixed logo; top-0 when logo hides) and docks to the
          zone bottom when the footer would collide.
        */}
        <div className="relative px-6 pt-24 pb-16 mid:pl-32 mid:pr-16 lg:px-16 lg:pt-28">
          {/*
            Absolute left gutter: height comes from main (in-flow). Sticky
            chrome needs a tall containing block — inset-y-0 matches main.
            mid:pl-32 matches sticky nav (seal clearance) so section content
            lines up with the sticky title between mid and lg; lg:px-16 restores
            symmetric gutters once the desktop TOC takes over.
          */}
          <aside className="pointer-events-none absolute inset-y-0 left-6 hidden w-44 mid:left-16 lg:left-16 lg:block">
            <div
              ref={desktopChromeRef}
              className={`pointer-events-auto z-50 w-44 transition-[top] duration-200 ease-out ${
                desktopDocked
                  ? "absolute bottom-0 left-0"
                  : logoHidden
                    ? "sticky top-0"
                    : "sticky top-28"
              }`}
            >
              <div className="animate-fade-up">
                <Sidebar nodes={navNodes} activeId={activeId} onSelect={scrollTo} />
              </div>
            </div>
          </aside>

          <main className="relative mx-auto min-w-0 w-full max-w-[720px]">
            {[
              /* Intro */
              <section key="intro" id="intro" className="scroll-mt-24 pb-8">
                <h1 className="max-w-3xl font-['Michelle',sans-serif] text-4xl font-normal leading-normal tracking-[0.0125em] text-[#3f3f46] text-balance">
                  Design System
                </h1>
                <p className="-mt-3 font-['Michelle',sans-serif] text-4xl font-normal leading-normal tracking-[0.0125em] text-zinc-400">
                  liumichelle.com
                </p>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 text-pretty">
                  The colors, type, space, motion, and components behind
                  liumichelle.com. Specimens are built in React with Tailwind
                  CSS.
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4 text-sm text-zinc-400">
                  <span className="flex w-44 flex-col items-start gap-1">
                    <TagChip tag="canonical" />
                    Core system
                  </span>
                  <span className="flex w-44 flex-col items-start gap-1">
                    <TagChip tag="one-off" />
                    Appears once / legacy
                  </span>
                  <span className="flex w-44 flex-col items-start gap-1">
                    <TagChip tag="experiment" />
                    Specific to an experiment
                  </span>
                </div>
              </section>,

              <ColorSection key="color" />,
              <ComponentSection key="components" />,
              <IconSection key="icons" />,
              <BorderSection key="borders" />,
              <MotionSection key="motion" />,
              <ShadowSection key="shadows" />,
              <SpacingSection key="spacing" />,
              <TypographySection key="typography" />,
              <MaterialSection key="materials" />,
            ].map((block, i) => (
              <div
                key={block.key ?? i}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                {block}
              </div>
            ))}
          </main>
        </div>
      </div>

      <Footer logoVariant="blueprint" logoHref={returnHref} />
    </div>
  );
}
