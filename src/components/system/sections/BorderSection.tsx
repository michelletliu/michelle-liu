"use client";

import type { ReactNode } from "react";
import { borders, uniformTag } from "../tokens";
import {
  Section,
  SubLabel,
  Grid,
  TokenCard,
  GLASS_SPECIMEN_BG_CLASS,
} from "../primitives";
import RadiusBlock from "./RadiusSection";

/** Width/color border tokens only — focus outline & ring live in Focus states below. */
const borderTokens = borders.filter(
  (b) => b.name !== "Focus outline" && b.name !== "Focus ring",
);
const focusTokens = borders.filter(
  (b) => b.name === "Focus outline" || b.name === "Focus ring",
);

const specimens: Record<string, ReactNode> = {
  border: (
    <div className="h-14 w-14 rounded-2xl border border-zinc-300 bg-white" />
  ),
  "border-2": (
    <div className="h-10 w-10 rounded-full border-2 border-zinc-200 border-t-zinc-400" />
  ),
  "border-zinc-50": (
    <div className="h-14 w-14 rounded-2xl border border-zinc-50 bg-zinc-200" />
  ),
  "border-zinc-100": (
    <div className="h-14 w-14 rounded-2xl border border-zinc-100 bg-white" />
  ),
  "border-white/50": (
    <div
      className={`absolute inset-0 flex items-center justify-center ${GLASS_SPECIMEN_BG_CLASS}`}
    >
      <div className="h-9 w-20 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass backdrop-blur-md" />
    </div>
  ),
  "border-transparent": (
    <div className="flex h-9 items-center rounded-full border border-transparent bg-white px-5 text-sm text-zinc-500">
      Inactive
    </div>
  ),
  "Focus outline": (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Focus outline specimen"
      className="h-9 w-24 rounded-lg bg-white"
      style={{ outline: "2px solid #d4d4d8", outlineOffset: "2px" }}
    />
  ),
  "Focus ring": (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Focus ring specimen"
      className="h-9 w-24 rounded-2xl bg-white ring-2 ring-zinc-400 ring-offset-2 ring-offset-zinc-50"
    />
  ),
};

export default function BorderSection() {
  const bordersTag = uniformTag(borderTokens);
  const focusTag = uniformTag(focusTokens);

  return (
    <Section id="borders" title="Borders">
      <RadiusBlock />

      <SubLabel tag={focusTag}>Focus states</SubLabel>
      <div className="grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-2">
        {focusTokens.map((b) => (
          <TokenCard
            key={b.name}
            name={b.name}
            tag={focusTag ? undefined : b.tag}
            value={b.value}
            usage={b.usage}
            sample={specimens[b.name]}
          />
        ))}
      </div>

      <SubLabel tag={bordersTag}>Styles</SubLabel>
      <Grid min="200px">
        {borderTokens.map((b) => (
          <TokenCard
            key={b.name}
            name={b.name}
            tag={bordersTag ? undefined : b.tag}
            value={b.value}
            usage={b.usage}
            sample={specimens[b.name]}
          />
        ))}
      </Grid>
    </Section>
  );
}
