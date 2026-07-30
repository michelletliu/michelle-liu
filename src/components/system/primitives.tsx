"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import type { Tag } from "./tokens";
import { subSlug } from "./tokens";
import { iconSize } from "../shared/iconSizes";
import { ghostIconButtonClass } from "../shared/ghostIconButton";
import { Code } from "../icons/Code";

/**
 * Ghost icon button — sm hit target (between size-6 and md), inline glyph.
 * Used by TokenCard (and custom card shells) to reveal mono values.
 */
export function CodeToggleButton({
  pressed,
  onPressedChange,
  className = "",
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? "Hide code" : "Show code"}
      onClick={() => onPressedChange(!pressed)}
      className={clsx(
        ghostIconButtonClass("sm", "text-zinc-300"),
        "hover:text-zinc-400",
        "active:bg-zinc-900/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
        pressed && "bg-zinc-900/5 text-zinc-500",
        className,
      )}
    >
      <Code size={iconSize("sm")} />
    </button>
  );
}

/**
 * Soft gray tile behind glass / border-white/50 specimens.
 * zinc-50 → zinc-100 → zinc-200 — light tile, still enough contrast for white/50
 * and frosted glass. Keep Borders & Materials in sync.
 */
export const GLASS_SPECIMEN_BG_CLASS =
  "bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200";
/** Same stops as GLASS_SPECIMEN_BG_CLASS, for inline style={{ backgroundImage }}. */
export const GLASS_SPECIMEN_GRADIENT =
  "linear-gradient(to bottom right, #fafafa, #f4f4f5, #e4e4e7)";

/** Colored text on a tint of the same color — one entry per provenance tag. */
const tagBadge: Record<Tag, string> = {
  canonical: "bg-zinc-100 text-zinc-600",
  "one-off": "bg-amber-100 text-amber-600",
  experiment: "bg-blue-100 text-blue-600",
};

/** Provenance marker rendered as a small badge (colored label on a tint). */
export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg px-1.5 py-0.5 text-sm font-medium ${tagBadge[tag]}`}
    >
      {tag.charAt(0).toUpperCase() + tag.slice(1)}
    </span>
  );
}

export function Section({
  id,
  title,
  tag,
  children,
}: {
  id: string;
  title: string;
  /** When every token in the section shares one tag, show it beside the H2. */
  tag?: Tag;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-16 pb-4">
      <div className="mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-['Michelle',sans-serif] text-xl font-medium leading-relaxed text-zinc-900">
            {title}
          </h2>
          {tag && <TagChip tag={tag} />}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

/** Group heading used to organize entries within a section. */
export function SubLabel({
  children,
  note,
  tag,
}: {
  children: ReactNode;
  note?: string;
  /** When every token in the group shares one tag, show it beside the H3. */
  tag?: Tag;
}) {
  const id = typeof children === "string" ? subSlug(children) : undefined;
  return (
    <div id={id} className="mb-5 mt-20 scroll-mt-28 first:mt-0 first-of-type:mt-0">
      <div className="flex items-center gap-2.5">
        <h3 className="text-base font-medium leading-relaxed text-zinc-700">{children}</h3>
        {tag && <TagChip tag={tag} />}
      </div>
      {note && (
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-zinc-400 text-pretty">{note}</p>
      )}
    </div>
  );
}

export function Grid({ children, min = "220px" }: { children: ReactNode; min?: string }) {
  return (
    <div
      className="grid gap-x-6 gap-y-9"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))` }}
    >
      {children}
    </div>
  );
}

/** Tidy divided list container for scalar token rows. */
export function RowList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-zinc-100">{children}</div>;
}

/**
 * Standard entry: borderless visual sample on a soft tile, name, usage note.
 * When `value` is set, a </> toggle sits top-right; tag shifts top-left.
 * Mono value reveals in the specimen’s bottom-left (overlay — no layout shift).
 */
export function TokenCard({
  sample,
  name,
  tag,
  value,
  usage,
}: {
  sample: ReactNode;
  name: string;
  /** Omit when the section header already shows a uniform group tag. */
  tag?: Tag;
  value?: string;
  usage?: string;
}) {
  const [codeOpen, setCodeOpen] = useState(false);
  const hasCode = Boolean(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex h-[120px] min-h-[120px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50 md:h-auto md:min-h-[200px]">
        {sample}
        {tag ? (
          <div
            className={clsx(
              "absolute top-2 z-10",
              hasCode ? "left-2" : "right-2",
            )}
          >
            <TagChip tag={tag} />
          </div>
        ) : null}
        {hasCode ? (
          <div className="absolute right-2 top-2 z-10">
            <CodeToggleButton
              pressed={codeOpen}
              onPressedChange={setCodeOpen}
            />
          </div>
        ) : null}
        {hasCode && codeOpen ? (
          <code className="absolute bottom-2 left-3 z-10 max-w-[calc(100%-1.5rem)] break-words font-mono text-sm leading-snug text-zinc-400">
            {value}
          </code>
        ) : null}
      </div>
      <div className="flex flex-col gap-0 pl-2">
        <span className="font-['Michelle',sans-serif] text-base font-medium text-zinc-700">
          {name}
        </span>
        {usage ? (
          <span className="text-sm leading-snug text-zinc-400 text-pretty">{usage}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Compact borderless row for scalar tokens (spacing, tracking, weights). Wrap in <RowList>. */
export function TokenRow({
  sample,
  name,
  tag,
  value,
  usage,
}: {
  sample?: ReactNode;
  name: string;
  /** Omit when the section header already shows a uniform group tag. */
  tag?: Tag;
  value: string;
  usage: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      {sample && <div className="flex w-16 shrink-0 items-center justify-center">{sample}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <code className="font-mono text-sm text-zinc-700">{name}</code>
          {tag && <TagChip tag={tag} />}
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-400">{usage}</p>
      </div>
      <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">{value}</code>
    </div>
  );
}
