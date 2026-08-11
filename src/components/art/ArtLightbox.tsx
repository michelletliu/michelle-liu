"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useScrollLock } from "../../utils/useScrollLock";
import { ghostIconButtonClass } from "../shared/ghostIconButton";
import { ICON_STROKE_WIDTH } from "../shared/iconSizes";

export type ArtLightboxItem = {
  imageSrc: string;
  /** Gallery thumbnail already in cache — shown while full res loads */
  previewSrc?: string;
  /** Piece / sketchbook / mural name */
  title?: string;
  /** Medium, size, date, location, etc. — one gray lighter than title */
  detail?: string;
  alt?: string;
};

type ArtLightboxProps = {
  item: ArtLightboxItem | null;
  onClose: () => void;
};

/**
 * Artwork lightbox — mirrors the About photo modal (backdrop, close X,
 * escape / click-outside) without the white polaroid frame.
 */
export default function ArtLightbox({ item, onClose }: ArtLightboxProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const isOpen = !!item;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollLock(isOpen);

  const handleClose = useCallback(() => {
    if (isClosing || !item) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onClose();
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 200);
  }, [isClosing, item, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Reset closing + load state when a new item opens; clear any pending close timers
  useEffect(() => {
    if (!item) {
      setFullImageLoaded(false);
      return;
    }
    setIsClosing(false);
    setFullImageLoaded(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, [item]);

  // Catch cached full-res images where onLoad may have already fired
  useEffect(() => {
    if (!item?.imageSrc) return;
    const img = new Image();
    img.src = item.imageSrc;
    if (img.complete && img.naturalWidth > 0) {
      setFullImageLoaded(true);
    }
  }, [item]);

  if (!item) return null;

  const hasPreview = !!item.previewSrc && item.previewSrc !== item.imageSrc;
  const showImage = hasPreview || fullImageLoaded;

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] isolate flex items-center justify-center p-4 sm:p-6 ${
        isClosing ? "animate-overlay-out" : "animate-overlay-in"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || item.title || "Artwork"}
    >
      <div className="absolute inset-0 bg-zinc-100/95" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`${ghostIconButtonClass("sm", "fixed right-4 top-4 z-10 text-zinc-500")} ${
          isClosing ? "opacity-0" : "animate-[fadeSlideDown_300ms_ease-out]"
        }`}
        aria-label="Close artwork"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth={ICON_STROKE_WIDTH}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>

      <div
        className={`relative z-10 flex max-h-[90vh] max-w-[min(96vw,1100px)] flex-col items-center ${
          isClosing
            ? "animate-modal-scale-out-flex"
            : "animate-modal-scale-in-flex"
        }`}
      >
        {/* Hug content only — empty space around the image closes the lightbox */}
        <div
          className="relative flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative max-h-[min(75vh,820px)] max-w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-elevated">
            {/* Instant preview from the already-cached gallery image */}
            {hasPreview && (
              <img
                src={item.previewSrc}
                alt=""
                aria-hidden
                className="max-h-[min(75vh,820px)] w-auto max-w-full object-contain rounded-2xl"
              />
            )}

            {/* Shimmer while waiting for the first paint (no preview) */}
            {!showImage && (
              <div
                className="h-[min(60vh,520px)] w-[min(80vw,360px)] animate-shimmer rounded-2xl"
                aria-hidden
              />
            )}

            <img
              src={item.imageSrc}
              alt={item.alt || item.title || "Artwork"}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setFullImageLoaded(true)}
              className={clsx(
                "max-h-[min(75vh,820px)] w-auto max-w-full object-contain rounded-2xl transition-opacity duration-300 ease-out",
                hasPreview && "absolute inset-0 size-full",
                !hasPreview && !fullImageLoaded && "absolute",
                fullImageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </div>

          {(item.title || item.detail) && showImage && (
            <p
              className={`mt-4 sm:mt-6 max-w-[min(100%,600px)] px-2 text-center font-['Michelle',sans-serif] text-sm sm:text-base tracking-[0.005em] font-normal leading-relaxed ${
                isClosing
                  ? ""
                  : "animate-[fadeSlideUp_300ms_ease-out_100ms_both]"
              }`}
              style={{ fontVariationSettings: "'opsz' 9" }}
            >
              {item.title && (
                <span className="text-zinc-600">{item.title}</span>
              )}
              {item.detail && (
                <>
                  {item.title && (
                    <span className="inline-block w-1.5" aria-hidden />
                  )}
                  <span className="text-zinc-400">{item.detail}</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
