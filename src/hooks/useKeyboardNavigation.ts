import { useEffect } from "react";

type KeyboardNavigationOptions = {
  enabled?: boolean;
  ignoreElements?: string;
  preventDefault?: boolean;
};

export function useKeyboardNavigation(
  keyMap: Record<string, () => void>,
  options: KeyboardNavigationOptions = {},
) {
  const {
    enabled = true,
    ignoreElements = 'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    preventDefault = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const handler = keyMap[e.key];
      if (!handler) return;

      if (ignoreElements) {
        const el = e.target as HTMLElement | null;
        if (el?.closest(ignoreElements)) return;
      }

      if (e.repeat) return;
      if (preventDefault) e.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyMap, enabled, ignoreElements, preventDefault]);
}
