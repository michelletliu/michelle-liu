import { type RefObject, useLayoutEffect } from "react";

export function useResizeObserver(
  target: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  callback: ResizeObserverCallback,
  enabled: boolean = true,
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(callback);
    const targets = Array.isArray(target) ? target : [target];

    for (const ref of targets) {
      if (ref.current) observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, callback, enabled]);
}
