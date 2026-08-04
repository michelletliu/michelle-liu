"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon } from "@/components/icons/Close";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { INLINE_LINK_CLASS } from "@/components/shared/inlineLink";
import { GALLERY_DIALOG_ATTR, useGalleryDialogKeys } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { openAccessImageUrl, type MetArtwork } from "./metArtworks";
import { metImageTrimStyle } from "./metImageMat";

/**
 * The full record behind the inspiration strip's ⓘ.
 *
 * The strip can only afford one truncated line of attribution, and that line
 * routinely cuts a Met title mid-parenthesis — "Under the Wave off Kanagawa
 * (Kanagawa oki nami ura), or The Great Wave, from the series…" is the norm,
 * not an outlier. This is where the whole record is legible, credited, and
 * linked back to The Met.
 *
 * Uses `AnimatePresence` rather than the info panel's hand-rolled close timer:
 * reopening mid-exit is a real gesture here, since the ⓘ stays under the
 * pointer the whole time, and interruption is something the animation library
 * already gets right.
 */
export default function MetArtworkDetails({
  artwork,
  open,
  onClose,
}: {
  artwork: MetArtwork;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const src = openAccessImageUrl(artwork);

  useGalleryDialogKeys(open, dialogRef, onClose);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (typeof document === "undefined") return null;

  const card = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          {...{ [GALLERY_DIALOG_ATTR]: "artwork-details" }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/20"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...card}
            className="relative flex w-[550px] max-w-full flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close artwork details"
              className={ghostIconButtonClass(
                "sm",
                `absolute right-3 top-3 text-zinc-400 ${GALLERY_FOCUS_RING}`,
              )}
            >
              <CloseIcon size="16px" />
            </button>

            {src && (
              // Height-constrained rather than boxed to the design's exact
              // 293×200: that ratio is the Great Wave's, and a Dürer engraving
              // or a Degas pastel in the same box would be cropped or letterboxed.
              <span className="inline-block max-h-[200px] max-w-full overflow-hidden rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                <img
                  src={src}
                  alt={artwork.title}
                  decoding="async"
                  style={metImageTrimStyle(artwork.objectID)}
                  className="h-[200px] w-auto max-w-full object-contain"
                />
              </span>
            )}

            <div className="flex w-full flex-col gap-4">
              <p
                id={titleId}
                className="text-base font-medium leading-normal text-zinc-900"
              >
                {artwork.title}
              </p>
              <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2.5 pt-2 text-base leading-normal">
                <DetailRow label="Artist" value={artwork.artistDisplayName} />
                <DetailRow label="Date" value={artwork.objectDate} />
                <DetailRow label="Medium" value={artwork.medium} />
                <DetailRow label="Department" value={artwork.department} />
                {/* Not in the design, and kept anyway: when The Met attaches a
                    reproduction credit it is a condition of use, not a detail. */}
                <DetailRow
                  label="Rights"
                  value={artwork.rightsAndReproduction}
                />
                {artwork.objectURL && (
                  <>
                    <dt className="text-zinc-400">Source</dt>
                    <dd className="min-w-0 text-zinc-600">
                      View on{" "}
                      <a
                        href={artwork.objectURL}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`${INLINE_LINK_CLASS} ${GALLERY_FOCUS_RING}`}
                      >
                        metmuseum.org
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="min-w-0 text-zinc-600">{value}</dd>
    </>
  );
}
