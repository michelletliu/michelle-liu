import { experiments } from "../tokens";
import { Section } from "../primitives";

export default function ExperimentSection() {
  return (
    <Section
      id="experiments"
      title="Experiments"
      subtitle="Each interactive experiment is its own visual world with a deliberately distinct language. Here's what makes each one diverge from the core site."
    >
      <div className="flex flex-col gap-5">
        {experiments.map((e) => (
          <div
            key={e.id}
            className="overflow-hidden rounded-2xl ring-1 ring-inset ring-black/[0.06]"
          >
            {/* Header band uses the experiment's own background */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
              style={{ backgroundColor: e.bg }}
            >
              <div className="min-w-0">
                <h3 className="text-base font-medium text-zinc-800">{e.name}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-snug text-zinc-500 text-pretty">
                  {e.tagline}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {e.colors.map((c) => (
                  <span
                    key={c.value + c.label}
                    title={`${c.label} · ${c.value}`}
                    className="h-6 w-6 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid gap-x-6 gap-y-5 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h4 className="mb-2.5 text-xs font-medium text-zinc-400">
                  Fonts
                </h4>
                <ul className="flex flex-col gap-1">
                  {e.fonts.map((f) => (
                    <li key={f} className="text-sm text-zinc-500">{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2.5 text-xs font-medium text-zinc-400">
                  Radii
                </h4>
                <ul className="flex flex-wrap gap-1">
                  {e.radii.map((r) => (
                    <li key={r} className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-sm text-zinc-500">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2.5 text-xs font-medium text-zinc-400">
                  Shadows
                </h4>
                <ul className="flex flex-col gap-1">
                  {e.shadows.map((s) => (
                    <li key={s} className="break-words font-mono text-sm leading-snug text-zinc-400">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2.5 text-xs font-medium text-zinc-400">
                  Effects
                </h4>
                <ul className="flex flex-col gap-1">
                  {e.effects.map((fx) => (
                    <li key={fx} className="text-sm leading-snug text-zinc-500 text-pretty">• {fx}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
