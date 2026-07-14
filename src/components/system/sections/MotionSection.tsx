import { motion, durationScale, uniformTag } from "../tokens";
import { Section, SubLabel, RowList, TokenRow, TagChip } from "../primitives";

const demoStyles = `
@keyframes sys-fade { 0%,20% { opacity: 0 } 60%,100% { opacity: 1 } }
@keyframes sys-slideUp { 0%,15% { opacity: 0; transform: translateY(14px) } 60%,100% { opacity: 1; transform: translateY(0) } }
@keyframes sys-slideDown { 0%,15% { opacity: 0; transform: translateY(-14px) } 60%,100% { opacity: 1; transform: translateY(0) } }
@keyframes sys-scale { 0%,15% { opacity: 0; transform: scale(0.85) } 60%,100% { opacity: 1; transform: scale(1) } }
@keyframes sys-blink { 0%,45%,100% { opacity: 1 } 55%,80% { opacity: 0.15 } }
@keyframes sys-pulse { 0% { transform: scale(0.85); opacity: 0.6 } 70%,100% { transform: scale(1.35); opacity: 0 } }
`;

function Demo({ kind }: { kind: string }) {
  const common = "h-8 w-8 rounded-lg bg-blue-500";
  switch (kind) {
    case "shimmer":
      return <div className="animate-shimmer h-8 w-16 rounded-lg" />;
    case "spin":
      return <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />;
    case "pulse":
      return (
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span
            className="absolute h-4 w-4 rounded-full bg-emerald-500"
            style={{ animation: "sys-pulse 2s ease-out infinite" }}
          />
          <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      );
    case "blink":
      return <div className={common} style={{ animation: "sys-blink 1.4s ease-in-out infinite" }} />;
    case "fade":
      return <div className={common} style={{ animation: "sys-fade 2.4s ease-out infinite" }} />;
    case "slideUp":
      return <div className={common} style={{ animation: "sys-slideUp 2.4s cubic-bezier(0.16,1,0.3,1) infinite" }} />;
    case "slideDown":
      return <div className={common} style={{ animation: "sys-slideDown 2.4s cubic-bezier(0.16,1,0.3,1) infinite" }} />;
    case "scale":
      return <div className={common} style={{ animation: "sys-scale 2.4s cubic-bezier(0.16,1,0.3,1) infinite" }} />;
    default:
      return <div className={common} />;
  }
}

export default function MotionSection() {
  const animationsTag = uniformTag(motion);
  const durationsTag = uniformTag(durationScale);

  return (
    <Section id="motion" title="Motion">
      <style dangerouslySetInnerHTML={{ __html: demoStyles }} />

      <SubLabel
        note="Live loops — the demos below repeat continuously so you can see each curve."
        tag={animationsTag}
      >
        Animations
      </SubLabel>
      <div className="grid gap-x-6 gap-y-9" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {motion.map((m) => (
          <div key={m.name} className="flex flex-col gap-3">
            <div className="flex h-20 items-center justify-center rounded-xl bg-zinc-50">
              <Demo kind={m.keyframe} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm text-zinc-700">{m.name}</code>
                {!animationsTag && <TagChip tag={m.tag} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="tabular-nums">{m.duration}</span>
                <span className="text-zinc-300">·</span>
                <span className="truncate">{m.easing}</span>
              </div>
              <span className="text-sm leading-snug text-zinc-400">{m.usage}</span>
            </div>
          </div>
        ))}
      </div>

      <SubLabel tag={durationsTag}>Duration scale</SubLabel>
      <RowList>
        {durationScale.map((d) => (
          <TokenRow
            key={d.name}
            name={d.name}
            tag={durationsTag ? undefined : d.tag}
            value={d.value}
            usage={d.usage}
          />
        ))}
      </RowList>
    </Section>
  );
}
