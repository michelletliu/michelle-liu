/**
 * Marks a navigation through the design-system doorway so the destination
 * page's hover-mode seal can suppress a sticky gray morph when the pointer
 * never left the logo hit target.
 */
let pendingStickyDoorway = false;

export function markBlueprintDoorwayNav() {
  pendingStickyDoorway = true;
}

/** Read without clearing — pair with clearBlueprintDoorwaySticky(). */
export function peekBlueprintDoorwaySticky(): boolean {
  return pendingStickyDoorway;
}

export function clearBlueprintDoorwaySticky() {
  pendingStickyDoorway = false;
}
