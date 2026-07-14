import {
  fontFamilies,
  typeScale,
  arbitraryTypeSizes,
  fontWeights,
  tracking,
  lineHeights,
} from "../tokens";
import { Section, SubLabel, RowList, TokenRow, TagChip } from "../primitives";

export default function TypographySection() {
  return (
    <Section
      id="typography"
      title="Typography"
      subtitle="Michelle (a self-hosted Figtree variable font) does almost all the work. SF Pro and monospaces appear only inside specific experiments."
    >
      <SubLabel note="The 'Michelle' variable font covers weights 300–900, roman + italic.">
        Font families
      </SubLabel>
      <div className="flex flex-col divide-y divide-zinc-100">
        {fontFamilies.map((f) => (
          <div key={f.name} className="py-5 first:pt-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl text-zinc-700" style={{ fontFamily: f.stack }}>
                {f.name} — The quick brown fox
              </span>
              <TagChip tag={f.tag} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <code className="font-mono text-sm text-zinc-400">{f.stack}</code>
              <span className="text-sm text-zinc-400">{f.usage}</span>
            </div>
          </div>
        ))}
      </div>

      <SubLabel note="Named Tailwind steps, grouped by role. text-lg is the boundary — used for subtitles, so it reads as supporting body text.">
        Type scale
      </SubLabel>
      {(["body", "heading"] as const).map((role) => (
        <div key={role} className="mb-8 last:mb-0">
          <p className="mb-1 text-xs font-medium text-zinc-400">
            {role === "body" ? "Body" : "Heading"}
          </p>
          <RowList>
            {typeScale
              .filter((t) => t.role === role)
              .map((t) => (
                <div key={t.name} className="flex items-center gap-4 py-3.5">
                  <div className="w-40 shrink-0 overflow-hidden">
                    <span className={`${t.className} whitespace-nowrap text-zinc-700`}>
                      {t.sample ?? "Michelle"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <code className="font-mono text-sm text-zinc-700">{t.name}</code>
                      <TagChip tag={t.tag} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-400">{t.usage}</p>
                  </div>
                  <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">{t.px}</code>
                </div>
              ))}
          </RowList>
        </div>
      ))}

      <SubLabel note="The core site uses only the standard scale above. These pixel-exact sizes remain solely inside experiments (device-accurate / Figma-exported chrome).">
        Experiment-only sizes
      </SubLabel>
      <RowList>
        {arbitraryTypeSizes.map((t) => (
          <TokenRow key={t.name} name={t.name} tag={t.tag} value={t.value} usage={t.usage} />
        ))}
      </RowList>

      <SubLabel>Weights</SubLabel>
      <RowList>
        {fontWeights.map((w) => (
          <div key={w.name} className="flex items-center gap-4 py-3.5">
            <span
              className="w-40 shrink-0 text-base text-zinc-700"
              style={{ fontWeight: Number(w.value) }}
            >
              Michelle
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <code className="font-mono text-sm text-zinc-700">{w.name}</code>
                <TagChip tag={w.tag} />
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-400">{w.usage}</p>
            </div>
            <code className="shrink-0 font-mono text-sm tabular-nums text-zinc-400">{w.value}</code>
          </div>
        ))}
      </RowList>

      <SubLabel>Letter-spacing</SubLabel>
      <RowList>
        {tracking.map((t) => (
          <TokenRow key={t.name} name={t.name} tag={t.tag} value={t.value} usage={t.usage} />
        ))}
      </RowList>

      <SubLabel>Line-height</SubLabel>
      <RowList>
        {lineHeights.map((t) => (
          <TokenRow key={t.name} name={t.name} tag={t.tag} value={t.value} usage={t.usage} />
        ))}
      </RowList>
    </Section>
  );
}
