"use client";

import { useState, useCallback, useEffect, useRef, type ImgHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { detectWhiteImageBorder } from "../../lib/detectWhiteImageBorder";

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

/**
 * Sanity image URLs encode the source dimensions in the asset filename
 * (e.g. `<hash>-1920x1080.webp`). Extract them so we can set `width` /
 * `height` on the underlying `<img>` and have the browser reserve aspect-ratio
 * space before bytes arrive — without this, lazy-loaded images render with
 * zero intrinsic height and the shimmer wrapper collapses to 0px.
 */
const extractSanityDimensions = (
  src: unknown,
): { width?: number; height?: number } => {
  if (typeof src !== "string") return {};
  const match = src.match(/-(\d+)x(\d+)\.[a-z]+(?:\?|$)/i);
  if (!match) return {};
  return { width: Number(match[1]), height: Number(match[2]) };
};

const ShimmerImage = forwardRef<HTMLImageElement, ShimmerImageProps>(
  function ShimmerImage({ wrapperClassName, rounded, className, onLoad, detectWhiteBorder, ...props }, ref) {
    const [loaded, setLoaded] = useState(false);
    const [hasDetectedWhiteBorder, setHasDetectedWhiteBorder] = useState(false);
    const internalImgRef = useRef<HTMLImageElement | null>(null);

    const setImgRef = useCallback(
      (node: HTMLImageElement | null) => {
        internalImgRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLImageElement | null>).current = node;
      },
      [ref],
    );

    useEffect(() => {
      setLoaded(false);
    }, [props.src]);

    // Catch images already cached by the browser, where onLoad fires before listener attaches
    useEffect(() => {
      const img = internalImgRef.current;
      if (img?.complete && img.naturalWidth > 0) {
        setLoaded(true);
      }
    }, [props.src]);

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

    const dims = extractSanityDimensions(props.src);
    // The shimmer overlay is `absolute inset-0`, so it's only visible while
    // the image is loading if the wrapper already has a definite size. For
    // the common gallery / featureSection shape where the image is
    // `w-full h-auto`, give the wrapper the same width and reserve
    // aspect-ratio height inline so the shimmer shows before the lazy-loaded
    // bytes arrive. Other shapes (`w-auto`, `h-full`, fixed `size-*`) are
    // sized by their container or intrinsic dimensions and don't need this.
    const imgFillsWidth =
      !!className && /\bw-full\b/.test(className) && /\bh-auto\b/.test(className);
    const reserveAspectRatio =
      !wrapperClassName &&
      imgFillsWidth &&
      dims.width !== undefined &&
      dims.height !== undefined;
    const wrapperStyle = reserveAspectRatio
      ? { aspectRatio: `${dims.width} / ${dims.height}` }
      : undefined;

    return (
      <div
        className={clsx(
          !hasPositionClass(wrapperClassName) && "relative",
          reserveAspectRatio && "w-full",
          detectWhiteBorder &&
            (hasDetectedWhiteBorder
              ? "shadow-media"
              : "shadow-soft"),
          rounded,
          wrapperClassName,
        )}
        style={wrapperStyle}
      >
        <div
          className={clsx(
            "absolute inset-0 animate-shimmer transition-opacity duration-700 ease-out pointer-events-none z-[1]",
            loaded ? "opacity-0" : "opacity-100",
            rounded,
          )}
        />
        <img
          ref={setImgRef}
          loading="lazy"
          decoding="async"
          width={dims.width}
          height={dims.height}
          className={clsx(className, rounded)}
          onLoad={handleLoad}
          {...props}
        />
        {hasDetectedWhiteBorder && (
          <div
            className={clsx(
              "pointer-events-none absolute inset-0 z-[2] border border-zinc-50",
              rounded,
            )}
          />
        )}
      </div>
    );
  },
);

export default ShimmerImage;
