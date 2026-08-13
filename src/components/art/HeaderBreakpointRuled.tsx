import React from "react";
import clsx from "clsx";

type HeaderBreakpointRuledProps = {
  className?: string;
  /** The text to display (e.g., "Sketchbook", "Murals") */
  text: string;
  /** Whether this section is currently active/selected */
  active?: boolean;
};

/**
 * Prod-style section header: label + full-width hairline rule underneath.
 * Used for Sketchbook and Murals; Painting / Conceptual / Graphite use the
 * plain `HeaderBreakpoint` (inset label, no rule).
 */
export default function HeaderBreakpointRuled({
  className,
  text,
  active = false,
}: HeaderBreakpointRuledProps) {
  return (
    <div className={clsx("flex flex-col w-full gap-2", className)}>
      <div className="flex items-center justify-center px-0 py-0 w-full">
        <p
          className={clsx(
            "flex-1 font-normal leading-normal tracking-wide text-base whitespace-pre-wrap",
            active ? "text-zinc-600" : "text-zinc-400",
          )}
        >
          {text}
        </p>
      </div>
      <div className="bg-zinc-100 h-px w-full" />
    </div>
  );
}
