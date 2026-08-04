import clsx from "clsx";
import type { ReactNode } from "react";

export const SPAN_MID = "col-span-1 lg:col-span-4";
export const SPAN_WIDE = "col-span-1 lg:col-span-6";
export const SPAN_FULL = "col-span-1 lg:col-span-12";

export function SpecimenGrid({ children }: { children: ReactNode }) {
  return (
    <div className="component-specimen-grid grid grid-cols-1 items-stretch justify-items-stretch gap-y-8 lg:grid-cols-12 lg:gap-x-5">
      {children}
    </div>
  );
}

export function Specimen({
  label,
  children,
  className,
  span = SPAN_MID,
  labelPosition = "bottom",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  span?: string;
  labelPosition?: "top" | "bottom";
}) {
  const labelElement = label ? (
    <div className="component-specimen-label pl-1 text-base leading-snug text-zinc-400 text-pretty">
      {label}
    </div>
  ) : null;

  return (
    <div
      className={clsx(
        "component-specimen flex h-full w-full min-w-0 flex-col gap-1.5 self-stretch",
        span,
      )}
    >
      {labelPosition === "top" ? labelElement : null}
      <div
        className={clsx(
          "component-specimen-stage flex min-h-64 w-full min-w-0 flex-1 items-center justify-center gap-4 overflow-visible rounded-2xl bg-zinc-50 px-3 py-3 sm:px-6 sm:py-6",
          className,
        )}
      >
        {children}
      </div>
      {labelPosition === "bottom" ? labelElement : null}
    </div>
  );
}
