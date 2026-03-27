"use client";

import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import NextLink from "next/link";
import { forwardRef, useCallback, useMemo, type ComponentProps } from "react";

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (to === -1) router.back();
        return;
      }
      if (options?.replace) {
        router.replace(to, { scroll: false });
      } else {
        router.push(to, { scroll: false });
      }
    },
    [router],
  );
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  return useMemo(
    () => ({
      pathname,
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
    }),
    [pathname, searchParams],
  );
}

export function useSearchParams(): [
  URLSearchParams,
  (
    params: Record<string, string> | URLSearchParams,
    options?: { replace?: boolean },
  ) => void,
] {
  const raw = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const writable = useMemo(
    () => new URLSearchParams(raw.toString()),
    [raw],
  );

  const setSearchParams = useCallback(
    (
      nextParams: Record<string, string> | URLSearchParams,
      options?: { replace?: boolean },
    ) => {
      const np =
        nextParams instanceof URLSearchParams
          ? nextParams
          : new URLSearchParams(Object.entries(nextParams));
      const qs = np.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [router, pathname],
  );

  return [writable, setSearchParams];
}

export { usePathname } from "next/navigation";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { to: string; scroll?: boolean };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkCompat({ to, scroll, ...props }, ref) {
    return <NextLink ref={ref} href={to} scroll={scroll ?? false} {...props} />;
  },
);
