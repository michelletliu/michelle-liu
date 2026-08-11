import clsx from "clsx";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { iconSize, ICON_STROKE_WIDTH } from "./iconSizes";

/**
 * Canonical pill field used by password gates and the library submit-book modal.
 * Visuals live in `globals.css` under `.field-shell` / `.field-input`.
 */
export const fieldInputClassName = "field-input";

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
        "field-shell",
        tone,
        error && "error",
        !error && active && "active",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Icon slot box — matches FieldInput height so glyphs share one midline. */
export const fieldIconSlotClassName = "field-icon-slot";

/** Leading mark slot — search/filter magnifier inside FieldShell. */
export function FieldLeadingIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx("field-leading-icon", fieldIconSlotClassName, className)}
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

/**
 * Magnifier for search/filter FieldShell — stroke matches Chevron / Close.
 *
 * The lens fills nearly the whole box on purpose. Next to a filled mark of the
 * same nominal size (the gallery pill pairs it with `Info`), a small ring in a
 * roomy box reads as a lighter icon even at an identical stroke, so the lens is
 * sized to sit within a stroke half-width of the viewBox at the smallest call
 * site (12px) and the handle reaches the corner from there.
 */
export function SearchMagnifierIcon({
  size = iconSize("md"),
}: {
  size?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="3.25 3.25 17.5 17.5"
      fill="none"
      className="block shrink-0"
      aria-hidden
    >
      <circle
        cx="11.4"
        cy="11.4"
        r="6.95"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M16.35 16.35L19.9 19.9"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
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
    return (
      <input
        ref={ref}
        className={clsx(fieldInputClassName, className)}
        {...props}
      />
    );
  },
);
