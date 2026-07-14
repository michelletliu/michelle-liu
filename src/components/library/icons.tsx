// Library page icons as SVG components
// Stroke standard: strokeWidth 1.5 on a 24-unit viewBox (optical parity with DS Icons).

interface IconProps {
  className?: string;
}

// Downward chevron for shelf dropdown
export function ChevronDownIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="8"
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 3L12 13L22 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Flat horizontal right arrow
export function ArrowRightIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12h16M14 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      />
    </svg>
  );
}

// Close icon (X) for modals
export function CloseIcon({ className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3L21 21M21 3L3 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
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
      />
      <circle cx="8.4" cy="9.6" r="1.5" fill="currentColor" />
      <circle cx="15.6" cy="9.6" r="1.5" fill="currentColor" />
      <path
        d="M7.8 15C8.4 16.2 9.96 17.4 12 17.4C14.04 17.4 15.6 16.2 16.2 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
