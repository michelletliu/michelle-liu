"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { Copy } from "lucide-react";
import { CloseIcon } from "@/components/icons/Close";
import { FieldInput, FieldShell } from "@/components/shared/FieldInput";
import { ICON_STROKE_WIDTH } from "@/components/shared/iconSizes";
import { FloatingPanel } from "@/components/shared/FloatingPanel";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { useScrollLock } from "@/utils/useScrollLock";
import { GALLERY_DIALOG_ATTR, useGalleryDialogKeys } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import {
  MAX_CREATOR_NAME_LENGTH,
  MAX_GALLERY_NAME_LENGTH,
  readLastShare,
  sanitizeCreatorName,
  sanitizeGalleryName,
  writeLastShare,
  type LastShareRecord,
} from "./sharedGallery";
import {
  saveGalleryShare,
  type SaveGalleryHangInput,
} from "./saveGalleryShare";

/** Same keyframes / class as Film + the design-system Loading dots specimen. */
const FILM_DOT_STYLE = `@keyframes film-dot-pulse{0%,80%,100%{opacity:.15}40%{opacity:1}}.film-dot{animation:film-dot-pulse 1.4s ease-in-out infinite;opacity:.15}`;

/** Matches ExperimentModal / Library info popover offset under the trigger. */
const POPOVER_OFFSET_PX = 6;
/**
 * Pull the panel past the trigger’s right edge so padded content lines up with
 * the icon button’s right padding (same idea as Library’s -mr on the trigger).
 */
const POPOVER_RIGHT_NUDGE_PX = 10;

/**
 * Compact save fields: muted FieldShell with py-1.5 (not default py-2) so
 * pills sit closer to one-line control height. Action pills use h-9 to match
 * that field row. Scoped overrides on FloatingPanel: gap-3.5 + px-5 + pb-5
 * (Library stays gap-3 / px-5 / pb-5). px/pb at 20px; pt stays FloatingPanel pt-4.
 */
const SAVE_FIELD_SHELL = "rounded-full !py-1.5";
const SAVE_ACTION_BTN =
  "inline-flex h-9 items-center justify-center rounded-full px-4 text-base";
const SAVE_PANEL_BODY = "!gap-3.5 !px-5 !pb-5";

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
    // Shell: !p-2 with !pl-3 (12px) so URL text has a bit more left inset.
    // !pl-0 on the input kills muted field-input’s extra horizontal pad.
    <FieldShell tone="muted" className="rounded-full !p-2 !pl-3">
      <FieldInput
        ref={inputRef}
        readOnly
        value={url}
        aria-label="Share link"
        onFocus={(e) => e.currentTarget.select()}
        onScroll={updateFade}
        className={`overflow-x-auto !pl-0 !pr-8 text-sm text-zinc-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${GALLERY_FOCUS_RING}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-8 z-[1] w-10 bg-gradient-to-l from-zinc-100 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none ${
          showRightFade ? "opacity-100" : "opacity-0"
        }`}
      />
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link"
        className={`absolute right-1.5 top-1/2 z-[2] grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${GALLERY_FOCUS_RING}`}
      >
        {/* CSS px via --icon-stroke-width; Lucide will paint that as a CSS length. */}
        <Copy size={14} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </button>
    </FieldShell>
  );
}

type SaveMode = "create" | "update";

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getDesktopServerSnapshot() {
  return false;
}

type GallerySaveDialogProps = {
  open: boolean;
  hangs: SaveGalleryHangInput[];
  onClose: () => void;
  /** Share trigger — desktop popover anchors under this control. */
  anchorRef: RefObject<HTMLElement | null>;
};

export default function GallerySaveDialog({
  open,
  hangs,
  onClose,
  anchorRef,
}: GallerySaveDialogProps) {
  const titleId = useId();
  const nameId = useId();
  const creatorId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const morphInnerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );

  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [creator, setCreator] = useState("");
  const [lastShare, setLastShare] = useState<LastShareRecord | null>(null);
  const [mode, setMode] = useState<SaveMode>("create");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [morphHeight, setMorphHeight] = useState<number | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Overlay modal scrolls the room away on mobile; desktop popover does not.
  useScrollLock(open && !isDesktop);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      setMorphHeight(null);
      return;
    }
    const prior = readLastShare();
    setLastShare(prior);
    setMode(prior ? "update" : "create");
    setName(prior?.name ?? "");
    setCreator(prior?.creator ?? "");
    setError(null);
    setResultUrl(null);
    setCopied(false);
    setSaving(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Pin the popover under the share control (Library info dropdown pattern).
  useLayoutEffect(() => {
    if (!open || !isDesktop) {
      setPopoverPos(null);
      return;
    }
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + POPOVER_OFFSET_PX,
        right: window.innerWidth - rect.right - POPOVER_RIGHT_NUDGE_PX,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, isDesktop, anchorRef]);

  // Focus after the panel is actually mounted (desktop waits on popoverPos).
  useEffect(() => {
    if (!open) return;
    if (isDesktop && !popoverPos) return;
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, isDesktop, popoverPos]);

  // Morph panel height as form ↔ link-ready content changes.
  // Clear fixed height before measuring so overflow-hidden doesn't clip pb.
  // Use offsetHeight (not getBoundingClientRect) so popoverIn's scale()
  // transform can't under-report height mid-animation.
  useLayoutEffect(() => {
    if (!open || !isDesktop) {
      setMorphHeight(null);
      return;
    }
    const measure = () => {
      const shell = dialogRef.current;
      const body = morphInnerRef.current;
      if (!shell || !body) return;
      const prevHeight = shell.style.height;
      const prevTransition = shell.style.transition;
      shell.style.transition = "none";
      shell.style.height = "auto";
      const next = shell.offsetHeight;
      shell.style.height = prevHeight;
      void shell.offsetHeight;
      shell.style.transition = prevTransition;
      setMorphHeight((prev) => (prev === next ? prev : next));
    };
    const inner = morphInnerRef.current;
    if (!inner) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [open, isDesktop, resultUrl, lastShare, saving, error, mode, name, creator, copied]);

  // Click-outside dismiss — same as ExperimentModal InfoPopover (Library).
  useEffect(() => {
    if (!open || !isDesktop) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (dialogRef.current?.contains(target)) return;
      if (!saving) {
        setVisible(false);
        onClose();
        anchorRef.current?.focus();
      }
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, isDesktop, onClose, saving, anchorRef]);

  useGalleryDialogKeys(open, dialogRef, () => {
    if (saving) return;
    setVisible(false);
    onClose();
    anchorRef.current?.focus();
  });

  const close = () => {
    if (saving) return;
    setVisible(false);
    onClose();
    anchorRef.current?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || resultUrl) return;
    const cleaned = sanitizeGalleryName(name);
    if (!cleaned) {
      setError("Give this gallery a name.");
      return;
    }
    const cleanedCreator = sanitizeCreatorName(creator);
    if (!cleanedCreator) {
      setError("Add your name.");
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
      const result = await saveGalleryShare(
        mode === "update"
          ? {
              mode: "update",
              name: cleaned,
              creator: cleanedCreator,
              hangs,
              existingShareId: lastShare!.shareId,
              existingEditToken: lastShare!.editToken,
            }
          : {
              mode: "create",
              name: cleaned,
              creator: cleanedCreator,
              hangs,
            },
      );
      const record: LastShareRecord = {
        shareId: result.shareId,
        name: result.name,
        creator: result.creator,
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

  if (!open || !isClient) return null;

  const body = (
    <>
      <style>{FILM_DOT_STYLE}</style>

      {resultUrl ? (
        <div className="flex flex-col gap-4">
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
              className={`${SAVE_ACTION_BTN} border border-zinc-200 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 ${GALLERY_FOCUS_RING}`}
            >
              Preview
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className={`${SAVE_ACTION_BTN} bg-zinc-900 font-medium text-white transition-opacity hover:opacity-90 ${GALLERY_FOCUS_RING}`}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          {error && (
            <p className="text-base text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <form className="flex flex-col gap-3.5" onSubmit={(e) => void submit(e)}>
          <FieldShell tone="muted" className={SAVE_FIELD_SHELL}>
            <FieldInput
              ref={nameRef}
              id={nameId}
              type="text"
              value={name}
              maxLength={MAX_GALLERY_NAME_LENGTH}
              disabled={saving}
              placeholder="Name this gallery"
              aria-label="Gallery name"
              onChange={(e) => setName(e.target.value)}
            />
          </FieldShell>

          {/* “by” left-aligns with the Save gallery title — no extra pl. */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-base text-zinc-300" aria-hidden>
              by
            </span>
            <FieldShell
              tone="muted"
              className={`min-w-0 flex-1 ${SAVE_FIELD_SHELL}`}
            >
              <FieldInput
                id={creatorId}
                type="text"
                value={creator}
                maxLength={MAX_CREATOR_NAME_LENGTH}
                disabled={saving}
                placeholder="Your name"
                aria-label="Your name"
                onChange={(e) => setCreator(e.target.value)}
              />
            </FieldShell>
          </div>

          {lastShare && (
            <fieldset
              className="flex flex-col gap-4 py-1"
              aria-label="Update existing gallery or create a new link"
            >
              <label className="flex cursor-pointer items-center gap-3 text-base text-zinc-700">
                <input
                  type="radio"
                  name="save-mode"
                  className="size-4 shrink-0 appearance-none rounded-full border border-zinc-300 bg-white checked:border-blue-600 checked:bg-blue-600 checked:[background-image:radial-gradient(circle,white_35%,transparent_36%)]"
                  checked={mode === "update"}
                  disabled={saving}
                  onChange={() => setMode("update")}
                />
                <span>
                  Update existing gallery
                  <span className="mt-0.5 block text-sm text-zinc-400">
                    Refreshes same link
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-base text-zinc-700">
                <input
                  type="radio"
                  name="save-mode"
                  className="size-4 shrink-0 appearance-none rounded-full border border-zinc-300 bg-white checked:border-blue-600 checked:bg-blue-600 checked:[background-image:radial-gradient(circle,white_35%,transparent_36%)]"
                  checked={mode === "create"}
                  disabled={saving}
                  onChange={() => setMode("create")}
                />
                <span>
                  Create new link
                  <span className="mt-0.5 block text-sm text-zinc-400">
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

          <div className="flex items-center justify-end gap-[2px]">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className={`${SAVE_ACTION_BTN} text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 ${GALLERY_FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !creator.trim()}
              aria-busy={saving || undefined}
              className={`${SAVE_ACTION_BTN} bg-zinc-900 font-medium text-white transition-opacity hover:opacity-90 ${
                saving
                  ? "cursor-wait opacity-100"
                  : "disabled:cursor-not-allowed disabled:opacity-40"
              } ${GALLERY_FOCUS_RING}`}
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
    </>
  );

  if (isDesktop) {
    if (!popoverPos) return null;
    return createPortal(
      <FloatingPanel
        ref={dialogRef}
        variant="popover"
        bodyRef={morphInnerRef}
        bodyClassName={SAVE_PANEL_BODY}
        {...{ [GALLERY_DIALOG_ATTR]: "gallery-save" }}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        data-gallery-share-popover
        className="fixed z-[100] transition-[height] duration-200 ease-out motion-reduce:transition-none"
        style={{
          top: popoverPos.top,
          right: popoverPos.right,
          height: morphHeight ?? undefined,
        }}
      >
        <h2 id={titleId} className="text-base text-zinc-900">
          {resultUrl ? "Link ready!" : "Save gallery"}
        </h2>
        {body}
      </FloatingPanel>,
      document.body,
    );
  }

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
      <FloatingPanel
        ref={dialogRef}
        variant="sheet"
        bodyClassName={SAVE_PANEL_BODY}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative transition-all duration-300 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-base text-zinc-900">
            {resultUrl ? "Link ready!" : "Save gallery"}
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
        {body}
      </FloatingPanel>
    </div>,
    document.body,
  );
}
