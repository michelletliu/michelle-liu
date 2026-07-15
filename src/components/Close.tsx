export type CloseProps = {
  className?: string;
  size?: string;
  strokeWidth?: number;
};

/**
 * Shared close (X) — one path, optically sized like Chevron / Arrow.
 * Path spans a 12×12 band (M6…18) to match Chevron’s compact viewBox
 * footprint (M9…15 × M6…18); prefer `size={iconSize("touch")}` for sheet dismiss.
 */
export function Close({ className = "", size, strokeWidth }: CloseProps) {
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
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function CloseIcon(props: CloseProps) {
  return <Close {...props} />;
}
