import clsx from "clsx";
import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface LiquidGlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: number;
}

export default function LiquidGlassButton({
  children,
  size = 36,
  style,
  className,
  ...props
}: LiquidGlassButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "shadow-glass !rounded-full transition-transform duration-150 ease-out hover:scale-105",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
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
