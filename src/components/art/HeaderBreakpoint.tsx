import React from "react";
import clsx from "clsx";

type HeaderBreakpointProps = {
  className?: string;
  /** The text to display (e.g., "WORK", "ART") */
  text: string;
  /** Whether this section is currently active/selected */
  active?: boolean;
};

export default function HeaderBreakpoint({ 
  className, 
  text,
  active = false 
}: HeaderBreakpointProps) {
  return (
    <div className={clsx("flex flex-col w-full gap-2", className)}>
      <div className="flex items-center justify-center px-0 py-0 w-full">
        <p 
          className={clsx(
            "flex-1 font-normal leading-5 text-base whitespace-pre-wrap",
            active ? "text-gray-600" : "text-gray-400"
          )}
        >
          {text}
        </p>
      </div>
      <div className="bg-gray-100 h-px w-full" />
    </div>
  );
}
