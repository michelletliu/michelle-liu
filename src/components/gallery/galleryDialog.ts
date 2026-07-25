"use client";

import { useEffect, type RefObject } from "react";

/**
 * Marks an open gallery dialog in the DOM.
 *
 * The action bar collapses itself when a pointer lands outside it, and both
 * dialogs render through a portal — so to that check they are "outside". This
 * attribute is how the bar recognises them and stays put, which matters
 * because a dialog can be dismissed but the composer behind it cannot be
 * brought back without losing the visitor's place.
 */
export const GALLERY_DIALOG_ATTR = "data-gallery-dialog";

/** True while any gallery dialog is mounted. */
export function isGalleryDialogOpen(): boolean {
  return document.querySelector(`[${GALLERY_DIALOG_ATTR}]`) !== null;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Escape-to-close and a Tab focus trap for a gallery dialog.
 *
 * The room binds Escape (leave for home), the arrow keys (step to the next
 * hang) and ⌘± (zoom) on `window`. This listener sits on `document`, which
 * bubbles first, so while a dialog is open none of those reach the room:
 * Escape closes the dialog only, and everything else is swallowed.
 */
export function useGalleryDialogKeys(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Without this, Tab leaves the dialog and walks the room behind it while
      // the panel is still covering it — focus visibly nowhere.
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }

      // The `contains` arm catches focus that is already outside the dialog,
      // which is how it recovers rather than letting Tab wander further away.
      const active = document.activeElement;
      const outside = !dialog.contains(active);
      if (e.shiftKey ? active === first || outside : active === last || outside) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
