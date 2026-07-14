export type CloseProps = {
  className?: string;
  size?: string;
  strokeWidth?: number;
};

/**
 * Shared close (X) — one path, optically sized like Chevron / Arrow.
 * Path sits in an 8×8 band (M8…16) so it matches Chevron’s compact
 * viewBox footprint; prefer `size={iconSize("touch")}` for sheet dismiss.
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
        d="M8 8L16 16M16 8L8 16"
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
