// Library page icons as SVG components
// Stroke standard: strokeWidth ICON_STROKE_WIDTH + vectorEffect non-scaling-stroke
// so optical weight stays the house weight (see iconSizes.ts) at any display size.
// Chevron → ../Chevron.tsx · Close → ../Close.tsx · Arrow → ../Arrow.tsx

import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

export { ArrowRightIcon, ArrowDownIcon } from "../icons/Arrow";
export { ChevronDownIcon } from "../icons/Chevron";
export { CloseIcon } from "../icons/Close";

interface IconProps {
  className?: string;
  strokeWidth?: number | string;
}

// Plus icon for add book button
export function PlusIcon({ className = "", strokeWidth = ICON_STROKE_WIDTH }: IconProps) {
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
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Square pen icon for compact edit/open-composer affordances.
export function SquarePenIcon({ className = "" }: IconProps) {
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
        d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V12"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M18.375 2.625C19.2034 1.79657 20.5466 1.79657 21.375 2.625C22.2034 3.45343 22.2034 4.79657 21.375 5.625L12.362 14.638C12.1156 14.8844 11.8122 15.0663 11.478 15.168L8.606 16.04C8.21687 16.1582 7.84178 15.7831 7.96 15.394L8.832 12.522C8.93372 12.1878 9.11562 11.8844 9.362 11.638L18.375 2.625Z"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeWidth={ICON_STROKE_WIDTH}
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
        strokeWidth={ICON_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="8.4" cy="9.6" r="1.5" fill="currentColor" />
      <circle cx="15.6" cy="9.6" r="1.5" fill="currentColor" />
      <path
        d="M7.8 15C8.4 16.2 9.96 17.4 12 17.4C14.04 17.4 15.6 16.2 16.2 15"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
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
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Filled circle — radius toggle “switch to circular”. */
export function CircleIcon({
  className = "",
  size = 20,
}: IconProps & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="7.25"
      />
    </svg>
  );
}

/** Filled squircle — radius toggle “switch to rectangular”. */
export function SquircleIcon({
  className = "",
  size = 20,
}: IconProps & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <path
        d="M4.75 8.5C4.75 5.6 5.6 4.75 8.5 4.75H15.5C18.4 4.75 19.25 5.6 19.25 8.5V15.5C19.25 18.4 18.4 19.25 15.5 19.25H8.5C5.6 19.25 4.75 18.4 4.75 15.5V8.5Z"
      />
    </svg>
  );
}
