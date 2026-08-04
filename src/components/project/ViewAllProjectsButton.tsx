import React from "react";
import clsx from "clsx";
import { Button } from "../shared/Button";

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
        className,
      )}
    >
      <Button
        variant="secondary"
        size="md"
        className="relative z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        View all projects
      </Button>
    </div>
  );
}
