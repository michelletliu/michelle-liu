import grainTexture from "../../assets/Rectangle Grain 1.png";

type NavigationLoadingShellProps = {
  activeTab: "art" | "about";
};

const tabs = [
  { id: "work", label: "Work" },
  { id: "art", label: "Art" },
  { id: "about", label: "About" },
] as const;

function ArtContentSkeleton() {
  return (
    <>
      <div className="hidden lg:flex flex-col gap-3 w-full">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-50" />
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-50" />
        </div>
        <div className="h-6 w-36 animate-pulse rounded bg-zinc-100 mt-8" />
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-50" />
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-50" />
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full lg:hidden">
        <div className="h-6 w-28 animate-pulse rounded bg-zinc-100" />
        <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-zinc-50" />
        <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-zinc-50" />
      </div>
    </>
  );
}

function AboutContentSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center md:items-start w-full max-w-5xl">
      <div className="flex flex-col gap-3 w-72 md:w-76 shrink-0">
        <div className="aspect-[304/389] w-full animate-pulse rounded-lg bg-zinc-50" />
        <div className="px-6">
          <div className="mx-auto h-4 w-4/5 animate-pulse rounded bg-zinc-50" />
        </div>
      </div>
      <div className="flex flex-col pt-8 gap-6 flex-1">
        <div className="h-8 w-52 animate-pulse rounded bg-zinc-100" />
        <div className="flex flex-col gap-2 w-full">
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-zinc-50" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-zinc-50" />
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-zinc-50" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-zinc-50" />
          <div className="h-4 w-4/5 max-w-md animate-pulse rounded bg-zinc-50" />
        </div>
      </div>
    </div>
  );
}

export default function NavigationLoadingShell({
  activeTab,
}: NavigationLoadingShellProps) {
  return (
    <div
      aria-hidden="true"
      className="bg-white flex flex-col items-center relative size-full min-h-screen"
    >
      <div
        className="content-stretch flex flex-col items-start relative shrink-0 w-full header-gradient"
        style={{ zIndex: 41 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${grainTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            opacity: 0.8,
          }}
        />

        {/* Logo band */}
        <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
          <div className="size-full">
            <div className="content-stretch flex flex-col items-start px-16 pt-8 pb-8 max-md:px-6 max-md:pt-8 max-md:pb-4 relative w-full">
              <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                <div className="size-8 md:size-11 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero band */}
        <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-4 items-start pb-6 pt-14 px-16 max-md:px-6 max-md:pt-20 max-md:pb-2 relative w-full max-md:min-h-[210px] md:min-h-[176px]">
              <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-100" />
              <div className="flex flex-col gap-2 w-full max-w-md">
                <div className="h-4 w-full animate-pulse rounded bg-zinc-50" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation band */}
      <div className="content-stretch flex flex-col items-center pb-4 max-md:pb-1.75 pt-0 px-0 relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-6 relative w-full">
          <div className="content-stretch flex gap-1 items-start relative shrink-0">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={
                  tab.id === activeTab
                    ? "content-stretch z-10 flex items-center justify-center px-3.5 pt-[5px] pb-[4px] relative rounded-full shrink-0 border border-white/50 bg-zinc-200/60"
                    : "content-stretch z-10 flex items-center justify-center px-3.5 pt-[5px] pb-[4px] relative rounded-full shrink-0 border border-transparent"
                }
              >
                <p
                  className={
                    tab.id === activeTab
                      ? "font-['Michelle',sans-serif] font-medium leading-normal tracking-[0.005em] relative z-10 shrink-0 text-lg text-nowrap text-[#52525b]"
                      : "font-['Michelle',sans-serif] font-medium leading-normal tracking-[0.005em] relative z-10 shrink-0 text-lg text-nowrap text-[#a1a1aa]"
                  }
                >
                  {tab.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-16 max-md:px-6 w-full pt-3">
          <div className="bg-zinc-100 h-px shrink-0 w-full" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-4 items-start px-16 max-md:px-6 pt-2 relative shrink-0 w-full">
        <div className="hidden lg:block w-[202px] shrink-0">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-50" />
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-50" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-50" />
          </div>
        </div>
        <div className="flex-1 flex justify-center min-w-0 w-full">
          <div
            className={`flex flex-col ${activeTab === "about" ? "gap-20 max-w-[800px]" : "gap-12"} items-start pb-8 w-full`}
          >
            {activeTab === "art" ? <ArtContentSkeleton /> : <AboutContentSkeleton />}
          </div>
        </div>
      </div>
    </div>
  );
}
