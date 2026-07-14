export type CloseProps = {
  className?: string;
  size?: string;
  strokeWidth?: number;
};

/**
 * Shared close (X) — one path, sized like ArrowUpRight / Chevron.
 * Canonical stroke from library CloseIcon.
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
        d="M3 3L21 21M21 3L3 21"
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
