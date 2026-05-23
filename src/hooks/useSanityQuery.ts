import { useEffect, useState } from "react";
import { client } from "../sanity/client";
import type { QueryParams } from "@sanity/client";

type UseSanityQueryOptions<T> = {
  enabled?: boolean;
  defaultValue?: T;
};

type UseSanityQueryResult<T> = {
  data: T | undefined;
  loading: boolean;
};

export function useSanityQuery<T>(
  query: string,
  params?: QueryParams,
  options: UseSanityQueryOptions<T> = {},
): UseSanityQueryResult<T> {
  const { enabled = true, defaultValue } = options;
  const [data, setData] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchPromise = params
      ? client.fetch<T>(query, params)
      : client.fetch<T>(query);

    fetchPromise
      .then((result) => {
        if (!cancelled) {
          setData(result ?? defaultValue);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, enabled]);

  return { data, loading };
}
