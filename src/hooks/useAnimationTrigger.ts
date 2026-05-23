import { useEffect, useState } from "react";

export function useAnimationTrigger(dependency: unknown): number {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [dependency]);

  return key;
}
