import React from "react";
import { posthog, posthogEnabled } from "../../lib/posthog";
import { Button } from "./Button";

type TryItOutButtonProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function TryItOutButton({
  href = "/polaroid",
  onClick,
  className = "",
}: TryItOutButtonProps) {
  const handleClick = () => {
    if (posthogEnabled) {
      posthog.capture("try_it_out_clicked", { href });
    }
    if (onClick) {
      onClick();
    } else {
      window.location.href = href;
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleClick}
      className={className}
    >
      Try It Out!
    </Button>
  );
}

export default TryItOutButton;
