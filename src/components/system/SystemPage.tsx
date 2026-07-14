"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Sidebar, { type SidebarNode } from "../Sidebar";
import BlueprintLogo from "../BlueprintLogo";
import Footer from "../Footer";
import { fadeUpStyles } from "../../styles/animations";
import { tocSections, tocSubsections, subSlug } from "./tokens";
import { clearBlueprintDoorwaySticky } from "../blueprintDoorwayNav";

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

/** Apple HIG–style pop-up button for mobile section navigation. */
function MobileSectionMenu({
  activeSection,
  onSelect,
}: {
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLabel =
    tocSections.find((s) => s.id === activeSection)?.label ?? tocSections[0].label;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current section: ${activeLabel}. Choose a section.`}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 min-w-[9.5rem] items-center justify-between gap-2 rounded-full bg-zinc-500/10 px-3.5 py-2 transition-colors"
      >
        <span className="truncate font-medium tracking-[0.01em] text-zinc-600">{activeLabel}</span>
        <svg
          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sections"
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-[min(70dvh,28rem)] min-w-[12rem] overflow-y-auto rounded-xl border border-zinc-100 bg-white py-1.5 pl-1.5 pr-1.5 shadow-elevated animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex flex-col gap-0.5">
            {tocSections.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSelect(s.id);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 items-center rounded-[10px] px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className={`font-medium tracking-[0.01em] ${
                      isActive ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {s.label}
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

function sectionHasSubs(id: string) {
  return (tocSubsections[id] ?? []).length > 0;
}

/** Sticky offset for the desktop TOC rail (top-28 — clears fixed logo). */
const TOC_STICKY_TOP_PX = 112;
/** Fixed logo bottom edge (top-8 + size-11) — hide before covering footer brand. */
const LOGO_BOTTOM_PX = 32 + 44;

export default function SystemPage() {
  const [activeSection, setActiveSection] = useState<string>(tocSections[0].id);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  // Sticky expand: only switch which group is open when a *grouped* section
  // becomes active. Flat sections (Overview, Shadows) leave the prior group
  // open so scroll-spy boundary flicker can't thrash open/close animations.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Sticky-until-footer: TOC sticks until the footer would collide, then docks.
  // Logo stays position:fixed (reliable hit target) and simply hides near footer
  // so it can't cover the footer brand link.
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

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    let raf = 0;
    const update = () => {
      const footer = zone.nextElementSibling as HTMLElement | null;
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;

      setLogoHidden((prev) => {
        const next = footerTop <= LOGO_BOTTOM_PX + 8;
        return prev === next ? prev : next;
      });

      const desktop = desktopChromeRef.current;
      if (desktop) {
        // Dock when the sticky TOC's bottom would cross the footer top.
        const next = footerTop <= TOC_STICKY_TOP_PX + desktop.offsetHeight;
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
        onClick={() => window.scrollTo(0, 0)}
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
        {/* Mobile section menu — clears fixed logo */}
        <nav
          aria-label="Sections"
          className="sticky top-0 z-40 flex items-center border-b border-zinc-100 bg-white/85 py-2 pl-16 pr-4 backdrop-blur-md lg:hidden"
        >
          <MobileSectionMenu activeSection={activeSection} onSelect={scrollTo} />
        </nav>

        {/*
          Desktop: TOC as left rail (sticky top-28 clears fixed logo, z-50 above
          body::before). Outer aside is an in-flow width spacer; inner chrome
          docks to the zone bottom when the footer would collide.
        */}
        <div className="flex items-start gap-48 px-6 pt-24 md:px-16 lg:pt-28">
          {/* self-stretch: tall containing block so sticky has a runway matching main */}
          <aside className="relative hidden w-44 shrink-0 self-stretch lg:block">
            <div
              ref={desktopChromeRef}
              className={`z-50 w-44 ${
                desktopDocked ? "absolute bottom-0 left-0" : "sticky top-28"
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
