"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import Sidebar, { type SidebarNode } from "../Sidebar";
import BlueprintLogo from "../BlueprintLogo";
import { markBlueprintDoorwayNav, clearBlueprintDoorwaySticky } from "../blueprintDoorwayNav";
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
import { fadeUpStyles } from "../../styles/animations";
import { tocSections, tocSubsections, subSlug } from "./tokens";

/** Lightweight placeholder so the DS shell (logo, TOC, intro) paints before specimens. */
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

// Light token sections — small, paint right under the intro.
const ColorSection = dynamic(() => import("./sections/ColorSection"), {
  loading: () => <SectionSkeleton />,
});
const TypographySection = dynamic(() => import("./sections/TypographySection"), {
  loading: () => <SectionSkeleton />,
});
const ShadowSection = dynamic(() => import("./sections/ShadowSection"), {
  loading: () => <SectionSkeleton />,
});
const RadiusSection = dynamic(() => import("./sections/RadiusSection"), {
  loading: () => <SectionSkeleton />,
});
const SpacingSection = dynamic(() => import("./sections/SpacingSection"), {
  loading: () => <SectionSkeleton />,
});
const BorderSection = dynamic(() => import("./sections/BorderSection"), {
  loading: () => <SectionSkeleton />,
});

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
 * Ghost icon-button hit target — SpecButton icon **md** (`size-10` / 40px).
 * Shared by sticky-bar slot, sheet close slot, and the floating morph control.
 */
const MORPH_CONTROL_BOX = "size-10";
/**
 * One glyph size for both morph states — touch (24). Close/Chevron share
 * comparable path bounds in the 24 viewBox so glyphs match optically.
 */
const MORPH_ICON = iconSize("touch");
/**
 * Optical end-align: pull the control into the `px-5`/`pr-5` gutter so the
 * glyph’s right tip lines up with the Filter field (and sticky content edge).
 * 14px ≈ (40−24)/2 box pad + (24−12)/2 Close/Chevron path inset.
 */
const MORPH_OPTICAL_END = "-mr-3.5";
const MORPH_SLOT = `${MORPH_CONTROL_BOX} shrink-0 ${MORPH_OPTICAL_END}`;
const MORPH_TRANSITION = { duration: 0.3, ease: "easeOut" } as const;

/**
 * Shared control: down-chevron morphs into Close X (and reverse).
 * Animates HTML wrappers (not SVG `<g>`) — Framer Motion’s SVG `fill-box`
 * transforms + default `overflow:hidden` can leave the chevron clipped or
 * stuck at opacity 0 after close.
 */
function ChevronCloseMorph({ open }: { open: boolean }) {
  return (
    <span
      className="relative inline-flex size-6 items-center justify-center overflow-visible"
      aria-hidden
    >
      <motion.span
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: open ? 0 : 1,
          scale: open ? 0.7 : 1,
        }}
        transition={MORPH_TRANSITION}
      >
        <Chevron direction="down" size={MORPH_ICON} />
      </motion.span>
      <motion.span
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.7,
          rotate: open ? 0 : -45,
        }}
        transition={MORPH_TRANSITION}
      >
        <Close size={MORPH_ICON} />
      </motion.span>
    </span>
  );
}

/** Matches Chevron toolbar width so flat rows align with expandable ones. */
const LEADING_ICON_SLOT = "w-5 shrink-0";

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

  // One floating toggle — always tracks the sticky-bar slot so open-state X
  // keeps the same top/right + md (size-10) hit box as the closed chevron.
  useLayoutEffect(() => {
    if (!mounted) return;
    const measure = () => {
      const slot = barSlotRef.current;
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      setTogglePos((prev) => {
        if (prev && prev.top === r.top && prev.left === r.left) return prev;
        return { top: r.top, left: r.left };
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
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
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={
            open
              ? "Close section menu"
              : `Open section menu. Current: ${activeLabel}`
          }
          className={clsx(
            // SpecButton ghost · icon · md: size-10, rounded-full, translucent wash
            "fixed z-[70] flex items-center justify-center rounded-full bg-transparent text-zinc-400",
            "transition-colors duration-200 hover:bg-zinc-900/5 hover:text-zinc-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
            "lg:hidden",
            MORPH_CONTROL_BOX,
          )}
          initial={false}
          animate={
            togglePos
              ? { top: togglePos.top, left: togglePos.left, opacity: 1 }
              : { top: 0, left: 0, opacity: 0 }
          }
          transition={{ duration: 0, ease: "easeOut" }}
          style={{
            // Keep pointer-events out of Motion’s opacity channel so a prior
            // style={{ opacity: 0 }} can’t stick after togglePos is measured.
            pointerEvents: togglePos ? "auto" : "none",
          }}
        >
          <ChevronCloseMorph open={open} />
        </motion.button>,
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
              Mirror sticky bar chrome (py-3 + h-8/h-10 + pr-5 md slot + optical
              -mr) so the reserved close slot sits under the floating control.
            */}
            <div className="px-5 py-3">
              <div className="flex h-8 w-full items-center overflow-visible">
                <div className="flex h-10 w-full items-center gap-3 overflow-visible">
                  <h2 className="min-w-0 flex-1 overflow-visible text-base font-medium leading-normal tracking-wide text-zinc-800">
                    Design System
                  </h2>
                  <span className={MORPH_SLOT} aria-hidden />
                </div>
              </div>
            </div>

            <div className="px-5 pb-3">
              <FieldShell tone="muted" className="gap-2">
                <FieldLeadingIcon>
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
                  className="pr-3 font-medium tracking-[0.01em] text-zinc-700"
                />
              </FieldShell>
            </div>

            <div
              role="listbox"
              aria-label="Sections"
              className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {rows.length === 0 ? (
                <p className="px-3 py-6 text-sm text-zinc-400">No matching sections</p>
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
                            className="flex w-full min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-zinc-50"
                          >
                            <span className={LEADING_ICON_SLOT} aria-hidden />
                            <span
                              className={clsx(
                                "text-base font-medium tracking-wide leading-5 transition-colors duration-200",
                                active
                                  ? "text-blue-500"
                                  : "text-zinc-400 hover:text-zinc-500",
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
                          className="flex w-full min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-zinc-50"
                        >
                          <Chevron
                            direction="right"
                            size={iconSize("toolbar")}
                            className={clsx(
                              "shrink-0 transition-transform duration-200 ease-out",
                              expanded ? "rotate-90 text-zinc-400" : "text-zinc-300",
                            )}
                          />
                          <span
                            className={clsx(
                              "text-base font-medium tracking-wide leading-5 transition-colors duration-200",
                              groupActive
                                ? "text-zinc-500"
                                : "text-zinc-400 hover:text-zinc-500",
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
                                      className="flex w-full min-h-11 items-center gap-2.5 rounded-lg py-2.5 pl-[2.375rem] pr-3 text-left transition-colors duration-200 hover:bg-zinc-50"
                                    >
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
        Outer h-8 matches the mobile seal hit target (size-8). Inner h-10
        matches the morph control and centers within that band so Overview +
        chevron share the seal's vertical midline. leading-normal keeps
        descenders (e.g. “g”) from clipping under truncate.
      */}
      <div className="flex h-8 w-full items-center overflow-visible">
        <div className="flex h-10 w-full items-center gap-3 overflow-visible">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Current section: ${activeLabel}. Open section menu.`}
            onClick={openMenu}
            className="min-w-0 flex-1 truncate text-left text-base font-medium leading-normal tracking-wide text-zinc-800 transition-colors duration-200"
          >
            {activeLabel}
          </button>
          <span ref={barSlotRef} className={MORPH_SLOT} aria-hidden />
        </div>
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

export default function SystemPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>(tocSections[0].id);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  // Sticky expand: only switch which group is open when a *grouped* section
  // becomes active. Flat sections (Overview, Shadows) leave the prior group
  // open so scroll-spy boundary flicker can't thrash open/close animations.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Sticky-until-footer: TOC sticks until the footer would collide, then docks.
  // Logo stays position:fixed (reliable hit target) and hides once the footer
  // enters the viewport so only the footer brand shows near the bottom.
  const zoneRef = useRef<HTMLDivElement>(null);
  const mobileStickySentinelRef = useRef<HTMLDivElement>(null);
  const desktopChromeRef = useRef<HTMLDivElement>(null);
  const [desktopDocked, setDesktopDocked] = useState(false);
  const [logoHidden, setLogoHidden] = useState(false);
  /** True when the mobile section bar is stuck and overlapping content below. */
  const [mobileNavStuck, setMobileNavStuck] = useState(false);

  // Logo doorway + route entry: always land at the top of the DS.
  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      clearBlueprintDoorwaySticky();
    };
  }, []);

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

  // Capture-phase home navigation. Next/Link soft-nav can miss while the
  // blueprint morph re-renders mid-click; a document capture listener always
  // sees the gesture (and still respects cmd/ctrl-click via early return).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.('a[aria-label="Back to home"]');
      if (!a) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (getComputedStyle(a).pointerEvents === "none") return;
      e.preventDefault();
      markBlueprintDoorwayNav();
      window.scrollTo(0, 0);
      router.push("/");
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

      // Hide as soon as any part of the footer is on-screen. A collision-only
      // threshold (~logo bottom) left both logos visible whenever the footer
      // brand sat lower in a tall viewport.
      const nextLogoHidden = footerTop < window.innerHeight;
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
  }, [anchors]);

  const activeId = activeSub ?? activeSection;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (subToSection[id]) {
      setActiveSection(subToSection[id]);
      setActiveSub(id);
    } else {
      setActiveSection(id);
      setActiveSub(null);
    }
  };

  return (
    <div className="min-h-dvh bg-white font-['Michelle',sans-serif] text-base text-zinc-500">
      <style>{fadeUpStyles}</style>

      {/*
        Fixed logo doorway — always a real hit target above body::before (z-40)
        and the mobile section nav. Hides near the footer so it can't cover the
        footer brand (which also links home).
      */}
      <Link
        href="/"
        aria-label="Back to home"
        aria-hidden={logoHidden}
        tabIndex={logoHidden ? -1 : undefined}
        className={`group fixed left-6 top-3 z-50 size-8 overflow-visible transition-[opacity,transform] duration-200 ease-out [@media(hover:hover)]:hover:scale-[1.02] active:scale-95 md:left-16 md:top-8 md:size-11 ${
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
          Mobile section menu — shares the seal's top + height (top-3 / size-8)
          so the Overview + chevron band centers on the seal. Inner row stays
          h-10 for the morph control and overflows ±4px inside that band.
          pl-18 clears the seal; py-3 matches the sheet header chrome.
          Bottom hairline only when stuck (sentinel leaves the viewport).
        */}
        <div
          ref={mobileStickySentinelRef}
          className="h-px w-full lg:hidden"
          aria-hidden
        />
        <nav
          aria-label="Sections"
          className={clsx(
            "sticky top-0 z-40 bg-white/90 py-3 pl-18 pr-5 backdrop-blur-md transition-[border-color] duration-200 lg:hidden",
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
          Desktop: TOC as left rail (sticky top-28 clears fixed logo, z-50 above
          body::before). When the logo hides near the footer, collapse to top-0
          so Overview isn't left with an empty clearance band. Outer aside is an
          in-flow width spacer; inner chrome docks to the zone bottom when the
          footer would collide.
        */}
        <div className="flex items-start gap-48 px-6 pt-24 md:px-16 lg:pt-28">
          {/* self-stretch: tall containing block so sticky has a runway matching main */}
          <aside className="relative hidden w-44 shrink-0 self-stretch lg:block">
            <div
              ref={desktopChromeRef}
              className={`z-50 w-44 transition-[top] duration-200 ease-out ${
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

          <main className="min-w-0 w-full max-w-[720px] pb-8">
            {[
              /* Intro */
              <section key="intro" id="intro" className="scroll-mt-24 pb-8">
                <h1 className="max-w-3xl font-['Michelle',sans-serif] text-4xl font-medium leading-normal tracking-[0.0125em] text-[#3f3f46] text-balance">
                  Design System
                </h1>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-1.5 py-0.5 text-sm font-medium text-zinc-600">
                      Canonical
                    </span>
                    Core system
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-lg bg-amber-100 px-1.5 py-0.5 text-sm font-medium text-amber-600">
                      One-off
                    </span>
                    Appears once / legacy
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-600">
                      Experiment
                    </span>
                    Specific to an experiment
                  </span>
                </div>
              </section>,

              <ColorSection key="color" />,
              <TypographySection key="typography" />,
              <ShadowSection key="shadows" />,
              <SpacingSection key="spacing" />,
              <BorderSection key="borders" />,
              <RadiusSection key="radius" />,
              <MotionSection key="motion" />,
              <IconSection key="icons" />,
              <ComponentSection key="components" />,
              <MaterialSection key="materials" />,
            ].map((block, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                {block}
              </div>
            ))}
          </main>
        </div>
      </div>

      <Footer logoVariant="blueprint" />
    </div>
  );
}
