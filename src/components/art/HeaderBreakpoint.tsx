import React from "react";
import clsx from "clsx";

type HeaderBreakpointProps = {
  className?: string;
  /** The text to display (e.g., "WORK", "ART") */
  text: string;
  /** Whether this section is currently active/selected */
  active?: boolean;
  /** Optional control aligned with the label (e.g. Gallery View). */
  action?: React.ReactNode;
};

export default function HeaderBreakpoint({
  className,
  text,
  active = false,
  action,
}: HeaderBreakpointProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-3 px-0 py-0 w-full",
        className,
      )}
    >
      <p
        className={clsx(
          "ml-2 flex-1 font-normal leading-normal tracking-wide text-base whitespace-pre-wrap",
          active ? "text-zinc-600" : "text-zinc-400",
        )}
      >
        {text}
      </p>
      {action}
    </div>
  );
}
