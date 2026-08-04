"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { Copy } from "lucide-react";
import { CloseIcon } from "@/components/icons/Close";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { useScrollLock } from "@/utils/useScrollLock";
import { GALLERY_DIALOG_ATTR, useGalleryDialogKeys } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import {
  MAX_GALLERY_NAME_LENGTH,
  readLastShare,
  sanitizeGalleryName,
  writeLastShare,
  type LastShareRecord,
} from "./sharedGallery";
import { saveGalleryShare, type SaveGalleryHangInput } from "./saveGalleryShare";

/** Same keyframes / class as Film + the design-system Loading dots specimen. */
const FILM_DOT_STYLE = `@keyframes film-dot-pulse{0%,80%,100%{opacity:.15}40%{opacity:1}}.film-dot{animation:film-dot-pulse 1.4s ease-in-out infinite;opacity:.15}`;

function FilmLoadingDots({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) {
    return <span aria-hidden>…</span>;
  }
  return (
    <span aria-hidden>
      <span className="film-dot" style={{ animationDelay: "0s" }}>
        .
      </span>
      <span className="film-dot" style={{ animationDelay: "0.2s" }}>
        .
      </span>
      <span className="film-dot" style={{ animationDelay: "0.4s" }}>
        .
      </span>
    </span>
  );
}

/** Right-edge fade when a long share URL overflows toward the copy control. */
function ShareUrlField({
  url,
  onCopy,
}: {
  url: string;
  onCopy: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFade = () => {
    const el = inputRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setShowRightFade(overflow && !atEnd);
  };

  useLayoutEffect(() => {
    updateFade();
  }, [url]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        readOnly
        value={url}
        aria-label="Share link"
        onFocus={(e) => e.currentTarget.select()}
        onScroll={updateFade}
        className={`w-full overflow-x-auto rounded-2xl border border-zinc-100 bg-zinc-50 py-2.5 pl-3 pr-10 text-sm leading-relaxed text-zinc-700 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${GALLERY_FOCUS_RING}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-8 z-[1] w-10 bg-gradient-to-l from-zinc-50 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none ${
          showRightFade ? "opacity-100" : "opacity-0"
        }`}
      />
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link"
        className={`absolute right-1.5 top-1/2 z-[2] grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
      >
        <Copy size={14} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

type SaveMode = "create" | "update";

type GallerySaveDialogProps = {
  open: boolean;
  hangs: SaveGalleryHangInput[];
  onClose: () => void;
};

export default function GallerySaveDialog({
  open,
  hangs,
  onClose,
}: GallerySaveDialogProps) {
  const titleId = useId();
  const nameId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();

  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [lastShare, setLastShare] = useState<LastShareRecord | null>(null);
  const [mode, setMode] = useState<SaveMode>("create");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const prior = readLastShare();
    setLastShare(prior);
    setMode(prior ? "update" : "create");
    setName(prior?.name ?? "");
    setError(null);
    setResultUrl(null);
    setCopied(false);
    setSaving(false);
    const frame = requestAnimationFrame(() => {
      setVisible(true);
      nameRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useGalleryDialogKeys(open, dialogRef, () => {
    if (!saving) onClose();
  });

  const close = () => {
    if (saving) return;
    setVisible(false);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || resultUrl) return;
    const cleaned = sanitizeGalleryName(name);
    if (!cleaned) {
      setError("Give this gallery a name.");
      return;
    }
    if (hangs.length === 0) {
      setError("Generate at least one artwork to save.");
      return;
    }
    if (mode === "update" && (!lastShare?.shareId || !lastShare?.editToken)) {
      setError("No previous link in this session. Create a new link.");
      setMode("create");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await saveGalleryShare({
        name: cleaned,
        mode,
        existingShareId: mode === "update" ? lastShare?.shareId : undefined,
        existingEditToken: mode === "update" ? lastShare?.editToken : undefined,
        hangs,
      });
      const record = {
        shareId: result.shareId,
        name: result.name,
        editToken: result.editToken,
      };
      writeLastShare(record);
      setLastShare(record);
      setResultUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!resultUrl) return;
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — select the link and copy manually.");
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      {...{ [GALLERY_DIALOG_ATTR]: "gallery-save" }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
    >
      <div
        className={`absolute inset-0 bg-zinc-900/20 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.16)] transition-all duration-300 ease-out max-md:max-w-[95%] ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-base text-zinc-900">
            {resultUrl ? "Link ready" : "Save gallery"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            disabled={saving}
            aria-label="Close save dialog"
            className={ghostIconButtonClass(
              "sm",
              `-mr-1 !size-auto p-1 text-zinc-400 ${GALLERY_FOCUS_RING}`,
            )}
          >
            <CloseIcon size="16px" />
          </button>
        </div>

        <style>{FILM_DOT_STYLE}</style>

        {resultUrl ? (
          <div className="mt-4 flex flex-col gap-5">
            <p className="text-base leading-relaxed text-zinc-500">
              Send this link to a friend. They can walk the room and download
              artworks.
            </p>
            <ShareUrlField url={resultUrl} onCopy={() => void copyLink()} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className={`rounded-full border border-zinc-200 px-4 py-2.5 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 ${GALLERY_FOCUS_RING}`}
              >
                Preview
              </a>
              <button
                type="button"
                onClick={() => void copyLink()}
                className={`rounded-full bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 ${GALLERY_FOCUS_RING}`}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            {error && (
              <p className="text-base text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <form className="mt-4 flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
            <div className="flex flex-col gap-1.5">
              <input
                ref={nameRef}
                id={nameId}
                type="text"
                value={name}
                maxLength={MAX_GALLERY_NAME_LENGTH}
                disabled={saving}
                placeholder="Name this gallery"
                aria-label="Gallery name"
                onChange={(e) => setName(e.target.value)}
                className={`rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-400 ${GALLERY_FOCUS_RING}`}
              />
            </div>

            {lastShare && (
              <fieldset
                className="flex flex-col gap-4"
                aria-label="Update existing gallery or create a new link"
              >
                <label className="flex cursor-pointer items-start gap-2.5 text-base text-zinc-700">
                  <input
                    type="radio"
                    name="save-mode"
                    className="mt-1"
                    checked={mode === "update"}
                    disabled={saving}
                    onChange={() => setMode("update")}
                  />
                  <span>
                    Update existing gallery
                    <span className="mt-0.5 block text-sm text-zinc-500">
                      Refreshes same link
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-base text-zinc-700">
                  <input
                    type="radio"
                    name="save-mode"
                    className="mt-1"
                    checked={mode === "create"}
                    disabled={saving}
                    onChange={() => setMode("create")}
                  />
                  <span>
                    Create new link
                    <span className="mt-0.5 block text-sm text-zinc-500">
                      Leaves the previous link unchanged
                    </span>
                  </span>
                </label>
              </fieldset>
            )}

            {error && (
              <p className="text-base text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className={`rounded-full px-4 py-2.5 text-base text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className={`rounded-full bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GALLERY_FOCUS_RING}`}
              >
                {saving ? (
                  <span aria-label="Saving">
                    Saving
                    <FilmLoadingDots reduceMotion={reduceMotion} />
                  </span>
                ) : mode === "update" ? (
                  "Update link"
                ) : (
                  "Create link"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
