"use client";

import { useEffect, useState } from "react";

/** Same keyframes / class as Film + the design-system Loading dots specimen (see globals.css). */
export const FILM_DOT_STYLE = `@keyframes film-dot-pulse{0%,80%,100%{opacity:.15}40%{opacity:1}}.film-dot{animation:film-dot-pulse 1.4s ease-in-out infinite;opacity:.15}`;

export const FILM_LOADING_PHRASES = [
  "film reel loading",
  "developing photos",
  "rolling the negatives",
  "dusting off the enlarger",
  "mixing the chemicals",
  "checking the light meter",
  "hanging prints to dry",
] as const;

/** Gallery generate — same cadence as Film, quirky 1–3 word art phrases. */
export const GALLERY_LOADING_PHRASES = [
  "Mixing paints",
  "Finding light",
  "Stretching linen",
  "Layering color",
  "Warming varnish",
  "Composing",
  "Sketching",
] as const;

/** Fine Art `/art/gallery` room load — same cadence as Film. */
export const PAINTING_GALLERY_LOADING_PHRASES = [
  "hanging the paintings",
  "leveling the frames",
  "warming the varnish",
  "stretching fresh linen",
  "mixing the pigments",
  "adjusting the spotlights",
] as const;

export function FilmLoadingDots({
  reduceMotion = false,
}: {
  reduceMotion?: boolean;
}) {
  if (reduceMotion) {
    return <span aria-hidden>…</span>;
  }
  return (
    <span aria-hidden>
      <span className="film-dot" style={{ animationDelay: "0s" }}>
        .
      </span>
      <span className="film-dot" style={{ animationDelay: "0.2s" }}>
        .
      </span>
      <span className="film-dot" style={{ animationDelay: "0.4s" }}>
        .
      </span>
    </span>
  );
}

/**
 * Rotating loading copy + staggered film-dot-pulse ellipsis.
 * Matches Film: swap every 2000ms with a 200ms opacity fade; Film does not
 * pause phrase rotation for reduced motion (only gallery dots may freeze).
 */
export function RotatingLoadingText({
  phrases,
  reduceMotion = false,
  className,
  as: Tag = "span",
  "aria-label": ariaLabel,
}: {
  phrases: readonly string[];
  reduceMotion?: boolean;
  className?: string;
  as?: "span" | "p";
  "aria-label"?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (phrases.length <= 1) return;
    let cancelled = false;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      if (cancelled) return;
      setFade(false);
      if (fadeTimeout !== undefined) clearTimeout(fadeTimeout);
      fadeTimeout = setTimeout(() => {
        if (cancelled) return;
        setIdx((i) => (i + 1) % phrases.length);
        setFade(true);
      }, 200);
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (fadeTimeout !== undefined) clearTimeout(fadeTimeout);
    };
  }, [phrases]);

  return (
    <Tag className={className} aria-label={ariaLabel}>
      <span
        className="inline-block transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {phrases[idx]}
      </span>
      <FilmLoadingDots reduceMotion={reduceMotion} />
    </Tag>
  );
}
