import type { ReactNode } from "react";
import { spacingScale, gutters, uniformTag } from "../tokens";
import { Section, SubLabel, RowList, Grid, TokenCard, TagChip } from "../primitives";

/** Mini browser chrome: titlebar + 16:10 laptop/browser screen. */
function BrowserFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex aspect-[16/10] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex h-3.5 shrink-0 items-center gap-1 border-b border-zinc-100 bg-zinc-100 px-1">
        <span className="size-1.5 rounded-full bg-zinc-300" />
        <span className="size-1.5 rounded-full bg-zinc-300" />
        <span className="size-1.5 rounded-full bg-zinc-300" />
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Mini phone chrome: bezel + screen.
 * Aspect matches iPhone 16 Pro viewport (402×874 ≈ 19.5:9).
 * Circular corner arcs scale with the phone while preserving its aspect.
 * Rim is zinc-400 (one step lighter than the previous zinc-500).
 */
function PhoneFrame({
  children,
  className = "",
  heightClass = "h-[64px]",
}: {
  children?: ReactNode;
  className?: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`relative aspect-[402/874] shrink-0 overflow-hidden rounded-[30%/15%] bg-zinc-400 p-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] ${heightClass} ${className}`}
    >
      <div className="h-full w-full overflow-hidden rounded-[28%/14%] bg-white">
        {children}
      </div>
    </div>
  );
}

/** Viewport with shaded gutters inside a browser or phone screen. */
function GutterScreen({ gutterPct }: { gutterPct: number }) {
  return (
    <div className="flex h-full w-full">
      <div className="shrink-0 bg-zinc-200/80" style={{ width: `${gutterPct}%` }} />
      <div className="min-w-0 flex-1 bg-white" />
      <div className="shrink-0 bg-zinc-200/80" style={{ width: `${gutterPct}%` }} />
    </div>
  );
}

/** Centered modal panel over a soft 12-col field. */
function ModalScreen({ cols }: { cols: 6 | 10 }) {
  const widthPct = (cols / 12) * 100;
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid grid-cols-12 gap-px px-0.5 opacity-50"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="bg-zinc-200/70" />
        ))}
      </div>
      <div
        className="relative z-[1] h-[70%] rounded-md border border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}

function LayoutWidthSample({ name }: { name: string }) {
  switch (name) {
    case "px-16 / max-md:px-6":
      return (
        <div className="flex w-full items-center justify-center gap-3 px-4">
          <BrowserFrame className="w-full max-w-[112px]">
            <GutterScreen gutterPct={28} />
          </BrowserFrame>
          <PhoneFrame>
            <GutterScreen gutterPct={18} />
          </PhoneFrame>
        </div>
      );
    case "px-8":
      return (
        <PhoneFrame heightClass="h-[76px]">
          <GutterScreen gutterPct={22} />
        </PhoneFrame>
      );
    case "px-[175px] / md:px-[8%]":
      return (
        <div className="flex w-full items-center justify-center gap-2.5 px-4">
          <div className="flex w-[96px] shrink-0 flex-col items-center gap-1.5">
            <BrowserFrame className="w-full">
              <GutterScreen gutterPct={38} />
            </BrowserFrame>
            <span className="text-xs tabular-nums text-zinc-400">xl · 175px</span>
          </div>
          <div className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <BrowserFrame className="w-full">
              <GutterScreen gutterPct={30} />
            </BrowserFrame>
            <span className="text-xs tabular-nums text-zinc-400">md · 8%</span>
          </div>
        </div>
      );
    case "w-[calc(100%*10/12)]":
      return (
        <div className="w-full max-w-[200px] px-4">
          <BrowserFrame className="w-full">
            <ModalScreen cols={10} />
          </BrowserFrame>
        </div>
      );
    case "w-[calc(100%*6/12)]":
      return (
        <div className="w-full max-w-[200px] px-4">
          <BrowserFrame className="w-full">
            <ModalScreen cols={6} />
          </BrowserFrame>
        </div>
      );
    default:
      return null;
  }
}

export default function SpacingSection() {
  const gapTag = uniformTag(spacingScale);
  const gutterTag = uniformTag(gutters);

  return (
    <Section id="spacing" title="Spacing">
      <SubLabel tag={gapTag}>Gap scale</SubLabel>
      <RowList>
        {spacingScale.map((s) => {
          const px = parseInt(s.value, 10);
          return (
            <div key={s.name} className="flex items-center gap-4 py-3.5">
              <div className="flex w-24 shrink-0 items-center">
                <div className="h-2.5 rounded-md bg-zinc-300" style={{ width: `${px}px` }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <code className="font-mono text-sm text-zinc-700">{s.name}</code>
                  {!gapTag && <TagChip tag={s.tag} />}
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-400">{s.usage}</p>
              </div>
              <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">
                {s.value}
              </code>
            </div>
          );
        })}
      </RowList>

      <SubLabel tag={gutterTag}>Layout widths</SubLabel>
      <Grid min="220px">
        {gutters.slice(0, 3).map((g) => (
          <TokenCard
            key={g.name}
            name={g.usage.replace(/^\★\s*/, "")}
            tag={gutterTag ? undefined : g.tag}
            value={g.name}
            usage={g.value}
            sample={<LayoutWidthSample name={g.name} />}
          />
        ))}
      </Grid>
      <div className="mt-9 grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-2">
        {gutters.slice(3).map((g) => (
          <TokenCard
            key={g.name}
            name={g.usage.replace(/^\★\s*/, "")}
            tag={gutterTag ? undefined : g.tag}
            value={g.name}
            usage={g.value}
            sample={<LayoutWidthSample name={g.name} />}
          />
        ))}
      </div>
    </Section>
  );
}
