"use client";

import clsx from "clsx";
import { FilmLoadingDots } from "../RotatingLoadingText";

type LoadingSpinnerProps = {
  /** Text shown beside the spinner. Trailing dots are replaced by the DS pulse. */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
};

function stripTrailingDots(label: string) {
  return label.replace(/[.…]+$/u, "").trimEnd();
}

/**
 * Consistent loading indicator used across pages (About, Art, Library, etc.).
 * Ring + label with DS `film-dot-pulse` ellipsis (see design-system Misc specimens).
 * Visuals for the ring live in `globals.css` under `.loading-spinner`.
 */
export default function LoadingSpinner({
  label = "Loading",
  size = "sm",
  className,
}: LoadingSpinnerProps) {
  const text = label === "" ? null : stripTrailingDots(label) || "Loading";

  return (
    <div className={clsx("loading-spinner", size, className)}>
      <div className="loading-spinner-ring" />
      {text !== null && (
        <span className="loading-spinner-label">
          {text}
          <FilmLoadingDots />
        </span>
      )}
    </div>
  );
}

/** Text-only loading line with DS three-dot pulse (no spinner ring). */
export function LoadingText({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const text = stripTrailingDots(label) || "Loading";

  return (
    <span className={className}>
      {text}
      <FilmLoadingDots />
    </span>
  );
}
