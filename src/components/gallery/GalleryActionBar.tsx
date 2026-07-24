"use client";

import { useState, type FormEvent } from "react";

type GalleryActionBarProps = {
  focusedId: string;
  generating: boolean;
  onGenerate: (prompt: string) => Promise<void>;
};

export default function GalleryActionBar({
  focusedId,
  generating,
  onGenerate,
}: GalleryActionBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = prompt.trim();
    if (!next || generating) return;
    setError(null);
    try {
      await onGenerate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  return (
    <div
      data-gallery-no-drag
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 md:pb-8"
    >
      <form
        onSubmit={submit}
        className="flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe art for ${focusedId}…`}
            disabled={generating}
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-60"
            aria-label="Artwork prompt"
          />
          <button
            type="submit"
            disabled={generating || !prompt.trim()}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
        {error && (
          <p className="px-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
