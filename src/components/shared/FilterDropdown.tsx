import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Chevron } from "../icons/Chevron";
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
      panelRef.current.style.minWidth = `${rect.width}px`;
      panelRef.current.style.width = "auto";
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
          el.style.minWidth = `${snapRef.current.width}px`;
          el.style.width = "auto";
        }
      }}
      className={clsx(
        "filter-dropdown-panel",
        usePortal ? "portal" : "inline",
      )}
      style={usePortal ? {
        top: 0,
        left: 0,
        willChange: "transform",
      } : undefined}
    >
      <div className="filter-dropdown-options">
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
                "filter-dropdown-option",
                isActive && "active",
              )}
            >
              <span className="filter-dropdown-option-label">
                {option.label}
                {option.count !== undefined && (
                  <span className="filter-dropdown-option-count">
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
    <div className={clsx("filter-dropdown", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            snapRef.current = { top: rect.bottom + 4, left: rect.left, width: rect.width };
          }
          setOpen(!open);
        }}
        className="filter-dropdown-trigger"
      >
        <span className="filter-dropdown-trigger-label">
          {activeOption?.label ?? activeValue}
          {activeOption?.count !== undefined && (
            <span className="filter-dropdown-trigger-count"> {activeOption.count}</span>
          )}
        </span>
        <Chevron
          direction="down"
          size={iconSize("md")}
          className={clsx(
            "filter-dropdown-chevron",
            open && "open",
          )}
        />
      </button>

      {usePortal ? (open && createPortal(panel, document.body)) : open && panel}
    </div>
  );
}
