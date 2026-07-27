"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/Close";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
import { Info } from "@/components/Info";
import { iconSize } from "@/components/iconSizes";
import { useScrollLock } from "@/utils/useScrollLock";
import { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import { GALLERY_DIALOG_ATTR, useGalleryDialogKeys } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { GALLERY_INFO_TEXT } from "./metArtworks";

const CLOSE_ANIMATION_MS = 300;

/**
 * The room's controls, written down somewhere.
 *
 * Removing the on-screen arrow and zoom buttons left the thumbstick as the only
 * visible affordance, and it is drag-only and unlabelled — so without this
 * nothing tells a reader that the keyboard drives the room at all. Lives here
 * rather than in `metArtworks`, which is Met integration and not a place for
 * copy about this component.
 */
const GALLERY_CONTROLS_TEXT =
  "Use the arrow keys to move between paintings, + and − to zoom, and 0 to reset the view. The stick on the right does the same by dragging.";

export default function GalleryInfoButton() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    closeRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  /**
   * Reopening during the close animation is the case this exists for. `open` is
   * still true for another 300ms, so `setOpen(true)` changes nothing, the
   * effect above never runs again, and the pending timer arrives and shuts a
   * panel the user just asked for. Clearing the timer stops that, and since the
   * effect is not going to fire, the entry state it would have set is set here
   * instead — but only when interrupting, so a fresh open still fades in.
   */
  const openPanel = () => {
    const interrupting = closeTimer.current !== null;
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
    if (interrupting) {
      setVisible(true);
      closeRef.current?.focus();
    }
  };

  const close = () => {
    setVisible(false);
    triggerRef.current?.focus();
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, CLOSE_ANIMATION_MS);
  };

  useGalleryDialogKeys(open, dialogRef, close);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-label="Gallery information"
        aria-haspopup="dialog"
        aria-expanded={open}
        // Persistent room furniture: reaching for it must not fold away the
        // composer the visitor is in the middle of filling in.
        {...{ [KEEP_BAR_OPEN_ATTR]: "" }}
        className={ghostIconButtonClass(
          "md",
          `fixed top-8 right-6 z-50 text-zinc-400 md:right-16 ${GALLERY_FOCUS_RING}`,
        )}
      >
        <Info size={iconSize("toolbar")} />
      </button>

      {open &&
        createPortal(
          <div
            {...{ [GALLERY_DIALOG_ATTR]: "gallery-info" }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          >
            <div
              className={`absolute inset-0 bg-zinc-900/20 transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
              }`}
              onClick={close}
            />
            {/* Same card as the artwork details panel — 16px corners, 32px of
                padding and the soft pop-up shadow — so the two read as one
                surface that the gallery shows things on. */}
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`relative flex w-[550px] max-w-full flex-col rounded-2xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id={titleId} className="text-base text-zinc-900">
                  About this gallery
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close gallery information"
                  className={ghostIconButtonClass(
                    "sm",
                    `-mr-3 -mt-3 text-zinc-400 ${GALLERY_FOCUS_RING}`,
                  )}
                >
                  <CloseIcon size="16px" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                {GALLERY_INFO_TEXT}
              </p>
              <p className="mt-4 border-t border-zinc-100 pt-4 text-sm leading-relaxed text-zinc-500">
                {GALLERY_CONTROLS_TEXT}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
