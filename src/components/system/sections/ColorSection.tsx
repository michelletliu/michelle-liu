import { colorGroups } from "../tokens";
import { Section, SubLabel, TagChip } from "../primitives";

export default function ColorSection() {
  return (
    <Section
      id="color"
      title="Color"
      subtitle="A tinted-neutral zinc scale carries the whole site; blue-500 is the single interactive accent. Everything else is status or one-off."
    >
      <div className="space-y-24">
        {colorGroups.map((group) => (
          <div key={group.id}>
            <SubLabel note={group.note}>{group.label}</SubLabel>

            {/* At-a-glance ramp of the group's swatches */}
            <div className="mb-6 flex h-9 overflow-hidden rounded-lg ring-1 ring-inset ring-black/5">
              {group.colors.map((c) => (
                <div
                  key={"ramp-" + c.name + c.value}
                  title={`${c.name} · ${c.value}`}
                  className="flex-1"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>

            {/* Detailed swatch + info entries */}
            <div
              className="grid gap-x-8 gap-y-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}
            >
              {group.colors.map((c) => (
                <div key={c.name + c.value} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 h-9 w-9 shrink-0 rounded-lg ring-1 ring-inset ring-black/5"
                    style={{ backgroundColor: c.value }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-base font-medium text-zinc-700">{c.name}</span>
                      <TagChip tag={c.tag} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <code className="font-mono text-sm uppercase text-zinc-400">{c.value}</code>
                      {c.className && (
                        <code className="font-mono text-sm text-zinc-300">{c.className}</code>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-snug text-zinc-400 text-pretty">{c.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
