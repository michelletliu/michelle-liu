import type { ReactNode } from "react";
import { borders, uniformTag } from "../tokens";
import {
  Section,
  SubLabel,
  Grid,
  TokenCard,
  GLASS_SPECIMEN_BG_CLASS,
} from "../primitives";

/** Width/color border tokens only — focus outline & ring live in Focus states below. */
const borderTokens = borders.filter(
  (b) => b.name !== "focus outline" && b.name !== "focus ring",
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
    <div className="h-9 rounded-full border border-transparent bg-white px-5 text-sm leading-9 text-zinc-500">
      Inactive
    </div>
  ),
};

export default function BorderSection() {
  const bordersTag = uniformTag(borderTokens);

  return (
    <Section id="borders" title="Borders">
      <SubLabel
        note="Width and color tokens used across cards, inputs, overlays, and chrome."
        tag={bordersTag}
      >
        Borders
      </SubLabel>
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

      <SubLabel note="Global :focus-visible and the interactive focus ring.">Focus states</SubLabel>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-50 p-8">
          <button
            className="rounded-lg bg-white px-4 py-2 text-sm text-zinc-600"
            style={{ outline: "2px solid #d4d4d8", outlineOffset: "2px" }}
          >
            :focus-visible
          </button>
          <code className="font-mono text-sm text-zinc-400">outline 2px #d4d4d8, offset 2px</code>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-50 p-8">
          <button className="rounded-2xl bg-white px-4 py-2 text-sm text-zinc-600 ring-2 ring-zinc-400 ring-offset-2 ring-offset-zinc-50">
            ring-zinc-400
          </button>
          <code className="font-mono text-sm text-zinc-400">ring-2 ring-zinc-400 offset-2</code>
        </div>
      </div>
    </Section>
  );
}
