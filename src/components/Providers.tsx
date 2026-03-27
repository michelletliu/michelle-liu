"use client";

import { Suspense, useEffect, lazy } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { initPostHog, posthog, posthogEnabled } from "@/lib/posthog";
import { initCursorCompatibility } from "@/utils/cursorCompat";

const Agentation = lazy(() =>
  import("agentation").then((mod) => ({ default: mod.Agentation }))
);

function PostHogPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogEnabled) return;
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      pathname,
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      hash: window.location.hash,
    });
  }, [pathname, searchParams]);

  return null;
}

function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("✨ thanks for stopping by! say hi: studio@liumichelle.com");
    initPostHog();
    initCursorCompatibility();
  }, []);

  return (
    <>
      {children}
      <PostHogPageView />
      <Analytics />
      {process.env.NODE_ENV === "development" && (
        <Suspense fallback={null}>
          <Agentation />
        </Suspense>
      )}
    </>
  );
}
