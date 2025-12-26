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
      // Default behavior: open in new tab
      window.open(href, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-[#60a5fa] border border-[#3b82f6] border-solid content-stretch flex items-center justify-center px-4 py-1.5 relative rounded-full shrink-0 cursor-pointer hover:bg-[#3b82f6] transition-colors duration-200 ease-out ${className}`}
    >
      <span className="font-['Manrope',sans-serif] font-semibold leading-normal relative shrink-0 text-base text-white tracking-[0.16px] whitespace-nowrap">
        Try It Out! ↗
      </span>
    </button>
  );
}

export default TryItOutButton;

