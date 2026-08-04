"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/Close";
import { ghostIconButtonClass } from "@/components/ghostIconButton";
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
    if (mode === "update" && !lastShare?.shareId) {
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
        hangs,
      });
      writeLastShare({ shareId: result.shareId, name: result.name });
      setLastShare({ shareId: result.shareId, name: result.name });
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
              `-mr-2 -mt-1 text-zinc-400 ${GALLERY_FOCUS_RING}`,
            )}
          >
            <CloseIcon size="16px" />
          </button>
        </div>

        {resultUrl ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-base leading-relaxed text-zinc-500">
              Send this link to a friend. They can walk the room and download
              artworks, but not edit.
            </p>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
              <p className="break-all text-sm leading-relaxed text-zinc-700">
                {resultUrl}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void copyLink()}
                className={`rounded-full bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 ${GALLERY_FOCUS_RING}`}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className={`rounded-full border border-zinc-200 px-4 py-2.5 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 ${GALLERY_FOCUS_RING}`}
              >
                Open shared view
              </a>
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
              <label htmlFor={nameId} className="text-sm text-zinc-500">
                Gallery name
              </label>
              <input
                ref={nameRef}
                id={nameId}
                type="text"
                value={name}
                maxLength={MAX_GALLERY_NAME_LENGTH}
                disabled={saving}
                placeholder="Name this gallery"
                onChange={(e) => setName(e.target.value)}
                className={`rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-400 ${GALLERY_FOCUS_RING}`}
              />
            </div>

            {lastShare && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm text-zinc-500">
                  You already saved in this session
                </legend>
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
                      Same link — refreshes “{lastShare.name}”
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
                {saving
                  ? "Saving…"
                  : mode === "update"
                    ? "Update link"
                    : "Create link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
