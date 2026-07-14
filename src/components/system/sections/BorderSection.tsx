import { borders } from "../tokens";
import { Section, SubLabel, RowList, TokenRow } from "../primitives";

export default function BorderSection() {
  return (
    <Section id="borders" title="Borders">
      <SubLabel>Borders</SubLabel>
      <RowList>
        {borders.slice(0, 8).map((b) => (
          <TokenRow key={b.name} name={b.name} tag={b.tag} value={b.value} usage={b.usage} />
        ))}
      </RowList>

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
