import clsx from "clsx";
import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface LiquidGlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: number;
  /** Specimen override — art galleries keep the default full circle. */
  radius?: "full" | "xl";
}

export default function LiquidGlassButton({
  children,
  size = 36,
  radius = "full",
  style,
  className,
  ...props
}: LiquidGlassButtonProps) {
  const isFull = radius === "full";
  return (
    <button
      {...props}
      className={clsx(
        "shadow-glass transition-[border-radius,transform] duration-200 ease-in-out motion-reduce:transition-none hover:scale-105",
        isFull ? "!rounded-full" : "rounded-xl",
        className,
      )}
      style={{
        width: size,
        height: size,
        // Squircle compensation lives in index.css, so only pin the circle.
        ...(isFull ? { borderRadius: "50%" } : null),
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: "inset 0 0 16px -4px rgba(255, 255, 255, 0.5)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </span>
    </button>
  );
}
