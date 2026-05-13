"use client";

import { useState, useCallback, useRef, useEffect, type ComponentProps } from "react";
import clsx from "clsx";
import VideoPlayer from "./VideoPlayer";

type ShimmerVideoProps = ComponentProps<typeof VideoPlayer> & {
  /** Extra classes for the outer wrapper div */
  wrapperClassName?: string;
  /** Border radius class applied to the shimmer overlay */
  rounded?: string;
  /** Suppress the gray shimmer overlay (e.g. when a poster / fallback image already covers the loading state). */
  disableShimmer?: boolean;
};

const hasPositionClass = (cls?: string) =>
  !!cls && /\b(absolute|fixed|sticky)\b/.test(cls);

export default function ShimmerVideo({
  wrapperClassName,
  rounded,
  onLoaded,
  disableShimmer,
  ...props
}: ShimmerVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasCalledOnLoaded = useRef(false);

  const handleLoaded = useCallback(() => {
    // Only mark as loaded if we haven't already called onLoaded
    if (!hasCalledOnLoaded.current) {
      hasCalledOnLoaded.current = true;
      setLoaded(true);
      onLoaded?.();
    }
  }, [onLoaded]);

  const handleVideoReady = useCallback((videoElement?: HTMLVideoElement) => {
    // Simple approach: remove shimmer when video can play
    if (videoElement && videoElement.readyState >= 3) {
      handleLoaded();
    } else {
      // Wait a bit and check again
      checkTimeoutRef.current = setTimeout(() => {
        handleLoaded();
      }, 1000);
    }
  }, [handleLoaded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={clsx(!hasPositionClass(wrapperClassName) && "relative", wrapperClassName)}>
      {!disableShimmer && (
        <div
          className={clsx(
            "absolute inset-0 animate-shimmer transition-opacity duration-700 ease-out pointer-events-none z-[1]",
            loaded ? "opacity-0" : "opacity-100",
            rounded,
          )}
        />
      )}
      <VideoPlayer {...props} onLoaded={handleVideoReady} />
      {/* Transparent overlay to block iOS native video controls from showing */}
      <div className="absolute inset-0 z-[2] pointer-events-none" />
    </div>
  );
}
