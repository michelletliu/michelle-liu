import { materials } from "../tokens";
import { Section, SubLabel, TagChip } from "../primitives";

export default function MaterialSection() {
  return (
    <Section
      id="materials"
      title="Materials & effects"
      subtitle="Glass, grain, shimmer, and multi-stop fades. These give the site its tactile, layered feel."
    >
      {/* Live showcase of a few signature materials */}
      <SubLabel>Signature materials</SubLabel>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Header gradient */}
        <div className="flex flex-col gap-3">
          <div
            className="flex h-28 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #D5E0FF, #E2EAFF, #F5E2FF, #FDE9FA, #FFF5FC, #FFFEFF)",
            }}
          >
            <span className="text-sm text-gray-500">Header gradient</span>
          </div>
          <p className="text-sm leading-snug text-gray-400">Animated lavender → white, 8s drift</p>
        </div>

        {/* Glass */}
        <div className="flex flex-col gap-3">
          <div
            className="flex h-28 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5"
            style={{ backgroundImage: "linear-gradient(120deg, #D5E0FF, #F5E2FF, #AADBFD)" }}
          >
            <div className="rounded-full border border-white/50 bg-gray-200/60 px-4 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02)] backdrop-blur-md">
              <span className="text-sm text-gray-500">Glass pill</span>
            </div>
          </div>
          <p className="text-sm leading-snug text-gray-400">
            bg-gray-200/60 + backdrop-blur + inset shadow
          </p>
        </div>

        {/* Shimmer */}
        <div className="flex flex-col gap-3">
          <div className="flex h-28 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-inset ring-black/5">
            <div className="animate-shimmer h-16 w-32 rounded-xl" />
          </div>
          <p className="text-sm leading-snug text-gray-400">Loading skeleton, 2s ease-in-out loop</p>
        </div>

        {/* Green pulse */}
        <div className="flex flex-col gap-3">
          <div className="flex h-28 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-inset ring-black/5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="text-sm leading-snug text-gray-400">Availability dot + pulse ring</p>
        </div>

        {/* Edge fade */}
        <div className="flex flex-col gap-3">
          <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gray-200 ring-1 ring-inset ring-black/5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #fff 0%, transparent 20%, transparent 80%, #fff 100%)",
              }}
            />
            <span className="relative text-sm text-gray-500">Edge fade</span>
          </div>
          <p className="text-sm leading-snug text-gray-400">Multi-stop white fade on carousels</p>
        </div>

        {/* Grain */}
        <div className="flex flex-col gap-3">
          <div
            className="flex h-28 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5"
            style={{
              backgroundColor: "#F5E2FF",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
            }}
          >
            <span className="text-sm text-gray-500">Grain overlay</span>
          </div>
          <p className="text-sm leading-snug text-gray-400">PNG noise at opacity 0.8 over header</p>
        </div>
      </div>

      <SubLabel note="Every material / effect catalogued.">Full inventory</SubLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {materials.map((m) => (
          <div key={m.name} className="flex flex-col gap-1 rounded-xl bg-gray-50/70 px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-medium text-gray-700">{m.name}</span>
              <TagChip tag={m.tag} />
            </div>
            <p className="text-sm leading-snug text-gray-400 text-pretty">{m.detail}</p>
            <p className="text-sm text-gray-400">{m.usage}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
