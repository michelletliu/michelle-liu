/** Instant DS doorway shell while the route chunk arrives (cold nav). */
export default function DesignSystemLoading() {
  return (
    <div className="min-h-dvh bg-white font-['Michelle',sans-serif] text-base text-zinc-500">
      <div
        aria-hidden
        className="fixed left-6 top-8 z-50 size-8 animate-pulse rounded-lg bg-zinc-100 md:left-16 md:size-11"
      />
      <div className="flex items-start gap-48 px-6 pt-24 md:px-16 lg:pt-28">
        <aside className="sticky top-28 hidden w-44 shrink-0 self-start lg:block">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-zinc-100"
                style={{ width: `${56 + (i % 3) * 16}%` }}
              />
            ))}
          </div>
        </aside>
        <main className="min-w-0 w-full max-w-[720px] pb-8">
          <h1 className="max-w-3xl font-['Michelle',sans-serif] text-4xl font-medium leading-normal tracking-[0.0125em] text-[#3f3f46]">
            Design System
          </h1>
          <div className="mt-8 h-48 animate-pulse rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-100" />
        </main>
      </div>
    </div>
  );
}
