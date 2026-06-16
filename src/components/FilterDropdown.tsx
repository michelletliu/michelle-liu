import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

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
};

export function FilterDropdown({ options, activeValue, onChange, className, usePortal = false }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Snapshot of button rect captured synchronously before portal mounts
  const snapRef = useRef({ top: 0, left: 0 });

  // Sync position update — called directly in scroll handler, no RAF lag
  const syncPanelPos = () => {
    if (buttonRef.current && panelRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      panelRef.current.style.transform = `translate(${rect.left}px, ${rect.bottom + 4}px)`;
    }
  };

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
        }
      }}
      className={clsx(
        "bg-white rounded-xl shadow-lg border border-gray-100 z-[9999] min-w-[140px]",
        usePortal ? "fixed animate-in fade-in duration-200" : "absolute left-0 top-[calc(100%+4px)] transition-all duration-200 ease-out opacity-100 translate-y-0"
      )}
      style={usePortal ? {
        top: 0,
        left: 0,
        willChange: "transform",
      } : undefined}
    >
      <div className="flex flex-col gap-1 py-1.5 px-1.5">
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
                "flex items-center px-3 py-1 rounded-[10px] transition-colors text-left",
                isActive ? "bg-gray-100" : "hover:bg-gray-50"
              )}
            >
              <span className={clsx(
                "font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em]",
                isActive ? "text-gray-600" : "text-gray-400"
              )}>
                {option.label}
                {option.count !== undefined && (
                  <span className={isActive ? "text-gray-400" : "text-gray-300"}>
                    {" "}({option.count})
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
            snapRef.current = { top: rect.bottom + 4, left: rect.left };
          }
          setOpen(!open);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors cursor-pointer bg-gray-500/10"
      >
        <span className="font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em] whitespace-nowrap text-gray-500">
          {activeOption?.label ?? activeValue}
          {activeOption?.count !== undefined && (
            <span className="text-gray-400"> ({activeOption.count})</span>
          )}
        </span>
        <svg
          className={clsx(
            "size-4 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {usePortal ? (open && createPortal(panel, document.body)) : panel}
    </div>
  );
}
