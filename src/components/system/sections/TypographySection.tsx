"use client";

import { useState } from "react";
import {
  fontFamilies,
  typeScale,
  fontWeights,
  tracking,
  lineHeights,
  uniformTag,
} from "../tokens";
import {
  Section,
  SubLabel,
  RowList,
  TokenRow,
  TagChip,
  TokenCard,
} from "../primitives";
import { FilterPills } from "../../FilterPills";

const TYPE_FILTERS = [
  { value: "scale", label: "Scale" },
  { value: "weights", label: "Weights" },
  { value: "tracking", label: "Tracking" },
  { value: "leading", label: "Leading" },
] as const;

type TypeFilterId = (typeof TYPE_FILTERS)[number]["value"];

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
      <SubLabel
        note="The 'Figtree' variable font covers weights 300–900, roman + italic."
        tag={familiesTag}
      >
        Families
      </SubLabel>
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
          <p className="mb-6 max-w-2xl text-base leading-relaxed text-zinc-400 text-pretty">
            Named Tailwind steps, grouped by role. text-lg is the boundary —
            used for subtitles, so it reads as supporting body text.
          </p>
          {(["body", "heading"] as const).map((role) => (
            <div key={role} className="mb-8 last:mb-0">
              <p className="mb-1 text-xs font-medium text-zinc-400">
                {role === "body" ? "Body" : "Heading"}
              </p>
              <RowList>
                {typeScale
                  .filter((t) => t.role === role)
                  .map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-4 py-3.5"
                    >
                      <div className="w-40 shrink-0 overflow-hidden">
                        <span
                          className={`${t.className} whitespace-nowrap text-zinc-700`}
                        >
                          {t.sample ?? "Text"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <code className="font-mono text-sm text-zinc-700">
                            {t.name}
                          </code>
                          {!scaleTag && <TagChip tag={t.tag} />}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-zinc-400">
                          {t.usage}
                        </p>
                      </div>
                      <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">
                        {t.px}
                      </code>
                    </div>
                  ))}
              </RowList>
            </div>
          ))}
        </>
      )}

      {filter === "weights" && (
        <RowList>
          {fontWeights.map((w) => (
            <div key={w.name} className="flex items-center gap-4 py-3.5">
              <span
                className="w-40 shrink-0 text-base text-zinc-700"
                style={{ fontWeight: Number(w.value) }}
              >
                Text
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <code className="font-mono text-sm text-zinc-700">
                    {w.name}
                  </code>
                  {!weightsTag && <TagChip tag={w.tag} />}
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-400">
                  {w.usage}
                </p>
              </div>
              <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">
                {w.value}
              </code>
            </div>
          ))}
        </RowList>
      )}

      {filter === "tracking" && (
        <RowList>
          {tracking.map((t) => (
            <div key={t.name} className="flex items-center gap-4 py-3.5">
              <span
                className="w-40 shrink-0 text-base text-zinc-700"
                style={{ letterSpacing: t.value }}
              >
                Text
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <code className="font-mono text-sm text-zinc-700">
                    {t.name}
                  </code>
                  {!trackingTag && <TagChip tag={t.tag} />}
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-400">
                  {t.usage}
                </p>
              </div>
              <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">
                {t.value}
              </code>
            </div>
          ))}
        </RowList>
      )}

      {filter === "leading" && (
        <RowList>
          {lineHeights.map((t) => (
            <TokenRow
              key={t.name}
              name={t.name}
              tag={lineHeightsTag ? undefined : t.tag}
              value={t.value}
              usage={t.usage}
            />
          ))}
        </RowList>
      )}
    </Section>
  );
}
