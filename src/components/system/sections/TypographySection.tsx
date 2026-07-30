"use client";

import { useState, type ReactNode } from "react";
import {
  fontFamilies,
  typeScale,
  fontWeights,
  tracking,
  lineHeights,
  uniformTag,
  type Tag,
} from "../tokens";
import {
  Section,
  SubLabel,
  RowList,
  TagChip,
  TokenCard,
} from "../primitives";
import { FilterPills } from "../../shared/FilterPills";

const TYPE_FILTERS = [
  { value: "scale", label: "Scale" },
  { value: "weights", label: "Weights" },
  { value: "tracking", label: "Tracking" },
  { value: "leading", label: "Leading" },
] as const;

type TypeFilterId = (typeof TYPE_FILTERS)[number]["value"];

/** One properties row — stacks on mobile, single-line on sm+. */
function PropertyRow({
  sample,
  name,
  tag,
  usage,
  value,
}: {
  sample?: ReactNode;
  name: string;
  tag?: Tag;
  usage: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 py-3.5 sm:h-20 sm:flex-row sm:items-center sm:gap-4 sm:py-0">
      {sample != null ? (
        <div className="flex h-8 w-full shrink-0 items-center overflow-hidden sm:h-10 sm:w-28 md:w-40">
          {sample}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <code className="break-all font-mono text-sm text-zinc-700">{name}</code>
          {tag ? <TagChip tag={tag} /> : null}
        </div>
        <p className="mt-0.5 text-sm leading-normal text-zinc-400 text-pretty sm:truncate">
          {usage}
        </p>
      </div>
      <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">
        {value}
      </code>
    </div>
  );
}

export default function TypographySection() {
  const familiesTag = uniformTag(fontFamilies);
  const scaleTag = uniformTag(typeScale);
  const weightsTag = uniformTag(fontWeights);
  const trackingTag = uniformTag(tracking);
  const lineHeightsTag = uniformTag(lineHeights);

  const [filter, setFilter] = useState<TypeFilterId>("scale");

  const propertiesTag =
    filter === "scale"
      ? scaleTag
      : filter === "weights"
        ? weightsTag
        : filter === "tracking"
          ? trackingTag
          : lineHeightsTag;

  return (
    <Section id="typography" title="Typography">
      <SubLabel tag={familiesTag}>Families</SubLabel>
      <div className="grid grid-cols-1 gap-x-6 gap-y-9 mid:grid-cols-2">
        {fontFamilies.map((f) => (
          <TokenCard
            key={f.name}
            name={f.name}
            tag={familiesTag ? undefined : f.tag}
            value={f.stack}
            usage={f.usage}
            sample={
              <span
                className="text-3xl text-zinc-700"
                style={{ fontFamily: f.fontFamily ?? f.stack }}
              >
                {f.name}
              </span>
            }
          />
        ))}
      </div>

      <SubLabel tag={propertiesTag}>Properties</SubLabel>
      <FilterPills
        className="mb-5 -ml-3"
        options={[...TYPE_FILTERS]}
        value={filter}
        pressedValue={filter}
        onChange={(value) => setFilter(value as TypeFilterId)}
      />

      {filter === "scale" && (
        <>
          {(["body", "heading"] as const).map((role) => (
            <div key={role} className="mb-8 last:mb-0">
              <p className="mb-1 text-sm font-medium text-zinc-400">
                {role === "body" ? "Body" : "Heading"}
              </p>
              <RowList>
                {typeScale
                  .filter((t) => t.role === role)
                  .map((t) => (
                    <PropertyRow
                      key={t.name}
                      sample={
                        <span
                          className={`${t.className} whitespace-nowrap text-zinc-700`}
                        >
                          {t.sample ?? "Text"}
                        </span>
                      }
                      name={t.name}
                      tag={scaleTag ? undefined : t.tag}
                      usage={t.usage}
                      value={t.px}
                    />
                  ))}
              </RowList>
            </div>
          ))}
        </>
      )}

      {filter === "weights" && (
        <RowList>
          {fontWeights.map((w) => (
            <PropertyRow
              key={w.name}
              sample={
                <span
                  className="text-base leading-normal text-zinc-700"
                  style={{ fontWeight: Number(w.value) }}
                >
                  Text
                </span>
              }
              name={w.name}
              tag={weightsTag ? undefined : w.tag}
              usage={w.usage}
              value={w.value}
            />
          ))}
        </RowList>
      )}

      {filter === "tracking" && (
        <RowList>
          {tracking.map((t) => (
            <PropertyRow
              key={t.name}
              sample={
                <span
                  className="text-base leading-normal text-zinc-700"
                  style={{ letterSpacing: t.value }}
                >
                  Text
                </span>
              }
              name={t.name}
              tag={trackingTag ? undefined : t.tag}
              usage={t.usage}
              value={t.value}
            />
          ))}
        </RowList>
      )}

      {filter === "leading" && (
        <RowList>
          {lineHeights.map((t) => (
            <PropertyRow
              key={t.name}
              name={t.name}
              tag={lineHeightsTag ? undefined : t.tag}
              usage={t.usage}
              value={t.value}
            />
          ))}
        </RowList>
      )}
    </Section>
  );
}
