import type { CSSProperties, ReactNode } from "react";
import { materials } from "../tokens";
import { Section, TokenCard, Grid, GLASS_SPECIMEN_GRADIENT } from "../primitives";

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const HEADER_GRADIENT =
  "linear-gradient(120deg, #D5E0FF, #E2EAFF, #F5E2FF, #FDE9FA, #FFF5FC, #FFFEFF)";

/** Full-bleed fill inside TokenCard’s relative specimen tile. */
function Fill({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function MaterialSpecimen({ name }: { name: string }) {
  switch (name) {
    case "Header gradient":
      return (
        <Fill style={{ backgroundImage: HEADER_GRADIENT }}>
          <span className="text-sm text-zinc-500">Header gradient</span>
        </Fill>
      );

    case "Grain overlay":
      return (
        <Fill
          style={{
            backgroundImage: `${GRAIN_SVG}, ${GLASS_SPECIMEN_GRADIENT}`,
          }}
        >
          <span className="text-sm text-zinc-500">Grain</span>
        </Fill>
      );

    case "Glass nav pill":
      return (
        <Fill style={{ backgroundImage: GLASS_SPECIMEN_GRADIENT }}>
          <div className="rounded-full border border-white/50 bg-zinc-200/60 px-4 py-1.5 shadow-glass backdrop-blur-md">
            <span className="text-sm text-zinc-500">Glass pill</span>
          </div>
        </Fill>
      );

    case "Backdrop blur":
      return (
        <Fill className="overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: GLASS_SPECIMEN_GRADIENT }}
          />
          <div className="relative rounded-lg border border-white/40 bg-white/40 px-4 py-2 backdrop-blur-md">
            <span className="text-sm text-zinc-600">Blur</span>
          </div>
        </Fill>
      );

    case "Liquid glass":
      return (
        <Fill style={{ backgroundImage: GLASS_SPECIMEN_GRADIENT }}>
          <div
            className="rounded-full border border-white/50 px-4 py-2 text-sm text-zinc-600 shadow-glass"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }}
          >
            Liquid
          </div>
        </Fill>
      );

    case "Shimmer":
      return (
        <Fill className="bg-zinc-50">
          <div className="animate-shimmer h-16 w-32 rounded-xl" />
        </Fill>
      );

    case "Text selection":
      return (
        <Fill className="bg-zinc-50">
          <span
            className="rounded px-1.5 py-0.5 text-sm"
            style={{ color: "#3b82f6", backgroundColor: "#dbeafe" }}
          >
            Selected text
          </span>
        </Fill>
      );

    case "Green pulse ring":
      return (
        <Fill className="bg-zinc-50">
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
          </span>
        </Fill>
      );

    case "Quote underline":
      return (
        <Fill className="bg-zinc-50">
          <span className="relative pb-1 text-sm text-zinc-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-zinc-300">
            Quote line
          </span>
        </Fill>
      );

    case "Edge fades":
      return (
        <Fill className="overflow-hidden bg-zinc-200">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #fff 0%, transparent 20%, transparent 80%, #fff 100%)",
            }}
          />
          <span className="relative text-sm text-zinc-500">Edge fade</span>
        </Fill>
      );

    case "Modal scrim":
      return (
        <Fill className="bg-zinc-100">
          <div className="absolute inset-0 bg-zinc-900/20" />
          <div className="relative rounded-lg bg-white px-4 py-2 shadow-soft ring-1 ring-zinc-900/5">
            <span className="text-sm text-zinc-600">Modal</span>
          </div>
        </Fill>
      );

    case "Blur-reveal text":
      return (
        <Fill className="gap-4 bg-zinc-50">
          <span className="text-sm text-zinc-500 blur-[4px]">Blurred</span>
          <span className="text-sm text-zinc-600">→</span>
          <span className="text-sm text-zinc-700">Clear</span>
        </Fill>
      );

    case "Canvas particles":
      return (
        <Fill className="overflow-hidden bg-zinc-900">
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
                backgroundColor:
                  i % 3 === 0 ? "#fbcfe8" : i % 3 === 1 ? "#bfdbfe" : "#e4e4e7",
              }}
            />
          ))}
          <span className="relative text-sm text-zinc-400">Dust</span>
        </Fill>
      );

    case "Hover scale":
      return (
        <Fill className="gap-3 bg-zinc-50">
          <div className="h-12 w-16 scale-[0.99] rounded-lg bg-zinc-200 ring-1 ring-inset ring-zinc-900/5" />
          <div className="h-12 w-16 scale-[1.005] rounded-lg bg-zinc-300 shadow-soft ring-1 ring-inset ring-zinc-900/5" />
        </Fill>
      );

    default:
      return (
        <Fill className="bg-zinc-50">
          <span className="text-sm text-zinc-400">{name}</span>
        </Fill>
      );
  }
}

export default function MaterialSection() {
  return (
    <Section id="materials" title="Materials">
      <Grid min="220px">
        {materials.map((m) => (
          <TokenCard
            key={m.name}
            name={m.name}
            tag={m.tag}
            usage={m.usage}
            sample={<MaterialSpecimen name={m.name} />}
          />
        ))}
      </Grid>
    </Section>
  );
}
