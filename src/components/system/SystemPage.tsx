"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Sidebar, { type SidebarNode } from "../Sidebar";
import BlueprintLogo from "../BlueprintLogo";
import { fadeUpStyles } from "../../styles/animations";
import { tocSections, tocSubsections, subSlug } from "./tokens";
import ColorSection from "./sections/ColorSection";
import TypographySection from "./sections/TypographySection";
import ShadowSection from "./sections/ShadowSection";
import RadiusSection from "./sections/RadiusSection";
import SpacingSection from "./sections/SpacingSection";
import BorderSection from "./sections/BorderSection";
import MaterialSection from "./sections/MaterialSection";
import MotionSection from "./sections/MotionSection";
import ComponentSection from "./sections/ComponentSection";

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
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sections"
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-[min(70dvh,28rem)] min-w-[12rem] overflow-y-auto rounded-xl border border-zinc-100 bg-white py-1.5 pl-1.5 pr-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200"
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

export default function SystemPage() {
  const [activeSection, setActiveSection] = useState<string>(tocSections[0].id);
  const [activeSub, setActiveSub] = useState<string | null>(null);

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

  // Each section becomes an expandable group of its subheadings; sections with
  // none (Overview, Shadows, Experiments) stay flat items.
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
          expanded: activeSection === s.id,
          children: subs.map((label) => ({ id: subSlug(label), label })),
        };
      }),
    [activeSection]
  );

  // Scroll-spy: the "current" anchor is the last one whose top has crossed the
  // reference line. Tracks both the active section and its active subheading.
  useEffect(() => {
    const LINE = 140;
    const onScroll = () => {
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
      setActiveSection(curSection);
      setActiveSub(curSub);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
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
      {/* Fixed logo home link */}
      <Link
        href="/"
        aria-label="Back to home"
        onClick={() => window.scrollTo(0, 0)}
        className="group fixed left-6 top-8 z-50 size-8 overflow-visible transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95 md:left-16 md:size-11"
      >
        <BlueprintLogo mode="always" />
        <span className="sr-only">Michelle Liu</span>
      </Link>

      {/* Mobile section menu — Apple HIG pop-up button; clears fixed logo */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 flex items-center border-b border-zinc-100 bg-white/85 py-2 pl-16 pr-4 backdrop-blur-md lg:hidden"
      >
        <MobileSectionMenu activeSection={activeSection} onSelect={scrollTo} />
      </nav>

      <div className="flex items-start gap-48 px-6 pt-24 md:px-16 lg:pt-28">
        {/* Sidebar TOC (desktop) */}
        <aside className="animate-fade-up sticky top-28 hidden w-44 shrink-0 flex-col self-start lg:flex">
          <Sidebar nodes={navNodes} activeId={activeId} onSelect={scrollTo} />
        </aside>

        {/* Content — each block fades up on mount, staggered like the homepage */}
        <main className="min-w-0 w-full max-w-[720px] pb-32">
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
          <RadiusSection key="radius" />,
          <SpacingSection key="spacing" />,
          <BorderSection key="borders" />,
          <MaterialSection key="materials" />,
          <MotionSection key="motion" />,
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
  );
}
