import clsx from "clsx";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { iconSize } from "./iconSizes";

/**
 * Canonical pill field used by password gates and the library submit-book modal.
 *
 * Shell: rounded-full + `border` (1px) — transparent idle, zinc-300 on focus,
 * red-400 on error. No one-off border widths.
 * Input: text-base / zinc-900 / placeholder zinc-400.
 * Height locked to `h-5` + `leading-5` (and `p-0`) so leading/trailing icons
 * share one optical midline with placeholder/value under flex `items-center`.
 */
export const fieldInputClassName =
  "min-w-0 flex-1 appearance-none bg-transparent border-none outline-none p-0 h-5 text-base font-normal leading-5 text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50";

export type FieldShellTone = "surface" | "muted";

type FieldShellProps = {
  children: ReactNode;
  className?: string;
  /** red-400 border (password failure) */
  error?: boolean;
  /** Keep zinc-300 border without focus (e.g. submitted thank-you state) */
  active?: boolean;
  /** surface = white (password); muted = zinc-100 (library modal) */
  tone?: FieldShellTone;
};

export function FieldShell({
  children,
  className,
  error = false,
  active = false,
  tone = "surface",
}: FieldShellProps) {
  return (
    <div
      className={clsx(
        "relative flex w-full shrink-0 items-center rounded-full border border-solid transition-colors duration-200",
        tone === "muted" ? "bg-zinc-100 px-1 py-2" : "bg-white py-2 pl-4 pr-3",
        error
          ? "border-red-400 focus-within:border-red-400"
          : active
            ? "border-zinc-300"
            : "border-transparent focus-within:border-zinc-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Icon slot box — `size-5` matches FieldInput `h-5` / `leading-5` so the
 * icon and text line share one midline inside FieldShell `items-center`.
 * `[&_svg]:block` overrides Arrow’s `inline-block` + verticalAlign so glyphs
 * don’t sit optically low.
 */
export const fieldIconSlotClassName =
  "flex size-5 shrink-0 items-center justify-center [&_svg]:block [&_svg]:shrink-0";

/**
 * Leading mark slot — search/filter magnifier inside FieldShell.
 */
export function FieldLeadingIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "pointer-events-none ml-1.5 text-zinc-400",
        fieldIconSlotClassName,
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

/**
 * Trailing mark slot — password submit arrow (and DS specimen). Apply
 * `fieldIconSlotClassName` directly on `<button type="submit">` when the
 * control itself must be the flex item.
 */
export function FieldTrailingIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx(fieldIconSlotClassName, className)} aria-hidden>
      {children}
    </span>
  );
}

/** Magnifier for search/filter FieldShell — stroke matches Chevron / Close. */
export function SearchMagnifierIcon({
  size = iconSize("md"),
}: {
  size?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="block shrink-0"
      aria-hidden
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M16.5 16.5L20 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type FieldInputProps = ComponentPropsWithoutRef<"input">;

/** Bare `<input>` with canonical field typography — compose inside FieldShell. */
export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  function FieldInput({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(fieldInputClassName, className)} {...props} />;
  },
);
