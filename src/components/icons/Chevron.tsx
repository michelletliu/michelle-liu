import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

type ChevronDirection = "right" | "down" | "left" | "up";

const DIRECTION_DEG: Record<ChevronDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: -90,
};

export type ChevronProps = {
  className?: string;
  size?: string;
  strokeWidth?: number | string;
  direction?: ChevronDirection;
};

/**
 * Shared chevron — one path, sized like ArrowUpRight / Close.
 * Prefer `size={iconSize("md")}` (see `iconSizes`) over CSS `size-*`.
 * Direction is applied via SVG transform so Tailwind rotate-*
 * on the element (e.g. open/close) still composes correctly.
 */
export function Chevron({
  className = "",
  size,
  strokeWidth,
  direction = "right",
}: ChevronProps) {
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
          d="M9 18L15 12L9 6"
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

type DirectedChevronProps = Omit<ChevronProps, "direction">;

export function ChevronRightIcon(props: DirectedChevronProps) {
  return <Chevron {...props} direction="right" />;
}

export function ChevronLeftIcon(props: DirectedChevronProps) {
  return <Chevron {...props} direction="left" />;
}

export function ChevronDownIcon(props: DirectedChevronProps) {
  return <Chevron {...props} direction="down" />;
}

export function ChevronUpIcon(props: DirectedChevronProps) {
  return <Chevron {...props} direction="up" />;
}
