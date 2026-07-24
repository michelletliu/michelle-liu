/** Instant DS doorway shell while the route chunk arrives (cold nav). */
export default function DesignSystemLoading() {
  return (
    <div className="min-h-dvh bg-white font-['Michelle',sans-serif] text-base text-zinc-500">
      <div
        aria-hidden
        className="fixed left-6 top-8 z-50 size-8 animate-pulse rounded-lg bg-zinc-100 mid:left-16 mid:size-11"
      />
      {/*
        Match SystemPage: mobile sticky bar band, then centered main with
        mid gutters (seal / sticky clearance) → symmetric lg:px-16.
      */}
      <div aria-hidden className="h-20 w-full mid:h-24 lg:hidden" />
      <div className="relative px-6 pt-24 pb-16 mid:pl-32 mid:pr-16 lg:px-16 lg:pt-28">
        <aside className="pointer-events-none absolute inset-y-0 left-6 hidden w-44 mid:left-16 lg:block">
          <div className="sticky top-28 flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-zinc-100"
                style={{ width: `${56 + (i % 3) * 16}%` }}
              />
            ))}
          </div>
        </aside>
        <main className="relative mx-auto min-w-0 w-full max-w-[720px]">
          <div className="pb-8">
            <h1 className="max-w-3xl font-['Michelle',sans-serif] text-4xl font-normal leading-normal tracking-[0.0125em] text-[#3f3f46]">
              Design System
            </h1>
            <div className="mt-8 h-48 animate-pulse rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-100" />
          </div>
        </main>
      </div>
    </div>
  );
}
