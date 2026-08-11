import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

type LinkIconProps = {
  className?: string;
  size?: string;
};

export function LinkIcon({ className = "", size }: LinkIconProps) {
  return (
    <svg
      width={size ?? "1.1em"}
      height={size ?? "1.1em"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" vectorEffect="non-scaling-stroke" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default LinkIcon;
