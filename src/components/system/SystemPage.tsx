"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar, { type SidebarNode } from "../Sidebar";
import BlueprintLogo from "../BlueprintLogo";
import {
  clearBlueprintDoorwaySticky,
  markBlueprintDoorwayNav,
} from "../blueprintDoorwayNav";
import Footer from "../Footer";
import { Chevron, ChevronRightIcon } from "../Chevron";
import { Close } from "../Close";
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

function SearchMagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M16.5 16.5L20 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Mobile section picker — HIG-inspired local bar + full-screen sheet.
 * Uses site zinc neutrals, blue active accent, stroke-1.5 icons, and existing motion.
 */
function MobileSectionMenu({
  activeSection,
  onSelect,
}: {
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const activeLabel =
    tocSections.find((s) => s.id === activeSection)?.label ?? tocSections[0].label;

  useScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tocSections;
    return tocSections.filter((s) => s.label.toLowerCase().includes(q));
  }, [filter]);

  const close = () => setOpen(false);

  const sheet =
    open && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Design System sections"
            className="fixed inset-0 z-[60] flex flex-col bg-white animate-in fade-in duration-200 lg:hidden"
          >
            {/* Header: page title + close */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
              <h2 className="min-w-0 truncate text-lg font-medium tracking-[0.01em] text-zinc-900">
                Design System
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close section menu"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <Close size="20px" />
              </button>
            </div>

            {/* Filter field */}
            <div className="px-5 pb-3">
              <label className="relative flex items-center">
                <span className="pointer-events-none absolute left-3.5 text-zinc-400">
                  <SearchMagnifierIcon className="size-4" />
                </span>
                <input
                  ref={filterRef}
                  type="text"
                  inputMode="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-full border-0 bg-zinc-100 py-2.5 pl-10 pr-4 text-base font-medium tracking-[0.01em] text-zinc-700 placeholder:text-zinc-400 outline-none transition-colors duration-200 focus:bg-zinc-100/80"
                />
              </label>
            </div>

            {/* Section list */}
            <div
              role="listbox"
              aria-label="Sections"
              className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-100 px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {filteredSections.length === 0 ? (
                <p className="px-3 py-6 text-sm text-zinc-400">No matching sections</p>
              ) : (
                <ul className="py-1">
                  {filteredSections.map((s) => {
                    const isActive = activeSection === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            onSelect(s.id);
                            close();
                          }}
                          className="flex w-full min-h-12 items-center gap-2.5 rounded-lg px-3 py-3 text-left transition-colors duration-200 hover:bg-zinc-50"
                        >
                          <ChevronRightIcon
                            className={`size-4 shrink-0 ${
                              isActive ? "text-blue-500" : "text-zinc-300"
                            }`}
                          />
                          <span
                            className={`font-medium tracking-[0.01em] ${
                              isActive ? "text-blue-500" : "text-zinc-800"
                            }`}
                          >
                            {s.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Current section: ${activeLabel}. Open section menu.`}
        onClick={() => setOpen(true)}
        className="flex w-full min-h-12 items-center justify-between gap-3 bg-transparent py-3 text-left transition-colors duration-200"
      >
        <span className="truncate font-medium tracking-[0.01em] text-zinc-800">
          {activeLabel}
        </span>
        <Chevron
          direction="down"
          className="size-4 shrink-0 text-zinc-400 transition-transform duration-200"
        />
      </button>
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
  const desktopChromeRef = useRef<HTMLDivElement>(null);
  const [desktopDocked, setDesktopDocked] = useState(false);
  const [logoHidden, setLogoHidden] = useState(false);

  // Logo doorway + route entry: always land at the top of the DS.
  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      clearBlueprintDoorwaySticky();
    };
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
        // Use the collapsed offset when the logo is hidden so dock math matches
        // the TOC's actual sticky top (no leftover logo clearance).
        const stickyTop = nextLogoHidden
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
  }, []);

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
        onClick={() => markBlueprintDoorwayNav()}
        className={`group fixed left-6 top-8 z-50 size-8 overflow-visible transition-[opacity,transform] duration-200 ease-out hover:scale-[1.02] active:scale-95 md:left-16 md:size-11 ${
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
          Mobile section menu — clears fixed logo (left-6 top-8 size-8).
          pl-18 clears the seal; pb-5 gives the sticky bar breathing room.
        */}
        <nav
          aria-label="Sections"
          className="sticky top-0 z-40 border-y border-zinc-200/80 bg-white/90 pl-18 pr-5 pb-1 backdrop-blur-md lg:hidden"
        >
          <MobileSectionMenu activeSection={activeSection} onSelect={scrollTo} />
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
              <MaterialSection key="materials" />,
              <MotionSection key="motion" />,
              <IconSection key="icons" />,
              <ComponentSection key="components" />,
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
