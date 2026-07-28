// Library page icons as SVG components
// Stroke standard: strokeWidth 1.5 + vectorEffect non-scaling-stroke
// so optical weight stays 1.5 CSS px at any display size.
// Chevron → ../Chevron.tsx · Close → ../Close.tsx · Arrow → ../Arrow.tsx

export { ArrowRightIcon, ArrowDownIcon } from "../Arrow";
export { ChevronDownIcon } from "../Chevron";
export { CloseIcon } from "../Close";

interface IconProps {
  className?: string;
}

// Plus icon for add book button
export function PlusIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2V22M2 12H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Paper plane / send icon for submit button
export function SendIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.2 1.8L10.8 13.2M22.2 1.8L15 22.2L10.8 13.2M22.2 1.8L1.8 9L10.8 13.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Smiley face for success state
export function SmileyIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10.2"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="8.4" cy="9.6" r="1.5" fill="currentColor" />
      <circle cx="15.6" cy="9.6" r="1.5" fill="currentColor" />
      <path
        d="M7.8 15C8.4 16.2 9.96 17.4 12 17.4C14.04 17.4 15.6 16.2 16.2 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** 2×2 grid glyph — stroke or filled. Matches Code / Chevron stroke style. */
export function GridIcon({
  className = "",
  size = 20,
  filled = false,
}: IconProps & { size?: number | string; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <path
        d="M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
