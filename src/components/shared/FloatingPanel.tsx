"use client";

import clsx from "clsx";
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Shared floating surface for Library info + Gallery share (and siblings).
 *
 * Library’s dropdown is the source of truth: `rounded-2xl`, `shadow-elevated`,
 * `border-zinc-100`, content `gap-3 px-5 pt-4 pb-5`. Variants only change
 * width / max-height / padding scale — not the chrome vocabulary.
 */
export type FloatingPanelVariant = "popover" | "sheet" | "roomy";

const SHELL: Record<FloatingPanelVariant, string> = {
  /** Anchored dropdown (Library info, Gallery share on desktop). */
  popover: "rounded-2xl w-[420px] max-w-[min(420px,calc(100vw-2rem))] max-h-[70vh]",
  /** Centered mobile sheet / modal panel. */
  sheet: "rounded-2xl w-full max-w-[420px] max-h-[85vh]",
  /** Wide embedded panel (Library fullscreen info). */
  roomy: "rounded-3xl w-[50vw] max-w-[700px]",
};

const BODY: Record<FloatingPanelVariant, string> = {
  popover: "gap-3 overflow-y-auto px-5 pt-4 pb-5",
  sheet: "gap-3 overflow-y-auto px-5 pt-4 pb-5",
  roomy: "gap-4 px-8 pt-6 pb-8",
};

export const floatingPanelShellClassName =
  "bg-white flex flex-col shadow-elevated border border-zinc-100 overflow-hidden transition-all duration-200 ease-out animate-[popoverIn_150ms_ease-out] motion-reduce:transition-none";

type FloatingPanelProps = {
  children: ReactNode;
  variant?: FloatingPanelVariant;
  /** Extra classes on the outer chrome (positioning, z-index, morph height). */
  className?: string;
  /** Extra classes on the padded body. */
  bodyClassName?: string;
  style?: CSSProperties;
  /** Ref for the padded body (e.g. height morph measurement). */
  bodyRef?: React.Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style">;

export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(
  function FloatingPanel(
    {
      children,
      variant = "popover",
      className,
      bodyClassName,
      bodyRef,
      style,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={clsx(floatingPanelShellClassName, SHELL[variant], className)}
        style={style}
        {...rest}
      >
        <div
          ref={bodyRef}
          className={clsx(
            "content-stretch relative flex w-full shrink-0 flex-col items-stretch",
            BODY[variant],
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
