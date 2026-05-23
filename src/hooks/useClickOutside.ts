import { type RefObject, useEffect } from "react";

export function useClickOutside(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onClickOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent) {
      const refs = Array.isArray(ref) ? ref : [ref];
      const isOutside = refs.every(
        (r) => r.current && !r.current.contains(event.target as Node),
      );
      if (isOutside) onClickOutside();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, onClickOutside, enabled]);
}
