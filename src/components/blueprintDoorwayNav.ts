/**
 * Marks a navigation through the design-system doorway so the destination
 * seal can keep its resting color when the pointer never left the hit target
 * (home stays red; design-system stays gray) until pointerleave.
 *
 * Also remembers which tab opened the doorway so the DS seal returns there
 * (Art / About / Work) instead of always dumping to `/`.
 */

const RETURN_STORAGE_KEY = "ds-doorway-return";

let pendingStickyDoorway = false;
let doorwayReturnPath = "/";

/** Map any pathname to a safe tab root we can return to. */
export function normalizeDoorwayReturnPath(pathname: string): string {
  if (pathname === "/art" || pathname.startsWith("/art/")) return "/art";
  if (pathname === "/about" || pathname.startsWith("/about/")) return "/about";
  return "/";
}

function persistReturnPath(path: string) {
  doorwayReturnPath = path;
  try {
    sessionStorage.setItem(RETURN_STORAGE_KEY, path);
  } catch {
    /* private mode / SSR — in-memory still works for the session */
  }
}

export function markBlueprintDoorwayNav(returnPath?: string) {
  pendingStickyDoorway = true;
  if (returnPath !== undefined) {
    persistReturnPath(normalizeDoorwayReturnPath(returnPath));
  }
}

/** Where the DS seal / footer brand should navigate back to. */
export function getDoorwayReturnPath(): string {
  if (doorwayReturnPath && doorwayReturnPath !== "/") return doorwayReturnPath;
  try {
    const stored = sessionStorage.getItem(RETURN_STORAGE_KEY);
    if (stored) {
      doorwayReturnPath = normalizeDoorwayReturnPath(stored);
      return doorwayReturnPath;
    }
  } catch {
    /* ignore */
  }
  return doorwayReturnPath || "/";
}

export function doorwayReturnLabel(path: string = getDoorwayReturnPath()): string {
  if (path === "/art") return "Back to art";
  if (path === "/about") return "Back to about";
  return "Back to home";
}

/** Read without clearing — pair with clearBlueprintDoorwaySticky(). */
export function peekBlueprintDoorwaySticky(): boolean {
  return pendingStickyDoorway;
}

export function clearBlueprintDoorwaySticky() {
  pendingStickyDoorway = false;
}
