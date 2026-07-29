/**
 * Update the URL path without a Next.js soft-navigation.
 *
 * Opening a library book crosses from `/project/library/full` into
 * `/project/library/full/[bookSlug]` — a different page segment. `router.push`
 * across that boundary remounts the experiment tree (and drops `?shelf=`),
 * which flashes "Loading books…" and replays the page entrance animation.
 * History API updates keep React state intact. The query string is preserved
 * so the shelf-sync effect doesn't fire a second navigation to put it back.
 */

export function withCurrentSearch(
  path: string,
  location: Pick<Location, "search" | "hash"> = typeof window !== "undefined"
    ? window.location
    : { search: "", hash: "" },
): string {
  return `${path}${location.search}${location.hash}`;
}

export function pushPathPreservingSearch(path: string): void {
  const next = withCurrentSearch(path);
  if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    return;
  }
  window.history.pushState(null, "", next);
}

export function replacePathPreservingSearch(path: string): void {
  const next = withCurrentSearch(path);
  if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    return;
  }
  window.history.replaceState(null, "", next);
}

/** Read the live book slug from the address bar (works after shallow history updates). */
export function bookSlugFromPathname(
  pathname: string,
  projectId: string,
  fullscreen: boolean,
): string | undefined {
  if (fullscreen) {
    const match = pathname.match(
      new RegExp(`^/project/${escapeRegExp(projectId)}/full/([^/]+)/?$`),
    );
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }

  const match = pathname.match(
    new RegExp(`^/project/${escapeRegExp(projectId)}/([^/]+)/?$`),
  );
  if (!match?.[1] || match[1] === "full") return undefined;
  return decodeURIComponent(match[1]);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
