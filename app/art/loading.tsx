import LoadingSpinner from "@/components/LoadingSpinner";

/** Instant Art shell so Work → Art doesn't hold the previous page on screen. */
export default function ArtLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-white">
      <div className="w-full px-16 max-md:px-6 pt-8 pb-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-100" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-zinc-50" />
      </div>
      <div className="w-full px-16 max-md:px-6 pb-4">
        <div className="flex gap-1">
          <div className="h-9 w-16 rounded-full bg-zinc-50" />
          <div className="h-9 w-12 rounded-full border border-white/50 bg-zinc-200/60" />
          <div className="h-9 w-16 rounded-full bg-zinc-50" />
        </div>
        <div className="mt-3 h-px w-full bg-zinc-100" />
      </div>
      <div className="flex flex-1 items-start justify-center pt-20">
        <LoadingSpinner size="md" label="Loading..." />
      </div>
    </div>
  );
}
