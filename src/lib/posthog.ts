import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Local runs would otherwise pull PostHog's recorder/surveys/web-vitals bundles
// and report dev traffic as real analytics.
export const posthogEnabled =
  Boolean(POSTHOG_KEY) && process.env.NODE_ENV === "production";

let initialized = false;

export function initPostHog() {
  if (!posthogEnabled || initialized) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
  });

  initialized = true;
}

export { posthog };
