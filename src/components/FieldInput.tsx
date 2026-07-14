import clsx from "clsx";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

/**
 * Canonical pill field used by password gates and the library submit-book modal.
 *
 * Shell: rounded-full + `border` (1px) — transparent idle, zinc-300 on focus,
 * red-400 on error. No one-off border widths.
 * Input: text-base / zinc-900 / placeholder zinc-400.
 */
export const fieldInputClassName =
  "min-w-0 flex-1 bg-transparent border-none outline-none text-base leading-5 text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50";

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

type FieldInputProps = ComponentPropsWithoutRef<"input">;

/** Bare `<input>` with canonical field typography — compose inside FieldShell. */
export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  function FieldInput({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(fieldInputClassName, className)} {...props} />;
  },
);
