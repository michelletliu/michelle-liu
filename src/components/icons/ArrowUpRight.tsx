import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

/** Prefer `size={iconSize(...)}` from `iconSizes` over CSS `size-*`. */
export function ArrowUpRight({ className = "", size, strokeWidth }: { className?: string; size?: string; strokeWidth?: number | string }) {
  return (
    <svg
      width={size ?? "1em"}
      height={size ?? "1em"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: "-0.1em" }}
    >
      <path
        d="M5 19L19 5M19 5H8M19 5V16"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
