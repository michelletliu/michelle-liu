import React from "react";

type TryItOutButtonProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function TryItOutButton({ href = "/polaroid", onClick, className = "" }: TryItOutButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate in same window
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-blue-500 border border-blue-400 border-solid content-stretch flex gap-1.5 items-center justify-center px-4 py-1.5 relative rounded-full shrink-0 cursor-pointer hover:bg-blue-400 hover:border-blue-300 transition-colors duration-200 ease-out ${className}`}
    >
      <span className="font-['Manrope',sans-serif] font-semibold leading-normal relative shrink-0 text-base text-white whitespace-nowrap">
        Try It Out!
      </span>
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-white shrink-0"
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </button>
  );
}

export default TryItOutButton;



