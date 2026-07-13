import type { ReactNode } from "react";
import type { Tag } from "./tokens";
import { subSlug } from "./tokens";

/** Colored text on a tint of the same color — one entry per provenance tag. */
const tagBadge: Record<Tag, string> = {
  canonical: "bg-gray-100 text-gray-600",
  "one-off": "bg-amber-100 text-amber-600",
  experiment: "bg-blue-100 text-blue-600",
};

/** Provenance marker rendered as a small badge (colored label on a tint). */
export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-sm font-medium ${tagBadge[tag]}`}
    >
      {tag.charAt(0).toUpperCase() + tag.slice(1)}
    </span>
  );
}

export function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-100 pt-16 pb-4">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="font-['Michelle',sans-serif] text-2xl font-medium tracking-tight text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl font-['Michelle',sans-serif] text-base font-normal leading-relaxed text-gray-500 text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Group heading used to organize entries within a section. */
export function SubLabel({ children, note }: { children: ReactNode; note?: string }) {
  const id = typeof children === "string" ? subSlug(children) : undefined;
  return (
    <div id={id} className="mb-5 mt-14 scroll-mt-28 first:mt-0">
      <h3 className="text-sm font-medium text-gray-500">{children}</h3>
      {note && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 text-pretty">{note}</p>
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
  return <div className="divide-y divide-gray-100">{children}</div>;
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
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
        {sample}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-medium text-gray-700">{name}</span>
          <TagChip tag={tag} />
        </div>
        {value && (
          <code className="block break-words font-mono text-sm leading-relaxed text-gray-400">
            {value}
          </code>
        )}
        <span className="text-sm leading-snug text-gray-400 text-pretty">{usage}</span>
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
          <code className="font-mono text-sm text-gray-700">{name}</code>
          <TagChip tag={tag} />
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-400">{usage}</p>
      </div>
      <code className="shrink-0 font-mono text-sm tabular-nums text-gray-400">{value}</code>
    </div>
  );
}
