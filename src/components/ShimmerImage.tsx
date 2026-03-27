"use client";

import { useState, useCallback, type ImgHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ShimmerImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Extra classes for the outer wrapper div */
  wrapperClassName?: string;
  /** Border radius class applied to both shimmer and image (e.g. "rounded-xl") */
  rounded?: string;
};

const hasPositionClass = (cls?: string) =>
  !!cls && /\b(absolute|fixed|sticky)\b/.test(cls);

const ShimmerImage = forwardRef<HTMLImageElement, ShimmerImageProps>(
  function ShimmerImage({ wrapperClassName, rounded, className, onLoad, ...props }, ref) {
    const [loaded, setLoaded] = useState(false);

    const handleLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        setLoaded(true);
        onLoad?.(e);
      },
      [onLoad],
    );

    return (
      <div className={clsx(!hasPositionClass(wrapperClassName) && "relative", wrapperClassName)}>
        <div
          className={clsx(
            "absolute inset-0 animate-shimmer transition-opacity duration-500 ease-out pointer-events-none z-[1]",
            loaded ? "opacity-0" : "opacity-100",
            rounded,
          )}
        />
        <img
          ref={ref}
          className={clsx(className, rounded)}
          onLoad={handleLoad}
          {...props}
        />
      </div>
    );
  },
);

export default ShimmerImage;
