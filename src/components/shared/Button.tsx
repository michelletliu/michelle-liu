import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonRadius = "circular" | "rectangular";

export type ButtonClassNameOptions = {
  variant: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  radius?: ButtonRadius;
  className?: string;
};

/**
 * Semantic class recipe only — visuals live in `globals.css` under `.button`.
 * Inspects like agentation's `button.demo-button` (`button.button.secondary`).
 */
export function buttonClassName({
  variant,
  size = "md",
  icon = false,
  radius = "circular",
  className,
}: ButtonClassNameOptions): string {
  return clsx(
    "button",
    variant,
    size,
    icon && "icon",
    radius === "rectangular" && "rectangular",
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
