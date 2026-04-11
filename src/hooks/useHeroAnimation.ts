import { useState, useEffect } from "react";

/**
 * Tracks whether the hero entrance animation has already played this session.
 * On first visit, returns false for ~500ms (to allow animation), then marks as played.
 * On subsequent visits within the session, returns true immediately (skipping animation).
 */
export function useHeroAnimation() {
  const [heroAnimationPlayed, setHeroAnimationPlayed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("heroAnimationPlayed") === "true") {
      setHeroAnimationPlayed(true);
    } else {
      const timer = setTimeout(() => {
        sessionStorage.setItem("heroAnimationPlayed", "true");
        setHeroAnimationPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return heroAnimationPlayed;
}
