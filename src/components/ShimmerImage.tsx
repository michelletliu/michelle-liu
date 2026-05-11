"use client";

import { useState, useCallback, useEffect, type ImgHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { detectWhiteImageBorder } from "../lib/detectWhiteImageBorder";

type ShimmerImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Extra classes for the outer wrapper div */
  wrapperClassName?: string;
  /** Border radius class applied to both shimmer and image (e.g. "rounded-xl") */
  rounded?: string;
  /** Adds a subtle border when the loaded image has white edges. */
  detectWhiteBorder?: boolean;
};

const hasPositionClass = (cls?: string) =>
  !!cls && /\b(absolute|fixed|sticky)\b/.test(cls);

const ShimmerImage = forwardRef<HTMLImageElement, ShimmerImageProps>(
  function ShimmerImage({ wrapperClassName, rounded, className, onLoad, detectWhiteBorder, ...props }, ref) {
    const [loaded, setLoaded] = useState(false);
    const [hasDetectedWhiteBorder, setHasDetectedWhiteBorder] = useState(false);

    useEffect(() => {
      let cancelled = false;

      setHasDetectedWhiteBorder(false);

      if (!detectWhiteBorder || typeof props.src !== "string") return;

      detectWhiteImageBorder(props.src).then((hasWhiteBorder) => {
        if (!cancelled) {
          setHasDetectedWhiteBorder(hasWhiteBorder);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [detectWhiteBorder, props.src]);

    const handleLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        setLoaded(true);
        onLoad?.(e);
      },
      [onLoad],
    );

    return (
      <div
        className={clsx(
          !hasPositionClass(wrapperClassName) && "relative",
          detectWhiteBorder &&
            (hasDetectedWhiteBorder
              ? "shadow-[0_3px_8px_rgba(0,0,0,0.1)]"
              : "shadow-[0_3px_8px_rgba(0,0,0,0.05)]"),
          rounded,
          wrapperClassName,
        )}
      >
        <div
          className={clsx(
            "absolute inset-0 animate-shimmer transition-opacity duration-500 ease-out pointer-events-none z-[1]",
            loaded ? "opacity-0" : "opacity-100",
            rounded,
          )}
        />
        <img
          ref={ref}
          loading="lazy"
          decoding="async"
          className={clsx(className, rounded)}
          onLoad={handleLoad}
          {...props}
        />
        {hasDetectedWhiteBorder && (
          <div
            className={clsx(
              "pointer-events-none absolute inset-0 z-[2] border border-gray-50",
              rounded,
            )}
          />
        )}
      </div>
    );
  },
);

export default ShimmerImage;
