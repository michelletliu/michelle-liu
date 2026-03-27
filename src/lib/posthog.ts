import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const posthogEnabled = Boolean(POSTHOG_KEY);

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
