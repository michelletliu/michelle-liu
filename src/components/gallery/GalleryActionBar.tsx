"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, SquarePen } from "lucide-react";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
import MetArtworkPicker from "./MetArtworkPicker";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { stopGalleryKeys } from "./galleryInputGuards";
import { artworkEligibility, type MetArtwork } from "./metArtworks";

type GalleryActionBarProps = {
  generating: boolean;
  onGenerate: (
    prompt: string,
    inspiration?: { objectID: number; title: string },
  ) => Promise<void>;
};

export default function GalleryActionBar({
  generating,
  onGenerate,
}: GalleryActionBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<MetArtwork | null>(null);
  const [expanded, setExpanded] = useState(true);

  const barId = useId();
  const collapseRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"bar" | "pen" | null>(null);
  const reduceMotion = useReducedMotion();

  const blocked =
    inspiration !== null && !artworkEligibility(inspiration).eligible;

  // Focus follows the toggle into whichever control just appeared, so keyboard
  // users are never dropped back onto <body>.
  useEffect(() => {
    if (pendingFocus.current === "bar") collapseRef.current?.focus();
    if (pendingFocus.current === "pen") openRef.current?.focus();
    pendingFocus.current = null;
  }, [expanded]);

  const toggle = (next: boolean) => {
    pendingFocus.current = next ? "bar" : "pen";
    setExpanded(next);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = prompt.trim();
    if (!next || generating || blocked) return;
    setError(null);
    try {
      await onGenerate(
        next,
        inspiration
          ? { objectID: inspiration.objectID, title: inspiration.title }
          : undefined,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const motionProps = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
      };

  return (
    <div
      // The id lives on the wrapper, not the bar itself, so `aria-controls`
      // still resolves to a real element while the bar is collapsed away.
      id={barId}
      data-gallery-no-drag
      // Positioning belongs to the bottom stack in `GalleryPage`, which keeps
      // the nav arrows sitting on top of this bar however tall it gets.
      className="pointer-events-auto flex w-full max-w-xl justify-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="bar"
            {...motionProps}
            className="flex w-full flex-col gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
          >
            <MetArtworkPicker
              selected={inspiration}
              onSelect={setInspiration}
              disabled={generating}
              searchRowTrailing={
                <button
                  ref={collapseRef}
                  type="button"
                  onClick={() => toggle(false)}
                  aria-expanded
                  aria-controls={barId}
                  aria-label="Collapse prompt bar"
                  className={ghostIconButtonClass(
                    "md",
                    `text-zinc-400 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`,
                  )}
                >
                  <ChevronDown size={16} aria-hidden />
                </button>
              }
            />

            <form onSubmit={submit} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={stopGalleryKeys}
                  // No painting id here: `back-2` is internal plumbing and
                  // reads as leaked debug output. Phrased to pair with the
                  // picker's "Search The Met for inspiration…" above it.
                  placeholder={
                    inspiration
                      ? "Describe your subject…"
                      : "Describe the art you want…"
                  }
                  disabled={generating}
                  className={`min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 ${GALLERY_FOCUS_RING}`}
                  aria-label="Artwork prompt"
                />
                <button
                  type="submit"
                  disabled={generating || !prompt.trim() || blocked}
                  className={`shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
                >
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                {generating ? "Generating your image…" : ""}
              </p>
              {error && (
                <p className="px-1 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
            </form>
          </motion.div>
        ) : (
          <motion.button
            key="pen"
            ref={openRef}
            type="button"
            onClick={() => toggle(true)}
            aria-expanded={false}
            aria-controls={barId}
            aria-label="Open prompt bar"
            {...motionProps}
            className={ghostIconButtonClass(
              "md",
              `border border-black/10 bg-white/90 text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md hover:bg-white ${GALLERY_FOCUS_RING}`,
            )}
          >
            <SquarePen size={18} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
