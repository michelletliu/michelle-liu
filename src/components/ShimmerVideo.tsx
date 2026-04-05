"use client";

import { useState, useCallback, type ComponentProps } from "react";
import clsx from "clsx";
import VideoPlayer from "./VideoPlayer";

type ShimmerVideoProps = ComponentProps<typeof VideoPlayer> & {
  /** Extra classes for the outer wrapper div */
  wrapperClassName?: string;
  /** Border radius class applied to the shimmer overlay */
  rounded?: string;
};

const hasPositionClass = (cls?: string) =>
  !!cls && /\b(absolute|fixed|sticky)\b/.test(cls);

export default function ShimmerVideo({
  wrapperClassName,
  rounded,
  onLoaded,
  ...props
}: ShimmerVideoProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setLoaded(true);
    onLoaded?.();
  }, [onLoaded]);

  return (
    <div className={clsx(!hasPositionClass(wrapperClassName) && "relative", wrapperClassName)}>
      <div
        className={clsx(
          "absolute inset-0 animate-shimmer transition-opacity duration-500 ease-out pointer-events-none z-[1]",
          loaded ? "opacity-0" : "opacity-100",
          rounded,
        )}
      />
      <VideoPlayer {...props} onLoaded={handleLoaded} />
      {/* Transparent overlay to block iOS native video controls from showing */}
      <div className="absolute inset-0 z-[2] pointer-events-none" />
    </div>
  );
}
