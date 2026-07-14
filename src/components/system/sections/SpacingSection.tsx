import { spacingScale, gutters, uniformTag } from "../tokens";
import { Section, SubLabel, RowList, TokenRow, TagChip } from "../primitives";

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
                <div className="h-2.5 rounded-full bg-zinc-300" style={{ width: `${px}px` }} />
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

      <SubLabel note="Page gutters and grid-based widths." tag={gutterTag}>
        Layout widths
      </SubLabel>
      <RowList>
        {gutters.map((g) => (
          <TokenRow
            key={g.name}
            name={g.name}
            tag={gutterTag ? undefined : g.tag}
            value={g.value}
            usage={g.usage}
          />
        ))}
      </RowList>
    </Section>
  );
}
