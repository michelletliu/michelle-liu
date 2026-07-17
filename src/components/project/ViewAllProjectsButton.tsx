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
        className="bg-[#fafafa] border border-[#e4e4e7] border-solid content-stretch flex items-center justify-center px-4 py-1.5 relative rounded-full shrink-0 hover:bg-[#f4f4f5] transition-colors cursor-pointer z-10"
      >
        <span className="font-medium leading-normal relative shrink-0 text-zinc-700 hover:text-zinc-800 text-base">
          View all projects
        </span>
      </button>
    </div>
  );
}




