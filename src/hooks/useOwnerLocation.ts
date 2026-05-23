import { useEffect, useState } from "react";
import { client } from "../sanity/client";
import { OWNER_LOCATION_QUERY } from "../sanity/queries";
import type { OwnerLocation } from "../sanity/types";

export const DEFAULT_CITY = "Los Angeles";
export const DEFAULT_TIMEZONE = "America/Los_Angeles";

export function useOwnerLocation() {
  const [location, setLocation] = useState<{ city: string; timezone: string }>({
    city: DEFAULT_CITY,
    timezone: DEFAULT_TIMEZONE,
  });

  useEffect(() => {
    client
      .fetch<OwnerLocation | null>(OWNER_LOCATION_QUERY)
      .then((data) => {
        if (data?.city && data?.timezone) {
          setLocation({ city: data.city, timezone: data.timezone });
        }
      })
      .catch(() => {});
  }, []);

  return location;
}
