"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons/Close";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { HorizontalLine } from "@/components/shared/HorizontalLine";
import { Info } from "@/components/icons/Info";
import { iconSize } from "@/components/shared/iconSizes";
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

const GALLERY_STACK_METADATA = [
  { label: "Interface", tools: ["Next.js", "React"] },
  { label: "Scene", tools: ["Three.js"] },
  { label: "Data", tools: ["The Met API", "Open Access"] },
  { label: "Generation", tools: ["Reve Image"] },
];

function GalleryStackMetadata() {
  return (
    <div className="flex w-full flex-col gap-4">
      <HorizontalLine />
      <div className="hidden w-full grid-cols-4 gap-3 font-['Michelle',sans-serif] text-base font-normal md:grid">
        {GALLERY_STACK_METADATA.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-2">
            <p className="text-sm leading-normal text-[#a1a1aa]">
              {item.label}
            </p>
            <div className="flex flex-col text-[#71717a]">
              {item.tools.map((tool) => (
                <p key={tool} className="truncate leading-normal">
                  {tool}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-1.5 font-['Michelle',sans-serif] text-sm font-normal md:hidden">
        {GALLERY_STACK_METADATA.map((item) => (
          <div key={item.label} className="flex items-baseline gap-6">
            <p className="w-[76px] shrink-0 leading-normal text-[#a1a1aa]">
              {item.label}
            </p>
            <p className="leading-normal tracking-[0.005em] text-[#71717a]">
              {item.tools.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

type GalleryInfoButtonProps = {
  /** Shared / view-only room: CTA to `/gallery` instead of an X close. */
  viewOnly?: boolean;
};

export default function GalleryInfoButton({
  viewOnly = false,
}: GalleryInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const createOwnRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    if (viewOnly) createOwnRef.current?.focus();
    else closeRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [open, viewOnly]);

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
      if (viewOnly) createOwnRef.current?.focus();
      else closeRef.current?.focus();
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
        // Positioned by GalleryPage’s top-right chrome cluster (with Save).
        className={ghostIconButtonClass(
          "md",
          `text-zinc-400 ${GALLERY_FOCUS_RING}`,
        )}
      >
        <Info size={iconSize("md")} />
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
            {/* Match the experiment info surface: title metadata first, then
                the media area, with the source and control notes kept close. */}
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`relative flex max-h-[calc(100vh-48px)] w-[calc(100%*6/12)] max-w-[720px] flex-col overflow-hidden rounded-3xl bg-white max-md:w-[95%] transition-all duration-300 ease-out ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white to-transparent" />
              <div className="flex max-h-[calc(100vh-48px)] w-full flex-col gap-4 overflow-y-auto px-8 pb-8 pt-6 max-md:gap-3 max-md:px-6 max-md:py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-[6px]">
                      <h2 id={titleId} className="text-base text-zinc-900">
                        Gallery
                      </h2>
                      <span className="text-base font-normal leading-snug text-[#a1a1aa]">
                        •
                      </span>
                      <span className="text-base text-[#a1a1aa]">2026</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#71717a] md:text-base">
                      An interactive art gallery to visualize your ideas.
                    </p>
                  </div>
                  {viewOnly ? (
                    <Link
                      ref={createOwnRef}
                      href="/gallery"
                      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 font-['Michelle',sans-serif] text-base font-medium text-white transition-opacity hover:opacity-90 ${GALLERY_FOCUS_RING}`}
                    >
                      Create your own
                    </Link>
                  ) : (
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      aria-label="Close gallery information"
                      className={ghostIconButtonClass(
                        "sm",
                        `-mr-3 -mt-1 text-zinc-400 ${GALLERY_FOCUS_RING}`,
                      )}
                    >
                      <CloseIcon size="16px" />
                    </button>
                  )}
                </div>
                <GalleryStackMetadata />
                <div
                  aria-label="Gallery walkthrough video placeholder"
                  className="relative mt-1 flex aspect-[1097/616] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#f4f4f5_0%,#e4e4e7_52%,#d4d4d8_100%)]" />
                  <span className="relative font-['Michelle',sans-serif] text-sm text-zinc-400">
                    Video placeholder
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#71717a] md:text-base">
                  {GALLERY_CONTROLS_TEXT}
                </p>
                <p className="border-t border-zinc-100 pt-4 text-sm leading-relaxed text-[#a1a1aa]">
                  {GALLERY_INFO_TEXT}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
