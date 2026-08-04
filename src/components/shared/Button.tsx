import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonRadius = "circular" | "rectangular";

const GHOST_SURFACE =
  "bg-transparent transition-colors duration-200 hover:bg-zinc-900/5";

export const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "border border-blue-400 bg-blue-500 text-white hover:border-blue-300 hover:bg-blue-400",
  secondary:
    "border border-[#e4e4e7] bg-[#fafafa] text-zinc-700 hover:bg-zinc-900/5",
  tertiary: "bg-zinc-100 text-zinc-700 hover:bg-zinc-500/10",
  ghost: `${GHOST_SURFACE} text-zinc-700`,
};

export const BUTTON_RADIUS_CLASS: Record<ButtonRadius, string> = {
  circular: "rounded-full",
  rectangular: "rounded-xl",
};

export const BUTTON_TEXT_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "gap-1 px-3 py-1 text-sm",
  md: "gap-1.5 px-4 py-1.5 text-base",
  lg: "gap-1.5 px-5 py-2.5 text-base",
};

export const BUTTON_ICON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

export type ButtonClassNameOptions = {
  variant: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  radius?: ButtonRadius;
  className?: string;
};

/** Class recipe shared by `<Button>` and styled `<a>` CTAs. */
export function buttonClassName({
  variant,
  size = "md",
  icon = false,
  radius = "circular",
  className,
}: ButtonClassNameOptions): string {
  return clsx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center transition-[border-radius,background-color,border-color,color] duration-200 ease-in-out motion-reduce:transition-none",
    BUTTON_RADIUS_CLASS[radius],
    BUTTON_VARIANT_CLASS[variant],
    icon ? BUTTON_ICON_SIZE_CLASS[size] : BUTTON_TEXT_SIZE_CLASS[size],
    !icon && variant === "primary"
      ? "font-['Michelle',sans-serif] font-semibold"
      : "font-medium",
    className,
  );
}

export type ButtonProps = {
  variant: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  radius?: ButtonRadius;
  children?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant,
  size = "md",
  icon = false,
  radius = "circular",
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClassName({
        variant,
        size,
        icon,
        radius,
        className,
      })}
    >
      {children}
    </button>
  );
}

export default Button;
