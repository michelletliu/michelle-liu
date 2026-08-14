import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

type ArrowDirection = "right" | "down" | "left" | "up";

const DIRECTION_DEG: Record<ArrowDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: -90,
};

export type ArrowProps = {
  className?: string;
  size?: string;
  strokeWidth?: number | string;
  direction?: ArrowDirection;
};

/**
 * Shared flat arrow — one path, sized like ArrowUpRight / Chevron.
 * Prefer `size={iconSize(...)}` from `iconSizes` over CSS `size-*`.
 * Direction via SVG transform so Tailwind rotate-* still composes.
 * Canonical stroke from library ArrowRightIcon.
 */
export function Arrow({
  className = "",
  size,
  strokeWidth,
  direction = "right",
}: ArrowProps) {
  const deg = DIRECTION_DEG[direction];
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
      <g transform={deg ? `rotate(${deg} 12 12)` : undefined}>
        <path
          d="M4 12h16M14 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth={strokeWidth ?? ICON_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

type DirectedArrowProps = Omit<ArrowProps, "direction">;

export function ArrowRightIcon(props: DirectedArrowProps) {
  return <Arrow {...props} direction="right" />;
}

export function ArrowDownIcon(props: DirectedArrowProps) {
  return <Arrow {...props} direction="down" />;
}

export function ArrowLeftIcon(props: DirectedArrowProps) {
  return <Arrow {...props} direction="left" />;
}

export function ArrowUpIcon(props: DirectedArrowProps) {
  return <Arrow {...props} direction="up" />;
}
