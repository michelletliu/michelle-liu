import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

export type ExpandProps = {
  className?: string;
  size?: string;
  strokeWidth?: number | string;
};

/**
 * Shared expand-corners glyph — same path as `Expand.svg` / project modals.
 * Prefer `size={iconSize(...)}` from `iconSizes` over CSS `size-*`.
 */
export function Expand({ className = "", size, strokeWidth }: ExpandProps) {
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
        d="M10 4H4V10"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M4 4L10 10"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M14 20H20V14"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M20 20L14 14"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function ExpandIcon(props: ExpandProps) {
  return <Expand {...props} />;
}
