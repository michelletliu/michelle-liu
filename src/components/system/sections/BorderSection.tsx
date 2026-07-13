import { borders } from "../tokens";
import { Section, SubLabel, RowList, TokenRow } from "../primitives";

export default function BorderSection() {
  return (
    <Section
      id="borders"
      title="Borders & focus"
      subtitle="Hairline borders in the lightest grays define most surfaces. Focus is a soft gray-300 outline with 2px offset."
    >
      <SubLabel>Borders</SubLabel>
      <RowList>
        {borders.slice(0, 8).map((b) => (
          <TokenRow key={b.name} name={b.name} tag={b.tag} value={b.value} usage={b.usage} />
        ))}
      </RowList>

      <SubLabel note="Global :focus-visible and the interactive focus ring.">Focus states</SubLabel>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-8">
          <button
            className="rounded-lg bg-white px-4 py-2 text-sm text-gray-600"
            style={{ outline: "2px solid #d1d5db", outlineOffset: "2px" }}
          >
            :focus-visible
          </button>
          <code className="font-mono text-sm text-gray-400">outline 2px #d1d5db, offset 2px</code>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-8">
          <button className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-600 ring-2 ring-gray-400 ring-offset-2 ring-offset-gray-50">
            ring-gray-400
          </button>
          <code className="font-mono text-sm text-gray-400">ring-2 ring-gray-400 offset-2</code>
        </div>
      </div>
    </Section>
  );
}
