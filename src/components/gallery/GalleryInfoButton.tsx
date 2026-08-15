"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight } from "@/components/icons/ArrowUpRight";
import { Info } from "@/components/icons/Info";
import { XLogo } from "@/components/icons/XLogo";
import { buttonClassName } from "@/components/shared/Button";
import { ghostIconButtonClass } from "@/components/shared/ghostIconButton";
import { HorizontalLine } from "@/components/shared/HorizontalLine";
import { iconSize } from "@/components/shared/iconSizes";
import ShimmerImage from "@/components/shared/ShimmerImage";
import ShimmerVideo from "@/components/shared/ShimmerVideo";
import Tooltip from "@/components/shared/Tooltip";
import { muxPosterUrl } from "@/lib/muxPoster";
import { useScrollLock } from "@/utils/useScrollLock";
import { KEEP_BAR_OPEN_ATTR } from "./GalleryActionBar";
import { GALLERY_DIALOG_ATTR, useGalleryDialogKeys } from "./galleryDialog";
import { GALLERY_FOCUS_RING } from "./galleryFocus";
import { GALLERY_INFO_TEXT } from "./metArtworks";

const CLOSE_ANIMATION_MS = 300;

const GALLERY_INFO_MUX_PLAYBACK_ID =
  "UBPHbQ7lhjoY6bt3d8OXMRNBV3FRhr2au00FALYZ02zn4";
const GALLERY_INFO_IMAGE_SRC = muxPosterUrl(GALLERY_INFO_MUX_PLAYBACK_ID, {
  projectId: "gallery",
  width: 1920,
});
const GALLERY_INFO_VIDEO_SRC = `https://stream.mux.com/${GALLERY_INFO_MUX_PLAYBACK_ID}.m3u8`;
const GALLERY_X_LINK =
  "https://x.com/michelletliu/status/2084772214164148607";

function ViewOnXButton({
  className,
  linkRef,
}: {
  className?: string;
  linkRef?: Ref<HTMLAnchorElement>;
}) {
  return (
    <a
      ref={linkRef}
      href={GALLERY_X_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClassName({
        variant: "primary",
        size: "sm",
        className: `!rounded-full [corner-shape:round] ${className ?? ""}`,
      })}
    >
      <span className="leading-normal relative shrink-0 whitespace-nowrap">
        View on
      </span>
      <XLogo size="12px" className="text-white" />
      <span className="inline-flex items-center text-white">
        <ArrowUpRight size="12px" />
      </span>
    </a>
  );
}

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
  "Use the arrow keys to move between paintings, + and − to zoom, and 0 to reset the view.";

const GALLERY_STACK_METADATA = [
  { label: "Interface", tools: ["Next.js", "React"] },
  { label: "Scene", tools: ["Three.js"] },
  { label: "Data", tools: ["The Met API"] },
  { label: "Motion", tools: ["Framer Motion"] },
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
  /** Shared / view-only room: CTA to `/gallery` instead of View on X. */
  viewOnly?: boolean;
};

export default function GalleryInfoButton({
  viewOnly = false,
}: GalleryInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const xLinkRef = useRef<HTMLAnchorElement>(null);
  const createOwnRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollLock(open);

  const focusPrimaryAction = () => {
    if (viewOnly) {
      createOwnRef.current?.focus();
      return;
    }
    xLinkRef.current?.focus();
  };

  // Warm HLS + poster so opening the dialog does not wait on a cold Mux fetch.
  useEffect(() => {
    const manifest = document.createElement("link");
    manifest.rel = "preload";
    manifest.as = "fetch";
    manifest.crossOrigin = "anonymous";
    manifest.href = GALLERY_INFO_VIDEO_SRC;
    document.head.appendChild(manifest);

    const poster = document.createElement("link");
    poster.rel = "preload";
    poster.as = "image";
    poster.href = GALLERY_INFO_IMAGE_SRC;
    document.head.appendChild(poster);

    return () => {
      document.head.removeChild(manifest);
      document.head.removeChild(poster);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setVideoReady(false);
      return;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    focusPrimaryAction();
    // Let the dialog fade in before mounting HLS — same cadence as InfoButton.
    const videoTimer = setTimeout(() => setVideoReady(true), 350);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(videoTimer);
    };
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
      focusPrimaryAction();
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
      {/* Portal: gallery shell is overflow:hidden; hide tip while the dialog is open. */}
      <Tooltip label="Info" position="bottom" disabled={open} portal>
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
            `text-zinc-400 ${open ? "bg-zinc-900/5" : ""} ${GALLERY_FOCUS_RING}`,
          )}
        >
          <Info size={iconSize("md")} />
        </button>
      </Tooltip>

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
              <div className="flex max-h-[calc(100vh-48px)] w-full flex-col gap-4 overflow-y-auto px-7 pb-8 pt-6 max-md:gap-3 max-md:px-7 max-md:py-5">
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 md:items-start md:gap-y-1">
                  <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-[6px]">
                    <h2 id={titleId} className="text-base text-zinc-900">
                      Gallery
                    </h2>
                    <span className="text-base font-normal leading-snug text-[#a1a1aa]">
                      •
                    </span>
                    <span className="text-base text-[#a1a1aa]">2026</span>
                  </div>
                  <p className="col-span-2 row-start-2 text-sm leading-6 text-[#71717a] md:col-span-1 md:text-base">
                    An interactive art gallery to visualize your ideas.
                    <span className="md:hidden">{" "}</span>
                    <br className="hidden md:block" />
                    Thanks to my friends at{" "}
                    <a
                      href="https://pika.art"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-600 no-underline transition-colors hover:text-blue-500"
                    >
                      Pika
                    </a>{" "}
                    for asking me to experiment with this!
                  </p>
                  {viewOnly ? (
                    <Link
                      ref={createOwnRef}
                      href="/gallery"
                      className={`col-start-2 row-start-1 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-solid border-blue-400 bg-blue-500 px-4 py-1.5 font-['Michelle',sans-serif] text-sm font-semibold text-white transition-colors duration-200 ease-out hover:border-blue-300 hover:bg-blue-400 ${GALLERY_FOCUS_RING}`}
                    >
                      Create your own
                    </Link>
                  ) : (
                    <ViewOnXButton
                      linkRef={xLinkRef}
                      className="relative col-start-2 row-start-1 whitespace-nowrap"
                    />
                  )}
                </div>
                <GalleryStackMetadata />
                <div
                  aria-label="Gallery walkthrough video"
                  className="relative mt-1 aspect-[1097/616] w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100"
                >
                  <ShimmerImage
                    alt=""
                    className="absolute object-cover size-full"
                    wrapperClassName="absolute inset-0"
                    rounded="rounded-2xl"
                    src={GALLERY_INFO_IMAGE_SRC}
                  />
                  {videoReady && (
                    <ShimmerVideo
                      src={GALLERY_INFO_VIDEO_SRC}
                      className="absolute object-cover size-full rounded-2xl"
                      wrapperClassName="absolute inset-0"
                      rounded="rounded-2xl"
                      autoPlay
                      muted
                      loop
                      controls={false}
                      muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
                    />
                  )}
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
