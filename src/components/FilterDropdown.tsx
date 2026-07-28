import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Chevron } from "./Chevron";
import { iconSize } from "./iconSizes";

export type FilterDropdownOption = {
  value: string;
  label: string;
  count?: number;
};

type FilterDropdownProps = {
  options: FilterDropdownOption[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
  /** Render the panel into document.body to escape stacking contexts */
  usePortal?: boolean;
  /** Start with the menu open (design-system specimens) */
  defaultOpen?: boolean;
};

export function FilterDropdown({
  options,
  activeValue,
  onChange,
  className,
  usePortal = false,
  defaultOpen = false,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Snapshot of button rect captured synchronously before portal mounts
  const snapRef = useRef({ top: 0, left: 0, width: 0 });

  // Sync position update — called directly in scroll handler, no RAF lag
  const syncPanelPos = () => {
    if (buttonRef.current && panelRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      panelRef.current.style.transform = `translate(${rect.left}px, ${rect.bottom + 4}px)`;
      panelRef.current.style.width = `${rect.width}px`;
    }
  };

  // Initialize snapRef if defaultOpen and usePortal are both true
  useEffect(() => {
    if (defaultOpen && usePortal && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      snapRef.current = { top: rect.bottom + 4, left: rect.left, width: rect.width };
      syncPanelPos();
    }
  }, []);

  useEffect(() => {
    if (!usePortal || !open) return;
    window.addEventListener("scroll", syncPanelPos, true);
    window.addEventListener("resize", syncPanelPos);
    return () => {
      window.removeEventListener("scroll", syncPanelPos, true);
      window.removeEventListener("resize", syncPanelPos);
    };
  }, [usePortal, open]);

  // Close on viewport crossing lg breakpoint
  useEffect(() => {
    if (!usePortal || !open) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [usePortal, open]);

  // Click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const outsideContainer = containerRef.current && !containerRef.current.contains(target);
      const outsidePanel = !usePortal || (panelRef.current && !panelRef.current.contains(target));
      if (outsideContainer && outsidePanel) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, usePortal]);

  const activeOption = options.find((o) => o.value === activeValue);

  const panel = (
    <div
      ref={(el) => {
        (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (el && usePortal) {
          // Set position synchronously on mount — before browser paints — so no jank
          el.style.transform = `translate(${snapRef.current.left}px, ${snapRef.current.top}px)`;
          el.style.width = `${snapRef.current.width}px`;
        }
      }}
      className={clsx(
        // ring instead of border so the hairline sits outside the box and doesn't nudge text
        "bg-white rounded-xl shadow-elevated ring-1 ring-zinc-100 z-[9999] animate-in fade-in slide-in-from-top-1 duration-200",
        usePortal ? "fixed" : "absolute left-0 top-[calc(100%+4px)] w-full"
      )}
      style={usePortal ? {
        top: 0,
        left: 0,
        willChange: "transform",
      } : undefined}
    >
      <div className="flex flex-col gap-1 px-1 py-1">
        {options.map((option) => {
          const isActive = activeValue === option.value;
          return (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={clsx(
                // 4px panel inset + 8px option padding matches the trigger's 12px inset.
                "flex items-center px-2 py-1 rounded-[10px] supports-[corner-shape:squircle]:rounded-[1.125rem] transition-colors text-left",
                isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
              )}
            >
              <span className={clsx(
                "font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em]",
                isActive ? "text-zinc-600" : "text-zinc-400"
              )}>
                {option.label}
                {option.count !== undefined && (
                  <span className={isActive ? "text-zinc-400" : "text-zinc-300"}>
                    {" "}{option.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            snapRef.current = { top: rect.bottom + 4, left: rect.left, width: rect.width };
          }
          setOpen(!open);
        }}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 py-1.5 transition-colors duration-200 hover:bg-zinc-500/15"
      >
        <span className="font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em] whitespace-nowrap text-zinc-500">
          {activeOption?.label ?? activeValue}
          {activeOption?.count !== undefined && (
            <span className="text-zinc-400"> {activeOption.count}</span>
          )}
        </span>
        <Chevron
          direction="down"
          size={iconSize("toolbar")}
          className={clsx(
            "text-zinc-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {usePortal ? (open && createPortal(panel, document.body)) : open && panel}
    </div>
  );
}
