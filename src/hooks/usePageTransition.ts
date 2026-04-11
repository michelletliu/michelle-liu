import { useState, useEffect } from "react";

type PageTransitionOptions = {
  exitDuration?: number;
};

/**
 * Manages enter/exit page transition state for experiment pages.
 * Returns transition state and a triggerExit function that resolves after the exit animation.
 */
export function usePageTransition({ exitDuration = 280 }: PageTransitionOptions = {}) {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const triggerExit = (): Promise<void> => {
    return new Promise((resolve) => {
      setIsExiting(true);
      setTimeout(resolve, exitDuration);
    });
  };

  const containerClassName = isExiting
    ? "opacity-0 scale-[0.985]"
    : isEntering
    ? "opacity-0 scale-[1.01]"
    : "opacity-100 scale-100";

  const containerStyle = {
    transitionDuration: isExiting ? `${exitDuration}ms` : "300ms",
    transitionTimingFunction: isExiting
      ? "cubic-bezier(0.4, 0, 0.2, 1)"
      : "ease-out",
  };

  return {
    isExiting,
    isEntering,
    triggerExit,
    containerClassName,
    containerStyle,
  };
}
