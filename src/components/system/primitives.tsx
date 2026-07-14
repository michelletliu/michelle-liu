import type { ReactNode } from "react";
import type { Tag } from "./tokens";
import { subSlug } from "./tokens";

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
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-zinc-100 pt-16 pb-4">
      <div className="mb-10">
        <h2 className="font-['Michelle',sans-serif] text-2xl font-medium leading-relaxed tracking-tight text-zinc-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** Group heading used to organize entries within a section. */
export function SubLabel({ children, note }: { children: ReactNode; note?: string }) {
  const id = typeof children === "string" ? subSlug(children) : undefined;
  return (
    <div id={id} className="mb-5 mt-20 scroll-mt-28 first:mt-0">
      <h3 className="text-xl font-medium leading-relaxed text-zinc-700">{children}</h3>
      {note && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 text-pretty">{note}</p>
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

/** Standard entry: borderless visual sample on a soft tile, name + tag, mono value, usage note. */
export function TokenCard({
  sample,
  name,
  tag,
  value,
  usage,
}: {
  sample: ReactNode;
  name: string;
  tag: Tag;
  value?: string;
  usage: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">
        {sample}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-medium text-zinc-700">{name}</span>
          <TagChip tag={tag} />
        </div>
        {value && (
          <code className="block break-words font-mono text-sm leading-relaxed text-zinc-400">
            {value}
          </code>
        )}
        <span className="text-sm leading-snug text-zinc-400 text-pretty">{usage}</span>
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
  tag: Tag;
  value: string;
  usage: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      {sample && <div className="flex w-16 shrink-0 items-center justify-center">{sample}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <code className="font-mono text-sm text-zinc-700">{name}</code>
          <TagChip tag={tag} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-400">{usage}</p>
      </div>
      <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">{value}</code>
    </div>
  );
}
