"use client";

import clsx from "clsx";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";

export type FilterPillOption = {
  value: string;
  label: string;
  count?: number;
};

type FilterPillsProps = {
  options: FilterPillOption[];
  /** Active option value; `null` hides the sliding indicator */
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
  /** Fade the trailing edge when options overflow the container */
  showOverflowFade?: boolean;
  /** Reflects pinned/selected state for assistive tech (independent of hover preview) */
  pressedValue?: string | null;
  onOptionMouseEnter?: (value: string) => void;
  onOptionMouseLeave?: (value: string) => void;
  onOptionFocus?: (value: string) => void;
  onOptionBlur?: (value: string, event: FocusEvent<HTMLButtonElement>) => void;
};

/**
 * Horizontal filter pills with a sliding active indicator.
 * Same interaction as the About shelf year filters.
 */
export function FilterPills({
  options,
  value,
  onChange,
  className,
  showOverflowFade = false,
  pressedValue,
  onOptionMouseEnter,
  onOptionMouseLeave,
  onOptionFocus,
  onOptionBlur,
}: FilterPillsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorReadyRef = useRef(false);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    height: 0,
    top: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeButton = value ? optionRefs.current[value] : null;

    if (!container) return;

    if (showOverflowFade) {
      setOverflowing(container.scrollWidth > container.clientWidth + 1);
    }

    if (!activeButton) {
      setIndicatorStyle((currentStyle) =>
        currentStyle.opacity === 0 ? currentStyle : { ...currentStyle, opacity: 0 },
      );
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();
    const nextStyle = {
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
      height: activeRect.height,
      top: activeRect.top - containerRect.top,
      opacity: 1,
    };

    setIndicatorStyle((currentStyle) => {
      if (
        currentStyle.left === nextStyle.left &&
        currentStyle.width === nextStyle.width &&
        currentStyle.height === nextStyle.height &&
        currentStyle.top === nextStyle.top &&
        currentStyle.opacity === nextStyle.opacity
      ) {
        return currentStyle;
      }

      return nextStyle;
    });

    if (!indicatorReadyRef.current) {
      requestAnimationFrame(() => {
        indicatorReadyRef.current = true;
        setIndicatorReady(true);
      });
    }
  }, [showOverflowFade, value]);

  const optionKey = options.map((option) => option.value).join("\0");

  useLayoutEffect(() => {
    updateIndicator();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateIndicator);

    if (containerRef.current) observer.observe(containerRef.current);
    options.forEach((option) => {
      const element = optionRefs.current[option.value];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
    // optionKey tracks identity; options is read for current refs/labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid rebinding on new array identity each render
  }, [optionKey, updateIndicator]);

  return (
    <div
      ref={containerRef}
      className={clsx("relative flex items-center gap-1", className)}
    >
      <div
        aria-hidden="true"
        className={clsx(
          "absolute left-0 top-0 z-0 rounded-full bg-zinc-500/10 motion-reduce:transition-none",
          indicatorReady && "transition-[transform,width,opacity] duration-300 ease-out",
        )}
        style={{
          opacity: indicatorStyle.opacity,
          transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
          width: indicatorStyle.width,
          height: indicatorStyle.height,
        }}
      />

      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            data-group-id={option.value}
            ref={(element) => {
              optionRefs.current[option.value] = element;
            }}
            aria-pressed={
              pressedValue !== undefined ? pressedValue === option.value : undefined
            }
            onClick={() => onChange(option.value)}
            onMouseEnter={() => onOptionMouseEnter?.(option.value)}
            onMouseLeave={() => onOptionMouseLeave?.(option.value)}
            onFocus={() => onOptionFocus?.(option.value)}
            onBlur={(event) => onOptionBlur?.(option.value, event)}
            className="group relative z-10 flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1"
          >
            <span
              className={clsx(
                "font-['Michelle',sans-serif] text-base font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ease-out",
                isActive ? "text-zinc-500" : "text-zinc-400 group-hover:text-zinc-500",
              )}
            >
              {option.label}
              {option.count !== undefined && (
                <span className={isActive ? "text-zinc-400" : "text-zinc-300"}>
                  {" "}
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}

      {showOverflowFade && overflowing && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-r from-transparent to-white" />
      )}
    </div>
  );
}
