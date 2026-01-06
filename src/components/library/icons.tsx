// Library page icons as SVG components

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
      viewBox="0 0 12 8" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M1 1.5L6 6.5L11 1.5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
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
      viewBox="0 0 18 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M9 1V17M1 9H17" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}

// Close icon (X) for modals - rotated plus
export function CloseIcon({ className = "" }: IconProps) {
  return (
    <svg 
      className={className} 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M2 2L14 14M14 2L2 14" 
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
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M18.5 1.5L9 11M18.5 1.5L12.5 18.5L9 11M18.5 1.5L1.5 7.5L9 11" 
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
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="10" 
        cy="10" 
        r="8.5" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <circle cx="7" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
      <path 
        d="M6.5 12.5C7 13.5 8.3 14.5 10 14.5C11.7 14.5 13 13.5 13.5 12.5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}
