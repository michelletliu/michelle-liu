"use client";

import clsx from "clsx";

export type SegmentedPillOption<T extends string = string> = {
  value: T;
  label: string;
};

type SegmentedPillProps<T extends string = string> = {
  options: readonly [SegmentedPillOption<T>, SegmentedPillOption<T>];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Accessible name for the control group */
  "aria-label"?: string;
};

/**
 * Two-option segmented pill (Screen Time Receipt Daily / Weekly).
 * Fully-rounded gray track with a sliding white selected indicator.
 *
 * The indicator is sized to match the filter pill's active chip (32px), so the
 * track is that height plus its 4px inset on each side.
 */
export function SegmentedPill<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SegmentedPillProps<T>) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx(
        "relative flex h-10 w-[209px] shrink-0 items-center justify-center overflow-clip rounded-full bg-[rgba(118,118,128,0.12)] px-[5px] py-1",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-1 left-[5px] w-[calc(50%-5px)] rounded-full bg-white shadow-soft transition-transform duration-200 ease-[cubic-bezier(0.77,0,0.175,1)]"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className="relative min-h-px min-w-px basis-0 h-full grow shrink-0 cursor-pointer"
          >
            <span className="flex size-full flex-row items-center justify-center">
              <span className="relative flex size-full items-center justify-center px-2.5 py-0.5">
                <span
                  className={clsx(
                    "basis-0 grow min-h-px min-w-px overflow-hidden text-ellipsis text-nowrap text-center font-mono text-sm leading-5 text-zinc-900",
                    isActive ? "font-semibold tracking-[-0.08px]" : "font-medium",
                  )}
                >
                  {option.label}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
