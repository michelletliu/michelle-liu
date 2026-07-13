"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar, { type SidebarNode } from "../Sidebar";
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
    <div className="min-h-dvh bg-white font-['Michelle',sans-serif] text-base text-gray-500">
      <style>{fadeUpStyles}</style>
      {/* Fixed logo home link */}
      <Link
        href="/"
        aria-label="Back to home"
        onClick={() => window.scrollTo(0, 0)}
        className="fixed left-6 top-8 z-50 transition-opacity duration-200 ease-out hover:opacity-70 md:left-16"
      >
        <img src="/logo.png" alt="Michelle Liu" className="h-8 w-8 object-contain md:h-11 md:w-11" />
      </Link>

      {/* Mobile TOC chip strip */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 flex gap-1.5 overflow-x-auto border-b border-gray-100 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden"
      >
        {tocSections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors duration-200 ${
              activeSection === s.id ? "bg-gray-100 font-medium text-gray-800" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
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
            <h1 className="max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-gray-900 text-balance">
              Design System
            </h1>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
              <span className="inline-flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium text-gray-600">
                  Canonical
                </span>
                Core system
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-sm font-medium text-amber-600">
                  One-off
                </span>
                Appears once / legacy
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-600">
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
