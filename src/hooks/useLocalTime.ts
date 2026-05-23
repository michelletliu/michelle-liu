import { useEffect, useState } from "react";

export function useLocalTime(timezone: string) {
  const format = (tz: string) => {
    const raw = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const [hStr, mStr] = raw.split(":");
    const h24 = parseInt(hStr, 10);
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const ampm = h24 >= 12 ? "PM" : "AM";
    return { formatted: `${h12}:${mStr} ${ampm}`, h24 };
  };

  const [state, setState] = useState<{ formatted: string; h24: number } | null>(null);

  useEffect(() => {
    setState(format(timezone));
    const id = setInterval(() => setState(format(timezone)), 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return state;
}
