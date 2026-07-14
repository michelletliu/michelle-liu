"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../utils/useScrollLock";

export type ArtLightboxItem = {
  imageSrc: string;
  caption?: string;
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
  const isOpen = !!item;

  useScrollLock(isOpen);

  const handleClose = useCallback(() => {
    if (isClosing || !item) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
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

  // Reset closing state when a new item opens
  useEffect(() => {
    if (item) setIsClosing(false);
  }, [item]);

  if (!item) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] isolate flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200 ease-out ${
        isClosing ? "opacity-0" : "animate-[fadeIn_200ms_ease-out]"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || item.caption || "Artwork"}
    >
      <div className="absolute inset-0 bg-zinc-100/95" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-zinc-500 transition-all duration-200 hover:scale-110 ${
          isClosing ? "" : "animate-[fadeSlideDown_300ms_ease-out]"
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
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className={`relative z-10 flex w-full max-h-[90vh] max-w-[min(96vw,1100px)] flex-col items-center transition-all duration-200 ease-out ${
          isClosing ? "opacity-0 scale-95" : "animate-[scaleIn_300ms_ease-out]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex w-full flex-col items-center">
          <img
            src={item.imageSrc}
            alt={item.alt || item.caption || "Artwork"}
            className="max-h-[min(75vh,820px)] w-auto max-w-full object-contain rounded-sm sm:rounded-md"
          />
          {item.caption && (
            <p
              className={`mt-4 sm:mt-6 max-w-[min(100%,600px)] px-2 text-center font-['Michelle',sans-serif] text-sm sm:text-base tracking-[0.005em] font-normal leading-relaxed text-zinc-600 ${
                isClosing
                  ? ""
                  : "animate-[fadeSlideUp_300ms_ease-out_100ms_both]"
              }`}
              style={{ fontVariationSettings: "'opsz' 9" }}
            >
              {item.caption}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
