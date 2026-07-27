/** Pixels of movement before a press becomes a drag (and captures the pointer). */
export const DRAG_DEADZONE_PX = 7;

/** Skip drag when the event starts on interactive UI (frames, logo back, links). */
export function isGalleryNoDragTarget(target: EventTarget | null): boolean {
  if (target == null || typeof (target as Element).closest !== "function") {
    return false;
  }
  return (
    (target as Element).closest("button, a, [data-gallery-no-drag]") != null
  );
}

export function dragPastDeadzone(
  dx: number,
  dy: number,
  deadzone = DRAG_DEADZONE_PX,
): boolean {
  return Math.hypot(dx, dy) >= deadzone;
}
