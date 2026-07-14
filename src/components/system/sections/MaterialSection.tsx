import type { ReactNode } from "react";
import { materials } from "../tokens";
import { Section, TagChip } from "../primitives";

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const HEADER_GRADIENT =
  "linear-gradient(120deg, #D5E0FF, #E2EAFF, #F5E2FF, #FDE9FA, #FFF5FC, #FFFEFF)";

function SpecimenShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl ring-1 ring-inset ring-black/5">
      {children}
    </div>
  );
}

function MaterialSpecimen({ name }: { name: string }) {
  switch (name) {
    case "Header gradient":
      return (
        <SpecimenShell>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundImage: HEADER_GRADIENT }}
          >
            <span className="text-sm text-zinc-500">Header gradient</span>
          </div>
        </SpecimenShell>
      );

    case "Grain overlay":
      return (
        <SpecimenShell>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundColor: "#F5E2FF",
              backgroundImage: GRAIN_SVG,
            }}
          >
            <span className="text-sm text-zinc-500">Grain</span>
          </div>
        </SpecimenShell>
      );

    case "Glass nav pill":
      return (
        <SpecimenShell>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundImage: "linear-gradient(120deg, #D5E0FF, #F5E2FF, #AADBFD)" }}
          >
            <div className="rounded-full border border-white/50 bg-zinc-200/60 px-4 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02)] backdrop-blur-md">
              <span className="text-sm text-zinc-500">Glass pill</span>
            </div>
          </div>
        </SpecimenShell>
      );

    case "Backdrop blur":
      return (
        <SpecimenShell>
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-100">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(120deg, #D5E0FF, #F5E2FF, #AADBFD)" }}
            />
            <div className="relative rounded-lg border border-white/40 bg-white/40 px-4 py-2 backdrop-blur-md">
              <span className="text-sm text-zinc-600">Blur</span>
            </div>
          </div>
        </SpecimenShell>
      );

    case "Liquid glass":
      return (
        <SpecimenShell>
          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{ backgroundImage: "linear-gradient(135deg, #c7d2fe, #fbcfe8, #a5f3fc)" }}
          >
            <div
              className="rounded-full border border-white/50 px-4 py-2 text-sm text-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_4px_16px_rgba(0,0,0,0.08)]"
              style={{
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
              }}
            >
              Liquid
            </div>
          </div>
        </SpecimenShell>
      );

    case "Shimmer":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <div className="animate-shimmer h-16 w-32 rounded-xl" />
          </div>
        </SpecimenShell>
      );

    case "Gradient text":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <span className="gradient-text-animated text-lg font-medium">Accent text</span>
          </div>
        </SpecimenShell>
      );

    case "Text selection":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <span className="rounded px-1.5 py-0.5 text-sm" style={{ color: "#3b82f6", backgroundColor: "#dbeafe" }}>
              Selected text
            </span>
          </div>
        </SpecimenShell>
      );

    case "Green pulse ring":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
            </span>
          </div>
        </SpecimenShell>
      );

    case "Quote underline":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <span className="relative pb-1 text-sm text-zinc-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-zinc-300">
              Quote line
            </span>
          </div>
        </SpecimenShell>
      );

    case "Edge fades":
      return (
        <SpecimenShell>
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-200">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #fff 0%, transparent 20%, transparent 80%, #fff 100%)",
              }}
            />
            <span className="relative text-sm text-zinc-500">Edge fade</span>
          </div>
        </SpecimenShell>
      );

    case "Modal scrim":
      return (
        <SpecimenShell>
          <div className="relative flex h-full w-full items-center justify-center bg-zinc-100">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-black/5">
              <span className="text-sm text-zinc-600">Modal</span>
            </div>
          </div>
        </SpecimenShell>
      );

    case "Blur-reveal text":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center gap-4 bg-zinc-50">
            <span className="text-sm text-zinc-500 blur-[4px]">Blurred</span>
            <span className="text-sm text-zinc-600">→</span>
            <span className="text-sm text-zinc-700">Clear</span>
          </div>
        </SpecimenShell>
      );

    case "Canvas particles":
      return (
        <SpecimenShell>
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-900">
            {[
              { t: "18%", l: "22%", s: 3, o: 0.9 },
              { t: "32%", l: "58%", s: 2, o: 0.7 },
              { t: "48%", l: "38%", s: 4, o: 0.85 },
              { t: "62%", l: "72%", s: 2, o: 0.6 },
              { t: "28%", l: "78%", s: 3, o: 0.75 },
              { t: "70%", l: "28%", s: 2, o: 0.55 },
              { t: "55%", l: "52%", s: 3, o: 0.8 },
              { t: "40%", l: "18%", s: 2, o: 0.65 },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  top: p.t,
                  left: p.l,
                  width: p.s,
                  height: p.s,
                  opacity: p.o,
                  backgroundColor: i % 3 === 0 ? "#fbcfe8" : i % 3 === 1 ? "#bfdbfe" : "#e4e4e7",
                }}
              />
            ))}
            <span className="relative text-sm text-zinc-400">Dust</span>
          </div>
        </SpecimenShell>
      );

    case "Hover scale":
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center gap-3 bg-zinc-50">
            <div className="h-12 w-16 scale-[0.99] rounded-lg bg-zinc-200 ring-1 ring-inset ring-black/5" />
            <div className="h-12 w-16 scale-[1.005] rounded-lg bg-zinc-300 ring-1 ring-inset ring-black/5 shadow-sm" />
          </div>
        </SpecimenShell>
      );

    default:
      return (
        <SpecimenShell>
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <span className="text-sm text-zinc-400">{name}</span>
          </div>
        </SpecimenShell>
      );
  }
}

export default function MaterialSection() {
  return (
    <Section
      id="materials"
      title="Materials & effects"
      subtitle="Glass, grain, shimmer, and multi-stop fades. These give the site its tactile, layered feel."
    >
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <div key={m.name} className="flex flex-col gap-3">
            <MaterialSpecimen name={m.name} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-700">{m.name}</span>
                <TagChip tag={m.tag} />
              </div>
              <p className="text-sm leading-snug text-zinc-400 text-pretty">{m.detail}</p>
              <p className="text-sm text-zinc-400">{m.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
