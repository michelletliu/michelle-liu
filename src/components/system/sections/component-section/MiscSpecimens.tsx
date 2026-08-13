"use client";

import { useState } from "react";
import { FilterDropdown } from "../../../shared/FilterDropdown";
import { FilterPills } from "../../../shared/FilterPills";
import { HorizontalLine } from "../../../shared/HorizontalLine";
import { SegmentedPill } from "../../../shared/SegmentedPill";
import { SubLabel, TagChip } from "../../primitives";
import type { Tag } from "../../tokens";
import {
  SPAN_MID,
  SPAN_WIDE,
  Specimen,
  SpecimenGrid,
} from "./ComponentSpecimen";

const FILTER_PILL_OPTIONS = [
  { value: "books", label: "★ Books", count: 5 },
  { value: "2026", label: "2026", count: 10 },
  { value: "2025", label: "2025", count: 13 },
];

const SEGMENTED_PILL_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

const LIBRARY_OPTIONS = [
  { value: "favorites", label: "favorites", count: 8 },
  { value: "all", label: "all", count: 32 },
  { value: "2026", label: "2026", count: 11 },
  { value: "2025", label: "2025", count: 13 },
];

const TAG_BADGE_TAGS: Tag[] = ["canonical", "one-off", "experiment"];

export function CardSpecimens() {
  return (
    <>
      <SubLabel>Cards</SubLabel>
      <SpecimenGrid>
        <Specimen label="Quote card" span={SPAN_WIDE}>
          <button
            type="button"
            className="quote-card-demo flex h-24 w-48 cursor-pointer flex-col justify-center rounded-3xl border border-zinc-100 bg-white px-4 shadow-default shadow-default-hover transition-transform duration-200 hover:scale-[1.01]"
          >
            <span className="text-2xl tracking-[0.01em] text-zinc-700">
              “delightful.”
            </span>
          </button>
        </Specimen>

        <Specimen label="Book cover" span={SPAN_WIDE}>
          <button
            type="button"
            className="book-cover-demo h-28 w-20 cursor-pointer rounded-sm bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-media transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]"
            aria-label="Book cover"
          />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}

export function DividerSpecimens() {
  return (
    <>
      <SubLabel note="1px zinc-100 hairline.">Dividers</SubLabel>
      <SpecimenGrid>
        <Specimen label="HorizontalLine · Default" span={SPAN_WIDE}>
          <div className="divider-demo flex w-full max-w-sm flex-col gap-3">
            <p className="text-sm text-zinc-500">Above</p>
            <HorizontalLine />
            <p className="text-sm text-zinc-500">Below</p>
          </div>
        </Specimen>
      </SpecimenGrid>
    </>
  );
}

export function LoaderSpecimens() {
  return (
    <>
      <SubLabel>Loaders</SubLabel>
      <SpecimenGrid>
        <Specimen label="Spinner" span={SPAN_MID}>
          <div className="spinner-demo size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="spinner-demo size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="spinner-demo size-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-400" />
        </Specimen>

        <Specimen label="Shimmer skeleton" span={SPAN_MID}>
          <div className="shimmer-demo flex flex-col gap-2">
            <div className="animate-shimmer h-4 w-40 rounded-md" />
            <div className="animate-shimmer h-4 w-28 rounded-md" />
            <div className="animate-shimmer h-16 w-40 rounded-xl" />
          </div>
        </Specimen>

        <Specimen label="Loading dots" span={SPAN_MID}>
          <p className="loading-dots-demo text-sm text-zinc-600">
            Loading
            <span className="film-dot" style={{ animationDelay: "0s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.4s" }}>.</span>
          </p>
        </Specimen>
      </SpecimenGrid>
    </>
  );
}

function ProjectTitlePill({
  suffix,
  suffixClassName,
}: {
  suffix: string;
  suffixClassName: string;
}) {
  return (
    <div className="project-title-pill flex items-center justify-center rounded-full border border-zinc-100 bg-white px-3 pb-[4.8px] pt-[5px]">
      <p className="font-['Michelle',sans-serif] text-base font-medium leading-snug tracking-[0.005em] text-zinc-900">
        Polaroid <span className={suffixClassName}>• {suffix}</span>
      </p>
    </div>
  );
}

function ProjectTitlePills() {
  return (
    <div className="project-title-pill-demo flex flex-wrap items-end justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill suffix="2024" suffixClassName="text-zinc-400" />
        <span className="text-xs text-zinc-400">Default</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill
          suffix="Try It Out!"
          suffixClassName="text-blue-400"
        />
        <span className="text-xs text-zinc-400">Hover</span>
      </div>
    </div>
  );
}

function TagBadges() {
  return (
    <div className="tag-badges-demo flex flex-wrap items-center justify-center gap-2">
      {TAG_BADGE_TAGS.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  );
}

function FilterPillDemo() {
  const [active, setActive] = useState("books");
  return (
    <FilterPills
      options={FILTER_PILL_OPTIONS}
      value={active}
      onChange={setActive}
      className="filter-pill-demo justify-center"
    />
  );
}

function SegmentedPillDemo() {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  return (
    <SegmentedPill
      aria-label="Period"
      options={SEGMENTED_PILL_OPTIONS}
      value={period}
      onChange={setPeriod}
      className="segmented-pill-demo"
    />
  );
}

function FilterDropdownDemo() {
  const [active, setActive] = useState("2026");
  return (
    <div className="filter-dropdown-demo">
      <FilterDropdown
        options={LIBRARY_OPTIONS}
        activeValue={active}
        onChange={setActive}
        defaultOpen
      />
    </div>
  );
}

export function PillSpecimens() {
  return (
    <>
      <SubLabel>Pills</SubLabel>
      <SpecimenGrid>
        <Specimen label="Project title pill" span={SPAN_WIDE}>
          <ProjectTitlePills />
        </Specimen>
        <Specimen label="Tag badges" span={SPAN_WIDE}>
          <TagBadges />
        </Specimen>
        <Specimen label="Filter pill" span={SPAN_WIDE}>
          <FilterPillDemo />
        </Specimen>
        <Specimen label="Segmented pill" span={SPAN_WIDE}>
          <SegmentedPillDemo />
        </Specimen>
        <Specimen label="Filter dropdown" span={SPAN_WIDE}>
          <FilterDropdownDemo />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
