import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

export type CodeProps = {
  className?: string;
  size?: string;
  strokeWidth?: number | string;
};

/**
 * Code slash (`</>`) — stroke icon matching Chevron / Close / Arrow.
 * Prefer `size={iconSize("md")}` (see `iconSizes`) over CSS `size-*`.
 */
export function Code({ className = "", size, strokeWidth }: CodeProps) {
  return (
    <svg
      width={size ?? "1em"}
      height={size ?? "1em"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: "-0.1em" }}
      aria-hidden
    >
      <path
        d="M7 6.5L1.5 12L7 17.5M17 6.5L22.5 12L17 17.5M14 3.5L10 20.5"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function CodeIcon(props: CodeProps) {
  return <Code {...props} />;
}
