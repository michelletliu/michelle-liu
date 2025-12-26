import React from "react";
import clsx from "clsx";

type ViewAllProjectsButtonProps = {
  onClick?: () => void;
  className?: string;
};

export default function ViewAllProjectsButton({
  onClick,
  className,
}: ViewAllProjectsButtonProps) {
  return (
    <div
      className={clsx(
        "content-stretch flex flex-col items-center relative shrink-0 w-full",
        className
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className="bg-[#f9fafb] border border-[#e5e7eb] border-solid content-stretch flex items-center justify-center px-5 py-2.5 relative rounded-full shrink-0 hover:bg-[#f3f4f6] transition-colors cursor-pointer z-10"
      >
        <span className="font-medium leading-normal relative shrink-0 text-gray-700 hover:text-gray-800 text-base">
          View all projects
        </span>
      </button>
    </div>
  );
}


