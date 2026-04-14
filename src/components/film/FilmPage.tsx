"use client";

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import imgLogo from '../../assets/logo.png';
import InfoButton from '../InfoButton';
import { useExperimentProject } from '../../hooks/useExperimentProject';
import type { FilmPhoto } from './film-data';
import {
  lerpLinemarkTowardTarget,
  transformMarkHoverBonus,
  transformScale,
} from './film-linemark-scale';
const BASE_WIDTH = 120;
const GAP = 4;
/** Lift film strip above vertical center: fixed + vh fraction (+ mobile) so timeline text never crowds photos. */
const FILM_STRIP_VERTICAL_NUDGE_PX = 22;
const FILM_STRIP_VERTICAL_NUDGE_VH = 0.018;
const FILM_STRIP_VERTICAL_NUDGE_MOBILE_PX = -8;
/**
 * md+ (vw ≥ 640): strip midpoint sits between play band bottom and top of timeline stack.
 * Timeline `bottom` uses clamp + vh (see JSX); these constants approximate hash row + captions above that inset.
 */
const FILM_DESKTOP_TIMELINE_CHROME_ABOVE_BOTTOM_PX = 172;
const FILM_MOBILE_TIMELINE_CHROME_ABOVE_BOTTOM_PX = 148;
/** ~`min-h-10` play/rewind control height for band math. */
const FILM_PLAY_CONTROL_APPROX_H_PX = 40;

/** Mirrors timeline `bottom-[clamp(...)]` so strip midY matches real layout. */
function filmTimelineBottomInsetPx(vh: number, mdUp: boolean): number {
  const rem = 16;
  if (mdUp) {
    return Math.round(
      Math.min(
        Math.max(0.375 * rem + vh * 0.025, 0.75 * rem),
        3.25 * rem,
      ),
    );
  }
  return Math.round(
    Math.min(
      Math.max(0.25 * rem + vh * 0.02, 0.5 * rem),
      1.75 * rem,
    ),
  );
}

function filmDesktopBottomReservePx(vh: number): number {
  return (
    filmTimelineBottomInsetPx(vh, true) + FILM_DESKTOP_TIMELINE_CHROME_ABOVE_BOTTOM_PX
  );
}

function filmMobileBottomReservePx(vh: number): number {
  return (
    filmTimelineBottomInsetPx(vh, false) + FILM_MOBILE_TIMELINE_CHROME_ABOVE_BOTTOM_PX
  );
}

/** Mirrors `top: clamp(..., … + vh, …)` on the play bar so strip layout stays aligned. */
function filmPlayBarTopPx(vh: number, mdUp: boolean): number {
  const rem = 16;
  if (mdUp) {
    return Math.min(
      Math.max(1.625 * rem + vh * 0.07, 2.75 * rem),
      7.25 * rem,
    );
  }
  return Math.min(
    Math.max(1.625 * rem + vh * 0.05, 2.25 * rem),
    10 * rem,
  );
}

function filmPlayBandBottomPx(vw: number, vh: number): number {
  return filmPlayBarTopPx(vh, vw >= 640) + FILM_PLAY_CONTROL_APPROX_H_PX;
}
/** First paint only: stagger each frame’s entrance left → right. */
const FILM_INTRO_STAGGER_MS = 60;
const FILM_INTRO_FADE_MS = 520;
const FILM_INTRO_SLIDE_PX = 18;
/**
 * Film strip “frame” widths (same idea as clip inset 72↔480, but real layout width — no clip-path).
 * Inactive ≈ collapsed width; under the focal slot ≈ expanded (capped on small viewports / portrait).
 */
const FILM_FRAME_W_COLLAPSED = 72;
const FILM_FRAME_W_EXPANDED = 480;
/**
 * How far (in photo slots, fractional) from focal before a frame is fully collapsed.
 * Must be > ~1.5 or neighbors at ±1 slot read almost fully collapsed when one frame is centered.
 * Larger = gentler size falloff for frames left/right of the visual center.
 */
const FILM_FRAME_WIDEN_SLOT_RANGE = 2.12;
/** Softer spring for arrow keys so each step feels less abrupt. */
const FILM_KEYBOARD_SNAP_SPRING = { stiffness: 175, damping: 36 };
/** Release snap should glide a bit more softly than keyboard stepping. */
const FILM_IDLE_SNAP_SPRING = { stiffness: 220, damping: 28 };
/** After wheel / trackpad scroll settles, snap to the nearest photo (grid-aligned scroll). */
const FILM_SCROLL_IDLE_SNAP_MS = 80;
/** After autoplay advances, hold before moving to the next photo. */
const FILM_AUTOPLAY_HOLD_MS = 1200;
/** Total dwell per photo while autoplay is on (hold + transition breathing room). */
const FILM_AUTOPLAY_ADVANCE_MS = FILM_AUTOPLAY_HOLD_MS + 1200;
/** Slightly softer than keyboard stepping so autoplay feels less abrupt. */
const FILM_AUTOPLAY_SNAP_SPRING = { stiffness: 160, damping: 34 };
/** Ignore wheel for this long after each autoplay `scrollTop` — some UAs emit wheel after programmatic scroll. */
const FILM_AUTOPLAY_WHEEL_GRACE_MS = 320;
/**
 * Edge fades: same multi-stop curve as art `EdgeGradients` (mural gallery), using #fafafa
 * so the film page background matches.
 */
const FILM_EDGE_GRADIENT_LEFT =
  'linear-gradient(to right, rgb(250,250,250) 0%, rgba(250,250,250,0.97) 8%, rgba(250,250,250,0.9) 16%, rgba(250,250,250,0.8) 25%, rgba(250,250,250,0.65) 34%, rgba(250,250,250,0.5) 45%, rgba(250,250,250,0.35) 55%, rgba(250,250,250,0.2) 70%, rgba(250,250,250,0.08) 85%, transparent 100%)';
const FILM_EDGE_GRADIENT_RIGHT =
  'linear-gradient(to left, rgb(250,250,250) 0%, rgba(250,250,250,0.97) 8%, rgba(250,250,250,0.9) 16%, rgba(250,250,250,0.8) 25%, rgba(250,250,250,0.65) 34%, rgba(250,250,250,0.5) 45%, rgba(250,250,250,0.35) 55%, rgba(250,250,250,0.2) 70%, rgba(250,250,250,0.08) 85%, transparent 100%)';
/** Multiplier on wheel delta → `scrollTop` (lower = slower travel per scroll). */
const FILM_WHEEL_SCROLL_FACTOR = 0.92;
const CENTER_SCALE = 2.2;
const MOBILE_BASE_WIDTH = 72;
/** Portrait center scale on narrow viewports (landscape uses width cap below). */
const MOBILE_PORTRAIT_CENTER_SCALE = 1.92;
/** While scrolling, lerp layout toward the target (reduces jitter). Keep well below 1 so we don’t lag forever when idle. */
const FILM_LAYOUT_SMOOTH_K_SCROLL = 0.52;
/** When `galleryX` is nearly still, snap layout in one step so strip alignment and distance-based scales stay correct. */
const FILM_LAYOUT_VELOCITY_IDLE = 28;
/** During framer snap, use 1 so layout tracks `galleryX` exactly — avoids double-easing (tween + lerp) feeling bouncy. */
const FILM_LAYOUT_SMOOTH_K_SNAP = 1;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Spring for timeline / strip taps when no override is passed.
 * Larger index gap → lower stiffness (slower crossing) and a touch more damping (less bounce).
 */
function filmGallerySpringForSlotDistance(delta: number): {
  stiffness: number;
  damping: number;
} {
  const d = Math.max(0, Math.abs(delta));
  if (d <= 0) {
    return { stiffness: 360, damping: 33 };
  }
  const t = Math.min(1, (d - 1) / 5);
  return {
    stiffness: Math.round(lerp(360, 95, t)),
    damping: Math.round(lerp(33, 42, t)),
  };
}

function filmSafeAspectRatio(ar: number | undefined): number {
  const n = typeof ar === 'number' && Number.isFinite(ar) ? ar : 1;
  return Math.min(3, Math.max(0.35, n));
}

/** Max rendered width (px) for a landscape frame at the center; mobile leaves room for neighbors. */
function landscapeCenterMaxPx(vw: number): number {
  if (vw < 640) return vw * 0.64;
  return 495;
}

/**
 * Width multiplier (`× bw`) and opacity from fractional scroll slot — smooth handoff between neighbors
 * (like easing clip inset) without any clip-path or second transform scale.
 */
function frameScaleAndOpacity(
  index: number,
  focalSlot: number,
  vw: number,
  aspectRatio: number,
  bw: number,
): { scale: number; opacity: number } {
  const distSlots = Math.abs(focalSlot - index);
  const u = Math.min(1, distSlots / FILM_FRAME_WIDEN_SLOT_RANGE);
  const widenT = smoothstep(1 - u);

  const wCollapsed = Math.min(FILM_FRAME_W_COLLAPSED, bw);
  const isLandscape = aspectRatio > 1;
  const wExpanded = Math.min(
    FILM_FRAME_W_EXPANDED,
    isLandscape
      ? landscapeCenterMaxPx(vw)
      : bw * (vw < 640 ? MOBILE_PORTRAIT_CENTER_SCALE : CENTER_SCALE),
  );
  const wPx = lerp(wCollapsed, wExpanded, widenT);
  const scale = wPx / bw;
  const opacity = lerp(0.5, 1, widenT);
  return { scale, opacity };
}

function getLayoutInfo(vw: number, photoCount: number) {
  const mobile = vw < 640;
  const bw = mobile ? MOBILE_BASE_WIDTH : BASE_WIDTH;
  const vpCenter = vw / 2;
  if (photoCount <= 0) {
    return {
      bw,
      vpCenter,
      virtualTotal: 0,
      startOff: vpCenter - bw / 2,
      endOff: vpCenter - bw / 2,
    };
  }
  const virtualTotal = photoCount * bw + (photoCount - 1) * GAP;
  const startOff = vpCenter - bw / 2;
  const endOff = -(virtualTotal - vpCenter - bw / 2);
  return { bw, vpCenter, virtualTotal, startOff, endOff };
}

/** Virtual index of viewport center (fractional while scrolling between photos). */
function getGalleryVirtualCenterSlot(scrollX: number, vw: number, photoCount: number): number {
  const { bw, vpCenter } = getLayoutInfo(vw, photoCount);
  return (vpCenter - scrollX - bw / 2) / (bw + GAP);
}

function clampPos(value: number, vw: number, photoCount: number) {
  const { startOff, endOff } = getLayoutInfo(vw, photoCount);
  return Math.max(endOff, Math.min(startOff, value));
}

/** Closest photo index to viewport center — same rule as `galleryX` → `activeIndex` sync. */
function getFilmClosestPhotoIndex(
  galleryXPos: number,
  vw: number,
  photoCount: number,
): number {
  if (photoCount <= 0) return 0;
  const { bw, vpCenter } = getLayoutInfo(vw, photoCount);
  let closestDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < photoCount; i++) {
    const imgCenter = i * (bw + GAP) + bw / 2;
    const d = Math.abs(imgCenter + galleryXPos - vpCenter);
    if (d < closestDist) {
      closestDist = d;
      closestIdx = i;
    }
  }
  return closestIdx;
}

function wheelDeltaPixels(e: WheelEvent, vw: number): number {
  let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) d *= 16;
  else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) d *= vw * 0.4;
  return d;
}

/**
 * Layout max vs real document scroll range — when they diverge, autoplay must use the smaller
 * value or "overshoot end" fires while still between photos.
 * Always uses `window.innerWidth` so pitch matches the scroll spacer (never a stale `vwRef` e.g. 1440 on mobile).
 */
function filmEffectiveMaxScrollPx(photoCount: number): number {
  if (photoCount <= 1) return 0;
  const vw =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const { bw } = getLayoutInfo(vw, photoCount);
  const step = bw + GAP;
  const layoutMax = (photoCount - 1) * step;
  if (typeof document === 'undefined') return layoutMax;
  const domRange =
    document.documentElement.scrollHeight - window.innerHeight;
  if (!Number.isFinite(domRange) || domRange < 1) return layoutMax;
  return Math.min(layoutMax, domRange);
}

/** Center-to-center pitch is half of the previous 12+5 layout (text position uses same math; width of label does not affect ticks). */
const HASH_TICK_W = 6;
const HASH_GAP = 2.5;
const HASH_PITCH = HASH_TICK_W + HASH_GAP;
/** Inset inside the scroll strip so month/year (centered on ticks with -translate-x-1/2) is not clipped at the ends. */
const HASH_LABEL_GUTTER_PX = 64;
const LINEMARK_MIN_PX = 19;
const LINEMARK_INTENSITY_PX = 8;
const LINEMARK_CEILING = 1;
/** Selected (active) tick is this × the proximity-scaled height. */
const LINEMARK_SELECTED_HEIGHT_MULT = 2;
/** Max extra px at hovered mark (neighbors fall off like sketchbook indicators). */
const LINEMARK_HOVER_BONUS_PX = 14;
const LINEMARK_COLOR_ACTIVE = '#18181b';
const LINEMARK_COLOR_IDLE = '#d4d4d8';
/**
 * Keep tablist row height constant while bar heights animate; the timeline is bottom-anchored,
 * so a changing row height shifts the whole block up/down and makes the note “bounce.”
 */
const HASH_TABLIST_MIN_H_PX = Math.ceil(
  (LINEMARK_MIN_PX + LINEMARK_INTENSITY_PX) * LINEMARK_SELECTED_HEIGHT_MULT +
    LINEMARK_HOVER_BONUS_PX +
    14,
);
/** Horizontal distance (px) over which selected date fades back in as hover label moves away. */
const FILM_DATE_HOVER_FADE_PX = 96;
/** RAF lerp when fading out under hover overlap (higher = snappier hide). */
const FILM_DATE_OPACITY_SMOOTH_K_OUT = 0.58;
/** RAF lerp when fading back in after hover leaves (slightly softer). */
const FILM_DATE_OPACITY_SMOOTH_K_IN = 0.32;

function filmHashRowWidthPx(count: number) {
  return count * HASH_TICK_W + (count - 1) * HASH_GAP;
}

/** Tick center X inside the tick column (relative to column left), supports fractional slot. */
function filmTickCenterInColumnPx(slot: number): number {
  return slot * HASH_PITCH + HASH_TICK_W / 2;
}

/** Same center in coordinates of the full rail (includes left gutter). */
function filmTickCenterInRailPx(slot: number): number {
  return HASH_LABEL_GUTTER_PX + filmTickCenterInColumnPx(slot);
}

function FilmAutoplayIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg
        className="h-3 w-3 md:h-3.5 md:w-3.5"
        viewBox="0 0 72 97"
        fill="none"
        aria-hidden
      >
        <path
          d="M7.79297 96.9141C5.21484 96.9141 3.26172 96.25 1.93359 94.9219C0.644531 93.5938 0 91.6406 0 89.0625V7.79297C0 5.21484 0.644531 3.28125 1.93359 1.99219C3.26172 0.664062 5.21484 0 7.79297 0H21.1523C23.6914 0 25.625 0.625 26.9531 1.875C28.2812 3.125 28.9453 5.09766 28.9453 7.79297V89.0625C28.9453 91.6406 28.2812 93.5938 26.9531 94.9219C25.625 96.25 23.6914 96.9141 21.1523 96.9141H7.79297ZM50.3906 96.9141C47.8125 96.9141 45.8594 96.25 44.5312 94.9219C43.2031 93.5938 42.5391 91.6406 42.5391 89.0625V7.79297C42.5391 5.21484 43.2031 3.28125 44.5312 1.99219C45.8594 0.664062 47.8125 0 50.3906 0H63.6914C66.2695 0 68.2031 0.625 69.4922 1.875C70.8203 3.125 71.4844 5.09766 71.4844 7.79297V89.0625C71.4844 91.6406 70.8203 93.5938 69.4922 94.9219C68.2031 96.25 66.2695 96.9141 63.6914 96.9141H50.3906Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      className="translate-x-px h-3 w-3 md:h-3.5 md:w-3.5"
      viewBox="0 0 88 99"
      fill="none"
      aria-hidden
    >
      <path
        d="M0 89.8828V8.55469C0 5.625 0.722656 3.47656 2.16797 2.10938C3.61328 0.703125 5.33203 0 7.32422 0C9.08203 0 10.8789 0.507812 12.7148 1.52344L80.9766 41.4258C83.3984 42.832 85.0781 44.1016 86.0156 45.2344C86.9922 46.3281 87.4805 47.6562 87.4805 49.2188C87.4805 50.7422 86.9922 52.0703 86.0156 53.2031C85.0781 54.3359 83.3984 55.6055 80.9766 57.0117L12.7148 96.9141C10.8789 97.9297 9.08203 98.4375 7.32422 98.4375C5.33203 98.4375 3.61328 97.7344 2.16797 96.3281C0.722656 94.9219 0 92.7734 0 89.8828Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilmRewindIcon() {
  return (
    <svg
      className="h-4 w-4 md:h-[18px] md:w-[18px]"
      viewBox="0 0 120 131"
      fill="none"
      aria-hidden
    >
      <path
        d="M71.0742 4.16324V31.0578C71.0742 32.425 70.7812 33.4601 70.1953 34.1632C69.6484 34.8664 68.9062 35.2179 67.9688 35.2179C67.0703 35.1789 66.0742 34.7882 64.9805 34.0461L46.2891 20.9211C44.9609 19.9836 44.2773 18.8898 44.2383 17.6398C44.2383 16.3898 44.9219 15.2765 46.2891 14.3L64.9219 1.17496C66.0156 0.432771 67.0312 0.0421464 67.9688 0.00308388C68.9062 -0.0359786 69.6484 0.296053 70.1953 0.999178C70.7812 1.7023 71.0742 2.75699 71.0742 4.16324ZM59.7656 130.902C51.5234 130.902 43.7891 129.339 36.5625 126.214C29.3359 123.128 22.9883 118.851 17.5195 113.382C12.0508 107.913 7.75391 101.566 4.62891 94.339C1.54297 87.1125 0 79.3781 0 71.1359C0 64.4562 1.01562 58.1281 3.04688 52.1515C5.11719 46.1359 8.00781 40.6476 11.7188 35.6867C15.4688 30.6867 19.8633 26.3703 24.9023 22.7375C26.1914 21.7218 27.5586 21.3507 29.0039 21.6242C30.4492 21.8976 31.543 22.6203 32.2852 23.7921C33.0273 25.0421 33.2227 26.3117 32.8711 27.6007C32.5586 28.8507 31.7969 29.925 30.5859 30.8234C26.4453 33.7921 22.832 37.3664 19.7461 41.5461C16.6602 45.6867 14.2578 50.257 12.5391 55.257C10.8203 60.257 9.96094 65.55 9.96094 71.1359C9.96094 78.0109 11.25 84.4562 13.8281 90.4718C16.4062 96.4875 19.9805 101.78 24.5508 106.351C29.1211 110.921 34.4141 114.495 40.4297 117.073C46.4453 119.652 52.8906 120.941 59.7656 120.941C66.6406 120.941 73.0859 119.652 79.1016 117.073C85.1172 114.495 90.4102 110.921 94.9805 106.351C99.5508 101.78 103.125 96.4875 105.703 90.4718C108.281 84.4562 109.57 78.0109 109.57 71.1359C109.57 64.2609 108.281 57.8156 105.703 51.8C103.125 45.7453 99.5508 40.4523 94.9805 35.9211C90.4102 31.3507 85.1172 27.7765 79.1016 25.1984C73.0859 22.6203 66.6406 21.3312 59.7656 21.3312C58.3984 21.3312 57.2266 20.8429 56.25 19.8664C55.2734 18.8507 54.7852 17.6593 54.7852 16.2921C54.7852 14.964 55.2539 13.8312 56.1914 12.8937C57.168 11.9171 58.3398 11.4093 59.707 11.3703C67.9883 11.3703 75.7422 12.9328 82.9688 16.0578C90.1953 19.1437 96.543 23.4211 102.012 28.8898C107.52 34.3586 111.816 40.7062 114.902 47.9328C117.988 55.1593 119.531 62.8937 119.531 71.1359C119.531 79.3781 117.969 87.1125 114.844 94.339C111.758 101.566 107.48 107.913 102.012 113.382C96.543 118.851 90.1953 123.128 82.9688 126.214C75.7422 129.339 68.0078 130.902 59.7656 130.902Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilmPhotoHashmarks({
  photos,
  currentIndex,
  noteStableIndex,
  onSelect,
  galleryX,
}: {
  photos: readonly FilmPhoto[];
  currentIndex: number;
  /** Which photo supplies the note text and horizontal anchor (debounced vs. `currentIndex`). */
  noteStableIndex: number;
  onSelect: (index: number) => void;
  galleryX: MotionValue<number>;
}) {
  const total = photos.length;
  const rowW = filmHashRowWidthPx(total);
  const cur = photos[currentIndex];
  const notePhoto = photos[noteStableIndex];
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const timelineRailRef = useRef<HTMLDivElement>(null);
  const dateLabelRef = useRef<HTMLDivElement>(null);
  const hoverDateLabelRef = useRef<HTMLDivElement | null>(null);
  const selectedDateOpacityRef = useRef(1);
  const tickBarRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const linemarkHeightRef = useRef<number[]>([]);
  const hoveredMarkIndexRef = useRef<number | null>(null);
  const [hoverLabelIndex, setHoverLabelIndex] = useState<number | null>(null);
  const hoverLabelIndexRef = useRef<number | null>(null);
  hoverLabelIndexRef.current = hoverLabelIndex;

  const stripMinW = rowW + 2 * HASH_LABEL_GUTTER_PX;

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const vw = window.innerWidth;
      const x = galleryX.get();
      const slot = getGalleryVirtualCenterSlot(x, vw, total);
      const vel = galleryX.getVelocity();

      const viewport = timelineViewportRef.current;
      const rail = timelineRailRef.current;
      const dateEl = dateLabelRef.current;
      if (viewport && rail) {
        const cw = viewport.clientWidth;
        if (cw > 0) {
          const focal = filmTickCenterInRailPx(slot);
          rail.style.transform = `translate3d(${cw / 2 - focal}px, 0, 0)`;
        }
      }
      if (dateEl) {
        dateEl.style.left = `${filmTickCenterInColumnPx(slot)}px`;
        const hoverEl = hoverDateLabelRef.current;
        const hi = hoverLabelIndexRef.current;
        const ci = currentIndexRef.current;
        let targetOp = 1;
        // Selected date tracks focal slot; neighbor hover labels sit beside it — hide selected immediately.
        if (hi !== null && Math.abs(hi - ci) === 1) {
          targetOp = 0;
        } else if (hoverEl) {
          const a = dateEl.getBoundingClientRect();
          const b = hoverEl.getBoundingClientRect();
          const overlapY = !(a.bottom <= b.top || a.top >= b.bottom);
          // Focal near hovered tick: same visual band even if rects miss by a pixel (subpixel / layout).
          const slotVsHover = hi !== null ? Math.abs(slot - hi) : Infinity;
        const nearHoveredTick = slotVsHover < 1.05;
          if (overlapY || nearHoveredTick) {
            const ax = (a.left + a.right) / 2;
            const bx = (b.left + b.right) / 2;
            const dx = Math.abs(ax - bx);
            if (dx < 6) {
              targetOp = 0;
            } else {
              const span = Math.max(
                FILM_DATE_HOVER_FADE_PX,
                Math.max(a.width, b.width) * 0.5 + 10,
              );
              const u = Math.max(0, Math.min(1, dx / span));
              const s = smoothstep(u);
              targetOp = s * s;
            }
          }
        }
        const prev = selectedDateOpacityRef.current;
        const smoothK =
          targetOp < prev
            ? FILM_DATE_OPACITY_SMOOTH_K_OUT
            : FILM_DATE_OPACITY_SMOOTH_K_IN;
        selectedDateOpacityRef.current = lerp(prev, targetOp, smoothK);
        dateEl.style.opacity = String(selectedDateOpacityRef.current);
      }

      if (linemarkHeightRef.current.length !== total) {
        linemarkHeightRef.current = Array.from(
          { length: total },
          () => LINEMARK_MIN_PX,
        );
      }

      for (let i = 0; i < total; i++) {
        const dist = slot - i;
        let targetScale = transformScale(
          dist,
          LINEMARK_CEILING,
          LINEMARK_MIN_PX,
          LINEMARK_INTENSITY_PX,
        );
        if (i === currentIndexRef.current) {
          targetScale *= LINEMARK_SELECTED_HEIGHT_MULT;
        }
        const hi = hoveredMarkIndexRef.current;
        if (hi !== null) {
          targetScale += transformMarkHoverBonus(i - hi, LINEMARK_HOVER_BONUS_PX);
        }
        const prev = linemarkHeightRef.current[i] ?? LINEMARK_MIN_PX;
        const h = lerpLinemarkTowardTarget(prev, targetScale, vel);
        linemarkHeightRef.current[i] = h;
        const el = tickBarRefs.current[i];
        if (el) {
          el.style.height = `${h}px`;
          el.style.backgroundColor =
            i === currentIndexRef.current
              ? LINEMARK_COLOR_ACTIVE
              : LINEMARK_COLOR_IDLE;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [galleryX, total]);

  return (
    <div
      ref={timelineViewportRef}
      className="relative w-full max-w-full md:max-w-[min(92vw,720px)]"
      role="group"
      aria-label="Film photos timeline"
    >
      {notePhoto?.note ? (
        <div className="pointer-events-none absolute top-0 left-1/2 z-20 flex w-max max-w-[min(92vw,720px)] -translate-x-1/2 flex-col items-center px-2 text-center">
          <motion.p
            key={notePhoto.note}
            className="line-clamp-2 max-w-full text-pretty text-[15px] font-medium leading-snug text-black"
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {notePhoto.note}
          </motion.p>
        </div>
      ) : null}

      <div
        ref={timelineRailRef}
        className="inline-block min-w-0 will-change-transform"
      >
        <div
          className="inline-flex min-w-0"
          style={{ minWidth: stripMinW }}
        >
        <div
          className="shrink-0"
          style={{ width: HASH_LABEL_GUTTER_PX }}
          aria-hidden
        />
        <div className="inline-flex min-w-0 flex-col gap-0" style={{ width: rowW }}>
          {notePhoto?.note ? (
            <div
              className="shrink-0"
              style={{ minHeight: '1.7rem' }}
              aria-hidden
            />
          ) : null}

          <div
            className="-mt-2 flex shrink-0 items-end"
            style={{ width: rowW, gap: HASH_GAP, minHeight: HASH_TABLIST_MIN_H_PX }}
            role="tablist"
          >
            {photos.map((photo, i) => {
              const isActive = i === currentIndex;
              return (
                <button
                  key={photo.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${photo.month} ${photo.year}, photo ${i + 1} of ${total}`}
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => {
                    hoveredMarkIndexRef.current = i;
                    setHoverLabelIndex(i);
                  }}
                  onMouseLeave={() => {
                    hoveredMarkIndexRef.current = null;
                    setHoverLabelIndex(null);
                  }}
                  className="flex shrink-0 items-end justify-center rounded-sm py-1.5 -my-1 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                  style={{ width: HASH_TICK_W }}
                >
                  <span
                    ref={(el) => {
                      tickBarRefs.current[i] = el;
                    }}
                    className="block w-px rounded-full"
                    style={{
                      height: LINEMARK_MIN_PX,
                      backgroundColor: LINEMARK_COLOR_IDLE,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div
            className="relative mt-4 min-h-10 shrink-0"
            style={{ width: rowW }}
          >
            <AnimatePresence>
              {hoverLabelIndex !== null &&
              photos[hoverLabelIndex] &&
              hoverLabelIndex !== currentIndex ? (
                <motion.div
                  ref={hoverDateLabelRef}
                  key={hoverLabelIndex}
                  aria-hidden
                  className="pointer-events-none absolute top-0 left-0 z-20 flex -translate-x-1/2 flex-col items-center whitespace-nowrap"
                  style={{
                    left: `${filmTickCenterInColumnPx(hoverLabelIndex)}px`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="text-sm font-medium leading-tight text-gray-500">
                    {photos[hoverLabelIndex].month}
                  </span>
                  <span className="mt-0.5 text-sm leading-tight text-gray-400">
                    {photos[hoverLabelIndex].year}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div
              ref={dateLabelRef}
              className="absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center whitespace-nowrap will-change-[left,opacity]"
            >
              <motion.span
                key={cur.month}
                className="text-sm font-medium leading-tight text-gray-500"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                {cur.month}
              </motion.span>
              <motion.span
                key={String(cur.year)}
                className="mt-0.5 text-sm leading-tight text-gray-400"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.26,
                  delay: 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {cur.year}
              </motion.span>
            </div>
          </div>
        </div>
        <div
          className="shrink-0"
          style={{ width: HASH_LABEL_GUTTER_PX }}
          aria-hidden
        />
        </div>
      </div>
    </div>
  );
}

const FILM_POLL_MS = 90_000;
/**
 * How long to wait after `activeIndex` changes before updating note + tick anchor.
 * Short enough to feel tied to scroll; long enough to skip single-frame jitter.
 */
const NOTE_INDEX_DEBOUNCE_MS = 55;

const DEFAULT_FILM_PROJECT = {
  id: 'film',
  title: 'Film Diary',
  year: '2026',
  description: 'A digital photo timeline, featuring scenes from sundays in la.',
  imageSrc: 'https://image.mux.com/RiCfoo00W9xVF5jrY11sXY3DVU7GE5P02q1KDHnbiNyiE/thumbnail.png',
  videoSrc: 'https://stream.mux.com/RiCfoo00W9xVF5jrY11sXY3DVU7GE5P02q1KDHnbiNyiE.m3u8',
  tryItOutHref: '/film',
  toolCategories: [
    { label: 'Design', tools: ['Figma'] },
    { label: 'Frontend', tools: ['TypeScript', 'React', 'Framer Motion', 'Tailwind CSS'] },
    { label: 'Data', tools: ['Notion API'] },
    { label: 'AI', tools: ['Cursor', 'Opus 4.6'] },
  ],
};

export default function FilmPage({ initialPhotos = [] }: { initialPhotos?: FilmPhoto[] }) {
  const navigate = useNavigate();
  const projectInfo = useExperimentProject('film', DEFAULT_FILM_PROJECT);
  const pageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const posRef = useRef(0);
  const vwRef = useRef(1440);
  const rafRef = useRef(0);
  const galleryTweenRef = useRef<AnimationPlaybackControls | null>(null);
  /** Last known `window.scrollY` (ignore near-duplicate events after programmatic scroll). */
  const scrolledToScrollYRef = useRef(0);
  /** Last user-driven travel direction: 1 forward/down, -1 backward/up. */
  const scrollSnapDirectionRef = useRef(0);
  /** Debounce wheel/trackpad settle → snap scroll to nearest photo. */
  const scrollIdleSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGalleryTweeningRef = useRef(false);
  const filmIntroStartMsRef = useRef<number | null>(null);
  const filmIntroDoneRef = useRef(false);
  const topGradientRef = useRef<HTMLDivElement>(null);
  const bottomGradientRef = useRef<HTMLDivElement>(null);
  const playBarRef = useRef<HTMLDivElement>(null);
  const playBarTopSmoothed = useRef<number | null>(null);
  const playBarTargetTop = useRef<number | null>(null);
  const playBarOrientation = useRef<'landscape' | 'portrait' | null>(null);
  const prevVhForPlayBar = useRef(0);
  const layoutSmoothPrevRef = useRef<{
    n: number;
    widths: number[];
    heights: number[];
    lefts: number[];
    stripX: number;
    cumX: number;
    opacities: number[];
  } | null>(null);
  const [photos, setPhotos] = useState<FilmPhoto[]>(initialPhotos);
  const photosRef = useRef<FilmPhoto[]>(initialPhotos);
  photosRef.current = photos;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;
  const [noteStableIndex, setNoteStableIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filmManualScrollActive, setFilmManualScrollActive] = useState(false);
  const noteIndexDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filmAutoplayPlaying, setFilmAutoplayPlaying] = useState(false);
  const filmAutoplayPlayingRef = useRef(false);
  filmAutoplayPlayingRef.current = filmAutoplayPlaying;
  const [filmRewindingToStart, setFilmRewindingToStart] = useState(false);
  const [filmLayoutReady, setFilmLayoutReady] = useState(false);
  const filmLayoutReadyRef = useRef(false);
  const filmAutoplayStepTimerRef = useRef<number | null>(null);
  const filmManualScrollFadeTimerRef = useRef<number | null>(null);
  /** True while autoplay mutates `scrollTop` — some UAs emit `wheel` synchronously; ignore so we don’t stop playback. */
  const filmAutoplayApplyingScrollRef = useRef(false);
  /** `performance.now()` deadline: wheel during autoplay should not pause playback (async wheel after scroll). */
  const filmAutoplayWheelGraceUntilRef = useRef(0);

  const galleryX = useMotionValue(0);

  /** Always start {0,0} so SSR and hydration match; real size is set in `useEffect`. */
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const scrollDriverHeightPx = useMemo(() => {
    if (photos.length === 0) return 0;
    const w = viewport.w;
    const h = viewport.h;
    if (h === 0) return 0;
    const bw = w < 640 ? MOBILE_BASE_WIDTH : BASE_WIDTH;
    return (photos.length - 1) * (bw + GAP) + h;
  }, [photos.length, viewport.w, viewport.h]);
  useLayoutEffect(() => {
    vwRef.current = window.innerWidth;
  }, []);
  useEffect(() => {
    const sync = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const shouldPullImmediately = initialPhotos.length === 0;

    async function pull() {
      try {
        const res = await fetch('/api/film-photos', { cache: 'no-store' });
        const data = (await res.json()) as { photos?: FilmPhoto[]; error?: string };
        if (cancelled) return;
        if (Array.isArray(data.photos)) {
          setPhotos(data.photos);
          setLoadError(
            data.photos.length === 0 && data.error ? data.error : null,
          );
        } else {
          setLoadError(data.error ?? 'Could not load film photos');
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load film photos');
        }
      }
    }

    if (shouldPullImmediately) {
      void pull();
    }
    const interval = setInterval(pull, FILM_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') void pull();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [initialPhotos.length]);

  useEffect(() => {
    if (photos.length === 0) return;
    setActiveIndex((i) => Math.min(i, photos.length - 1));
    setNoteStableIndex((i) => Math.min(i, photos.length - 1));
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) {
      setFilmAutoplayPlaying(false);
    }
  }, [photos.length]);

  const syncPhotoAspectRatio = useCallback(
    (photoId: string, naturalWidth: number, naturalHeight: number) => {
      if (naturalWidth <= 0 || naturalHeight <= 0) return;
      const measuredAspectRatio = filmSafeAspectRatio(
        naturalWidth / naturalHeight,
      );
      const currentPhoto = photosRef.current.find((photo) => photo.id === photoId);
      if (!currentPhoto) return;
      const currentAspectRatio = filmSafeAspectRatio(currentPhoto.aspectRatio);
      if (Math.abs(currentAspectRatio - measuredAspectRatio) < 0.02) return;

      layoutSmoothPrevRef.current = null;
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, aspectRatio: measuredAspectRatio }
            : photo,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        setFilmAutoplayPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (noteIndexDebounceRef.current) {
      clearTimeout(noteIndexDebounceRef.current);
    }
    noteIndexDebounceRef.current = setTimeout(() => {
      noteIndexDebounceRef.current = null;
      setNoteStableIndex(activeIndex);
    }, NOTE_INDEX_DEBOUNCE_MS);
    return () => {
      if (noteIndexDebounceRef.current) {
        clearTimeout(noteIndexDebounceRef.current);
        noteIndexDebounceRef.current = null;
      }
    };
  }, [activeIndex]);

  useEffect(() => {
    if (photos.length === 0) return;
    filmLayoutReadyRef.current = false;
    setFilmLayoutReady(false);
    const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
    vwRef.current = w;
    const { startOff } = getLayoutInfo(w, photos.length);
    posRef.current = startOff;
    galleryX.set(startOff);
    scrolledToScrollYRef.current = 0;
    document.documentElement.scrollTop = 0;
  }, [photos.length, galleryX]);

  const cancelScrollSnap = useCallback(() => {
    galleryTweenRef.current?.stop();
    galleryTweenRef.current = null;
    isGalleryTweeningRef.current = false;
  }, []);

  const showManualScrollFade = useCallback(() => {
    setFilmManualScrollActive(true);
    if (filmManualScrollFadeTimerRef.current !== null) {
      clearTimeout(filmManualScrollFadeTimerRef.current);
    }
    filmManualScrollFadeTimerRef.current = window.setTimeout(() => {
      filmManualScrollFadeTimerRef.current = null;
      setFilmManualScrollActive(false);
    }, 260);
  }, []);

  useEffect(() => () => {
    if (filmManualScrollFadeTimerRef.current !== null) {
      clearTimeout(filmManualScrollFadeTimerRef.current);
    }
  }, []);

  /** Snap vertical scroll to the nearest photo column (wheel / trackpad release, after sync from touch drag). */
  const runIdleScrollSnap = useCallback(() => {
    if (isGalleryTweeningRef.current) return;
    const n = photosRef.current.length;
    if (n <= 1) return;
    const vw = window.innerWidth;
    vwRef.current = vw;
    const { bw, startOff, vpCenter } = getLayoutInfo(vw, n);
    const step = bw + GAP;
    const maxScroll = filmEffectiveMaxScrollPx(n);
    let sy = window.scrollY;
    sy = Math.max(0, Math.min(maxScroll, sy));
    const rawIdx = sy / step;
    const dir = scrollSnapDirectionRef.current;
    const targetIdx =
      dir > 0
        ? Math.ceil(rawIdx)
        : dir < 0
          ? Math.floor(rawIdx)
          : Math.round(rawIdx);
    const clampedIdx = Math.max(0, Math.min(n - 1, targetIdx));
    const targetSy = clampedIdx * step;
    if (Math.abs(sy - targetSy) <= 1) return;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      scrolledToScrollYRef.current = targetSy;
      document.documentElement.scrollTop = targetSy;
      galleryX.set(startOff - targetSy);
      layoutSmoothPrevRef.current = null;
      return;
    }

    const targetX = clampPos(
      vpCenter - (clampedIdx * step + bw / 2),
      vw,
      n,
    );
    isGalleryTweeningRef.current = true;
    galleryTweenRef.current?.stop();
    galleryTweenRef.current = animate(galleryX, targetX, {
      type: 'spring',
      stiffness: FILM_IDLE_SNAP_SPRING.stiffness,
      damping: FILM_IDLE_SNAP_SPRING.damping,
      onUpdate: (latest) => {
        const nextSy = Math.max(
          0,
          Math.min(maxScroll, startOff - Number(latest)),
        );
        scrolledToScrollYRef.current = nextSy;
        document.documentElement.scrollTop = nextSy;
      },
      onComplete: () => {
        isGalleryTweeningRef.current = false;
        galleryTweenRef.current = null;
      },
    });
  }, [galleryX]);

  useEffect(() => {
    layoutSmoothPrevRef.current = null;
    const w = window.innerWidth;
    vwRef.current = w;
    const n0 = photosRef.current.length;
    const { startOff } = getLayoutInfo(w, n0);
    posRef.current = startOff;
    galleryX.set(startOff);

    const applyFrame = (scrollPos: number, vw: number) => {
      const list = photosRef.current;
      const n = list.length;
      if (n === 0) return;
      if (!filmIntroDoneRef.current && filmIntroStartMsRef.current === null) {
        filmIntroStartMsRef.current = performance.now();
      }
      const { bw, vpCenter } = getLayoutInfo(vw, n);
      const focalSlot = getGalleryVirtualCenterSlot(scrollPos, vw, n);

      const scales: number[] = [];
      const opacities: number[] = [];
      for (let i = 0; i < n; i++) {
        const ar = filmSafeAspectRatio(list[i].aspectRatio);
        const o = frameScaleAndOpacity(i, focalSlot, vw, ar, bw);
        scales[i] = o.scale;
        opacities[i] = o.opacity;
      }

      const layoutFromScales = () => {
        const widths: number[] = [];
        const heights: number[] = [];
        let cumX = 0;
        const lefts: number[] = [];
        const centers: number[] = [];
        for (let i = 0; i < n; i++) {
          const wi = bw * scales[i];
          widths[i] = wi;
          heights[i] = wi / filmSafeAspectRatio(list[i].aspectRatio);
          lefts[i] = cumX;
          centers[i] = cumX + wi / 2;
          cumX += wi + GAP;
        }
        const targetVirtual = vpCenter - scrollPos;
        let closestIdx = 0;
        let closestD = Infinity;
        for (let i = 0; i < n; i++) {
          const vc = i * (bw + GAP) + bw / 2;
          const d = Math.abs(vc - targetVirtual);
          if (d < closestD) { closestD = d; closestIdx = i; }
        }
        const virtualClosestCenter = closestIdx * (bw + GAP) + bw / 2;
        const frac = (targetVirtual - virtualClosestCenter) / (bw + GAP);
        let neighborIdx = closestIdx + (frac >= 0 ? 1 : -1);
        neighborIdx = Math.max(0, Math.min(n - 1, neighborIdx));
        const blendT =
          neighborIdx === closestIdx ? 0 : Math.min(1, Math.abs(frac));
        const actualTarget =
          centers[closestIdx] +
          (centers[neighborIdx] - centers[closestIdx]) * blendT;
        const stripX = vpCenter - actualTarget;
        return { widths, heights, lefts, stripX, cumX };
      };

      let { widths, heights, lefts, stripX, cumX } = layoutFromScales();

      const prevLayout = layoutSmoothPrevRef.current;
      const velRaw =
        typeof galleryX.getVelocity === 'function'
          ? galleryX.getVelocity()
          : 0;
      const layoutVel = Number.isFinite(velRaw) ? Math.abs(velRaw) : 0;
      const smoothK = isGalleryTweeningRef.current
        ? FILM_LAYOUT_SMOOTH_K_SNAP
        : layoutVel < FILM_LAYOUT_VELOCITY_IDLE
          ? 1
          : FILM_LAYOUT_SMOOTH_K_SCROLL;
      if (!prevLayout || prevLayout.n !== n) {
        layoutSmoothPrevRef.current = {
          n,
          widths: widths.slice(),
          heights: heights.slice(),
          lefts: lefts.slice(),
          stripX,
          cumX,
          opacities: opacities.slice(),
        };
      } else {
        const targetStripX = stripX;
        for (let i = 0; i < n; i++) {
          widths[i] = lerp(prevLayout.widths[i]!, widths[i]!, smoothK);
          heights[i] = lerp(prevLayout.heights[i]!, heights[i]!, smoothK);
          opacities[i] = lerp(prevLayout.opacities[i]!, opacities[i]!, smoothK);
        }
        stripX = lerp(prevLayout.stripX, targetStripX, smoothK);
        let acc = 0;
        for (let i = 0; i < n; i++) {
          lefts[i] = acc;
          acc += widths[i] + (i < n - 1 ? GAP : 0);
        }
        cumX = acc;
        layoutSmoothPrevRef.current = {
          n,
          widths: widths.slice(),
          heights: heights.slice(),
          lefts: lefts.slice(),
          stripX,
          cumX,
          opacities: opacities.slice(),
        };
      }

      if (
        !Number.isFinite(stripX) ||
        !Number.isFinite(cumX) ||
        widths.some((w) => !Number.isFinite(w))
      ) {
        layoutSmoothPrevRef.current = null;
        return;
      }

      const vh = window.innerHeight;
      const mdUp = vw >= 640;
      const midY =
        mdUp
          ? (filmPlayBandBottomPx(vw, vh) +
              (vh - filmDesktopBottomReservePx(vh))) /
            2
          : n > 1
            ? (filmPlayBandBottomPx(vw, vh) +
                (vh - filmMobileBottomReservePx(vh))) /
              2
            : vh / 2 -
              (FILM_STRIP_VERTICAL_NUDGE_PX +
                Math.round(vh * FILM_STRIP_VERTICAL_NUDGE_VH) +
                FILM_STRIP_VERTICAL_NUDGE_MOBILE_PX);

      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(${stripX}px, 0, 0)`;
        stripRef.current.style.width = cumX + 'px';
        stripRef.current.style.height = vh + 'px';
      }

      const introStart = filmIntroStartMsRef.current;
      const introActive =
        !filmIntroDoneRef.current && introStart !== null;
      const introElapsed = introActive ? performance.now() - introStart : 0;
      if (
        introActive &&
        introElapsed >=
          (n - 1) * FILM_INTRO_STAGGER_MS + FILM_INTRO_FADE_MS + 80
      ) {
        filmIntroDoneRef.current = true;
      }

      for (let i = 0; i < n; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        el.style.left = lefts[i] + 'px';
        el.style.top = (midY - heights[i] / 2) + 'px';
        el.style.width = widths[i] + 'px';
        el.style.height = heights[i] + 'px';
        let introLerp = 1;
        if (introActive && !filmIntroDoneRef.current) {
          const u = Math.max(
            0,
            Math.min(
              1,
              (introElapsed - i * FILM_INTRO_STAGGER_MS) / FILM_INTRO_FADE_MS,
            ),
          );
          introLerp = smoothstep(u);
        }
        el.style.opacity = String(introLerp < 1 ? opacities[i] * introLerp : opacities[i]);

        el.style.transformOrigin = 'center center';
        el.style.transform =
          introLerp < 1
            ? `translate3d(${-(1 - introLerp) * FILM_INTRO_SLIDE_PX}px, 0, 0)`
            : '';
      }

      const focalIdx = Math.max(0, Math.min(n - 1, Math.round(focalSlot)));
      const centerH = heights[focalIdx] ?? 0;
      const imageTop = midY - centerH / 2;
      const imageBottom = midY + centerH / 2;
      const playBandBottom = filmPlayBandBottomPx(vw, vh);
      const bottomReserve = mdUp
        ? filmDesktopBottomReservePx(vh)
        : filmMobileBottomReservePx(vh);
      const timelineTop = vh - bottomReserve;

      let playBarBottom = playBandBottom;
      if (playBarRef.current) {
        const buttonH = 40;
        const logoBottom = mdUp ? 80 : 72;
        const gap = imageTop - logoBottom;
        const playCenter = logoBottom + gap * 0.36;
        const candidateTop = Math.max(logoBottom, playCenter - buttonH / 2);

        const focalAr = filmSafeAspectRatio(list[focalIdx]?.aspectRatio);
        const orientation = focalAr > 1 ? 'landscape' : 'portrait';
        const orientationChanged = orientation !== playBarOrientation.current;
        playBarOrientation.current = orientation;

        const vhChanged = Math.abs(vh - prevVhForPlayBar.current) > 2;
        prevVhForPlayBar.current = vh;

        if (playBarTargetTop.current === null || vhChanged || orientationChanged) {
          playBarTargetTop.current = candidateTop;
        }

        const target = playBarTargetTop.current;
        const prev = playBarTopSmoothed.current;
        const playTop = prev === null || vhChanged
          ? target
          : prev + (target - prev) * 0.06;
        playBarTopSmoothed.current = playTop;

        playBarRef.current.style.top = `${playTop}px`;
        playBarBottom = playTop + buttonH;
      }

      if (topGradientRef.current) {
        const topGap = imageTop - playBarBottom;
        const topOp = smoothstep(Math.max(0, Math.min(1, (20 - topGap) / 60)));
        topGradientRef.current.style.opacity = String(topOp);
      }
      if (bottomGradientRef.current) {
        const bottomGap = timelineTop - imageBottom;
        const bottomOp = smoothstep(Math.max(0, Math.min(1, (20 - bottomGap) / 60)));
        bottomGradientRef.current.style.opacity = String(bottomOp);
      }

      if (!filmLayoutReadyRef.current) {
        filmLayoutReadyRef.current = true;
        setFilmLayoutReady(true);
      }
    };

    applyFrame(startOff, w);

    const tick = () => {
      const vw = window.innerWidth;
      vwRef.current = vw;
      const n = photosRef.current.length;
      if (n === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      applyFrame(galleryX.get(), vw);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [galleryX, photos.length]);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      vwRef.current = w;
      const n = photosRef.current.length;
      if (n === 0) return;
      const { startOff } = getLayoutInfo(w, n);
      const maxScroll = Math.max(0, filmEffectiveMaxScrollPx(n));
      const sy = Math.min(maxScroll, Math.max(0, window.scrollY));
      document.documentElement.scrollTop = sy;
      scrolledToScrollYRef.current = sy;
      posRef.current = clampPos(startOff - sy, w, n);
      galleryX.set(posRef.current);
      layoutSmoothPrevRef.current = null;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [galleryX]);

  useEffect(() => {
    const unsubscribe = galleryX.on('change', (x) => {
      posRef.current = x;

      const n = photosRef.current.length;
      if (n === 0) return;
      const closestIdx = getFilmClosestPhotoIndex(
        x,
        typeof window !== 'undefined' ? window.innerWidth : vwRef.current,
        n,
      );
      setActiveIndex((p) => (p !== closestIdx ? closestIdx : p));
    });
    return unsubscribe;
  }, [galleryX]);

  useEffect(() => {
    const clearIdleSnapTimer = () => {
      if (scrollIdleSnapTimerRef.current !== null) {
        clearTimeout(scrollIdleSnapTimerRef.current);
        scrollIdleSnapTimerRef.current = null;
      }
    };

    const onScroll = () => {
      const sy = window.scrollY;
      if (Math.abs(scrolledToScrollYRef.current - sy) < 1) return;
      const delta = sy - scrolledToScrollYRef.current;
      if (Math.abs(delta) >= 1) {
        scrollSnapDirectionRef.current = delta > 0 ? 1 : -1;
      }
      if (!filmAutoplayPlayingRef.current && !filmAutoplayApplyingScrollRef.current) {
        showManualScrollFade();
      }
      if (galleryTweenRef.current) {
        galleryTweenRef.current.stop();
        galleryTweenRef.current = null;
        isGalleryTweeningRef.current = false;
      }
      const n = photosRef.current.length;
      if (n === 0) return;
      const vw = window.innerWidth;
      vwRef.current = vw;
      const { startOff } = getLayoutInfo(vw, n);
      galleryX.set(startOff - sy);
      layoutSmoothPrevRef.current = null;
      scrolledToScrollYRef.current = sy;

      if (!filmAutoplayPlayingRef.current) {
        clearIdleSnapTimer();
        scrollIdleSnapTimerRef.current = setTimeout(() => {
          scrollIdleSnapTimerRef.current = null;
          runIdleScrollSnap();
        }, FILM_SCROLL_IDLE_SNAP_MS);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearIdleSnapTimer();
    };
  }, [galleryX, runIdleScrollSnap, showManualScrollFade]);

  useEffect(() => {
    const onWheelCapture = (e: WheelEvent) => {
      const n = photosRef.current.length;
      if (n <= 1) return;

      e.preventDefault();

      if (filmAutoplayApplyingScrollRef.current) return;
      if (
        filmAutoplayPlayingRef.current &&
        performance.now() < filmAutoplayWheelGraceUntilRef.current
      ) {
        return;
      }
      if (filmAutoplayPlayingRef.current) {
        setFilmAutoplayPlaying(false);
      }

      const vw = window.innerWidth;
      vwRef.current = vw;
      const { bw } = getLayoutInfo(vw, n);
      const step = bw + GAP;
      const maxScroll = filmEffectiveMaxScrollPx(n);
      const delta = wheelDeltaPixels(e, vw) * FILM_WHEEL_SCROLL_FACTOR;
      if (Math.abs(delta) >= 0.5) {
        scrollSnapDirectionRef.current = delta > 0 ? 1 : -1;
        showManualScrollFade();
      }
      const next = Math.max(0, Math.min(maxScroll, window.scrollY + delta));
      window.scrollTo({ top: next, behavior: 'instant' });
    };

    window.addEventListener('wheel', onWheelCapture, {
      capture: true,
      passive: false,
    });
    return () => {
      window.removeEventListener('wheel', onWheelCapture, { capture: true });
    };
  }, [showManualScrollFade]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const drag = {
      pointerId: null as number | null,
      startX: 0,
      startGallery: 0,
      moved: false,
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      drag.pointerId = null;
      cleanupListeners();
      const n = photosRef.current.length;
      if (n > 1 && drag.moved) {
        const vw = window.innerWidth;
        vwRef.current = vw;
        const { bw, startOff } = getLayoutInfo(vw, n);
        const step = bw + GAP;
        const maxScroll = filmEffectiveMaxScrollPx(n);
        const impliedSy = Math.max(
          0,
          Math.min(maxScroll, startOff - galleryX.get()),
        );
        if (scrollIdleSnapTimerRef.current !== null) {
          clearTimeout(scrollIdleSnapTimerRef.current);
          scrollIdleSnapTimerRef.current = null;
        }
        document.documentElement.scrollTop = impliedSy;
        scrolledToScrollYRef.current = impliedSy;
        galleryX.set(startOff - impliedSy);
        layoutSmoothPrevRef.current = null;
        runIdleScrollSnap();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 5) {
        if (!drag.moved) {
          drag.moved = true;
          isGalleryTweeningRef.current = false;
          cancelScrollSnap();
          setFilmAutoplayPlaying(false);
        }
        scrollSnapDirectionRef.current = dx < 0 ? 1 : -1;
        showManualScrollFade();
        e.preventDefault();
        galleryX.set(
          clampPos(
            drag.startGallery + dx,
            window.innerWidth,
            photosRef.current.length,
          ),
        );
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('button[aria-label="Go back to home"]')) return;
      if (t?.closest('button[role="tab"]')) return;
      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.startGallery = galleryX.get();
      drag.moved = false;
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    root.addEventListener('pointerdown', onPointerDown);
    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      cleanupListeners();
    };
  }, [galleryX, cancelScrollSnap, runIdleScrollSnap, showManualScrollFade]);

  useEffect(() => {
    const onTouchStartCapture = (e: TouchEvent) => {
      if (!filmAutoplayPlayingRef.current) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest('[data-film-autoplay-control]')) return;
      if (el.closest('[data-film-page]')) {
        setFilmAutoplayPlaying(false);
      }
    };
    window.addEventListener('touchstart', onTouchStartCapture, { capture: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStartCapture, { capture: true });
    };
  }, []);

  const scrollToIndex = useCallback(
    (
      idx: number,
      springOverride?: { stiffness: number; damping: number },
      preserveAutoplay = false,
    ) => {
      const n = photosRef.current.length;
      if (idx < 0 || idx >= n) return;
      setFilmRewindingToStart(false);
      if (!preserveAutoplay) {
        setFilmAutoplayPlaying(false);
      }
      if (noteIndexDebounceRef.current) {
        clearTimeout(noteIndexDebounceRef.current);
        noteIndexDebounceRef.current = null;
      }
      setNoteStableIndex(idx);
      cancelScrollSnap();
      const spring =
        springOverride ??
        filmGallerySpringForSlotDistance(idx - activeIndexRef.current);
      const vw = window.innerWidth;
      vwRef.current = vw;
      const { bw, vpCenter } = getLayoutInfo(vw, n);
      const step = bw + GAP;
      const centerScroll = Math.min(idx * step, filmEffectiveMaxScrollPx(n));
      scrolledToScrollYRef.current = centerScroll;
      if (preserveAutoplay) {
        filmAutoplayWheelGraceUntilRef.current =
          performance.now() + FILM_AUTOPLAY_WHEEL_GRACE_MS;
        filmAutoplayApplyingScrollRef.current = true;
      }
      try {
        document.documentElement.scrollTop = centerScroll;
      } finally {
        filmAutoplayApplyingScrollRef.current = false;
      }
      const target = clampPos(vpCenter - (idx * step + bw / 2), vw, n);
      isGalleryTweeningRef.current = true;
      galleryTweenRef.current?.stop();
      galleryTweenRef.current = animate(galleryX, target, {
        type: 'spring',
        stiffness: spring.stiffness,
        damping: spring.damping,
        onComplete: () => {
          isGalleryTweeningRef.current = false;
          galleryTweenRef.current = null;
        },
      });
    },
    [galleryX, cancelScrollSnap],
  );

  useEffect(() => {
    if (!filmAutoplayPlaying || photos.length <= 1) {
      if (filmAutoplayStepTimerRef.current !== null) {
        clearTimeout(filmAutoplayStepTimerRef.current);
        filmAutoplayStepTimerRef.current = null;
      }
      return;
    }
    if (activeIndex >= photos.length - 1) {
      setFilmAutoplayPlaying(false);
      return;
    }
    if (scrollIdleSnapTimerRef.current !== null) {
      clearTimeout(scrollIdleSnapTimerRef.current);
      scrollIdleSnapTimerRef.current = null;
    }
    filmAutoplayStepTimerRef.current = window.setTimeout(() => {
      const n = photosRef.current.length;
      const currentIdx = activeIndexRef.current;
      if (currentIdx >= n - 1) {
        setFilmAutoplayPlaying(false);
        return;
      }
      scrollToIndex(currentIdx + 1, FILM_AUTOPLAY_SNAP_SPRING, true);
    }, FILM_AUTOPLAY_ADVANCE_MS);
    return () => {
      if (filmAutoplayStepTimerRef.current !== null) {
        clearTimeout(filmAutoplayStepTimerRef.current);
        filmAutoplayStepTimerRef.current = null;
      }
    };
  }, [activeIndex, filmAutoplayPlaying, photos.length, scrollToIndex]);

  const startFilmAutoplay = useCallback(() => {
    const n = photosRef.current.length;
    if (n <= 1) return;
    const currentIdx = activeIndexRef.current;
    if (currentIdx >= n - 1) return;
    cancelScrollSnap();
    setFilmAutoplayPlaying(true);
    scrollToIndex(currentIdx + 1, FILM_AUTOPLAY_SNAP_SPRING, true);
  }, [cancelScrollSnap, scrollToIndex]);

  const rewindFilmToStart = useCallback(() => {
    setFilmAutoplayPlaying(false);
    cancelScrollSnap();
    galleryTweenRef.current?.stop();
    galleryTweenRef.current = null;
    isGalleryTweeningRef.current = false;
    const n = photosRef.current.length;
    if (n <= 1) return;
    if (scrollIdleSnapTimerRef.current !== null) {
      clearTimeout(scrollIdleSnapTimerRef.current);
      scrollIdleSnapTimerRef.current = null;
    }
    if (noteIndexDebounceRef.current) {
      clearTimeout(noteIndexDebounceRef.current);
      noteIndexDebounceRef.current = null;
    }
    setNoteStableIndex(0);
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vw = window.innerWidth;
    vwRef.current = vw;
    const { startOff } = getLayoutInfo(vw, n);
    if (reduceMotion) {
      document.documentElement.scrollTop = 0;
      scrolledToScrollYRef.current = 0;
      galleryX.set(startOff);
      layoutSmoothPrevRef.current = null;
      setFilmRewindingToStart(false);
      return;
    }
    setFilmRewindingToStart(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    let rewindFallbackId = 0;
    const onRewindScroll = () => {
      if (window.scrollY <= 1) {
        window.removeEventListener('scroll', onRewindScroll);
        window.clearTimeout(rewindFallbackId);
        setFilmRewindingToStart(false);
      }
    };
    window.addEventListener('scroll', onRewindScroll, { passive: true });
    rewindFallbackId = window.setTimeout(() => {
      window.removeEventListener('scroll', onRewindScroll);
      setFilmRewindingToStart(false);
    }, 8000);
  }, [cancelScrollSnap, galleryX]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        return;
      }
      const n = photosRef.current.length;
      if (n === 0) return;
      const canGoRight = e.key === 'ArrowRight' && activeIndex < n - 1;
      const canGoLeft = e.key === 'ArrowLeft' && activeIndex > 0;
      if (!canGoRight && !canGoLeft) return;
      e.preventDefault();
      // Holding an arrow: OS key-repeat was advancing many frames per second.
      if (e.repeat) return;
      if (canGoRight) {
        scrollToIndex(activeIndex + 1, FILM_KEYBOARD_SNAP_SPRING);
      } else {
        scrollToIndex(activeIndex - 1, FILM_KEYBOARD_SNAP_SPRING);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, scrollToIndex]);

  return (
    <>
    <motion.div
      ref={pageRef}
      data-film-page
      className="fixed inset-0 z-[50] isolate overflow-hidden overscroll-none bg-[#fafafa]"
    >
      {photos.length === 0 ? (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-sm text-zinc-600">Loading film…</p>
          {loadError ? (
            <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
              {loadError}
            </p>
          ) : null}
        </div>
      ) : null}

      {photos.length > 1 ? (
        <div
          ref={playBarRef}
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 min-[640px]:px-8"
          style={{
            opacity: filmManualScrollActive ? 0 : 1,
            transition: filmManualScrollActive
              ? 'opacity 200ms ease-out'
              : 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {filmRewindingToStart || activeIndex >= photos.length - 1 ? (
            <button
              type="button"
              data-film-autoplay-control
              aria-label="Rewind to first photo"
              onClick={rewindFilmToStart}
              className="pointer-events-auto flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-full border border-gray-200 p-1.5 text-gray-400 transition-opacity hover:opacity-80 active:opacity-70 md:min-h-10 md:min-w-10 md:p-2"
            >
              <FilmRewindIcon />
            </button>
          ) : (
            <button
              type="button"
              data-film-autoplay-control
              aria-label={filmAutoplayPlaying ? 'Pause slideshow' : 'Play slideshow'}
              aria-pressed={filmAutoplayPlaying}
              onClick={() => {
                if (filmAutoplayPlaying) {
                  setFilmAutoplayPlaying(false);
                  return;
                }
                startFilmAutoplay();
              }}
              className="pointer-events-auto flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-full border border-gray-200 p-1.5 text-gray-400 transition-opacity hover:opacity-80 active:opacity-70 md:min-h-10 md:min-w-10 md:p-2"
            >
              <FilmAutoplayIcon playing={filmAutoplayPlaying} />
            </button>
          )}
        </div>
      ) : null}

      <div
        ref={topGradientRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-[16] h-[36vh]"
        style={{
          opacity: 0,
          background:
            'linear-gradient(to bottom, rgb(250,250,250) 0%, rgb(250,250,250) 30%, rgba(250,250,250,0.95) 45%, rgba(250,250,250,0.78) 58%, rgba(250,250,250,0.5) 70%, rgba(250,250,250,0.2) 84%, transparent 100%)',
        }}
        aria-hidden
      />
      <div
        ref={bottomGradientRef}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[16] h-[48vh]"
        style={{
          opacity: 0,
          background:
            'linear-gradient(to top, rgb(250,250,250) 0%, rgb(250,250,250) 30%, rgba(250,250,250,0.95) 45%, rgba(250,250,250,0.78) 58%, rgba(250,250,250,0.5) 70%, rgba(250,250,250,0.2) 84%, transparent 100%)',
        }}
        aria-hidden
      />

      <div
        ref={stripRef}
        className="absolute left-0 z-[1]"
        style={{
          opacity: filmLayoutReady ? 1 : 0,
          pointerEvents: filmLayoutReady ? 'auto' : 'none',
        }}
      >
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            ref={(el) => { itemRefs.current[i] = el; }}
            className="absolute overflow-hidden rounded-[3px] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 cursor-pointer"
            style={{
              width: BASE_WIDTH,
              height: BASE_WIDTH / filmSafeAspectRatio(photo.aspectRatio),
            }}
            aria-label={`Show ${photo.title}`}
            aria-current={activeIndex === i ? true : undefined}
            onClick={() => scrollToIndex(i)}
          >
            <img
              src={photo.src}
              alt=""
              className="pointer-events-none h-full w-full object-cover"
              draggable={false}
              loading="lazy"
              onLoad={(e) => {
                syncPhotoAspectRatio(
                  photo.id,
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight,
                );
              }}
            />
          </button>
        ))}
      </div>

      <div
        className="pointer-events-none fixed bottom-0 left-0 z-[15] w-20 md:w-[24vw]"
        style={{
          top:
            'calc(env(safe-area-inset-top, 0px) + clamp(5.25rem, 4.25rem + 6.5vh, 10.5rem))',
          background: FILM_EDGE_GRADIENT_LEFT,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-0 right-0 bottom-0 z-[15] w-20 md:w-[24vw]"
        style={{
          background: FILM_EDGE_GRADIENT_RIGHT,
        }}
        aria-hidden
      />

      <div className="absolute bottom-[clamp(0.5rem,0.25rem+2vh,1.75rem)] left-0 right-0 z-20 flex justify-center px-2 min-[640px]:bottom-[clamp(0.75rem,0.375rem+2.5vh,3.25rem)] min-[640px]:left-1/2 min-[640px]:right-auto min-[640px]:w-auto min-[640px]:-translate-x-1/2 min-[640px]:px-0">
        {photos.length > 0 ? (
        <FilmPhotoHashmarks
          photos={photos}
          currentIndex={activeIndex}
          noteStableIndex={noteStableIndex}
          onSelect={scrollToIndex}
          galleryX={galleryX}
        />
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="fixed top-8 left-6 z-[100] cursor-pointer hover:opacity-80 md:left-16"
        aria-label="Go back to home"
      >
        <img
          src={imgLogo}
          alt=""
          className="relative z-[100] h-8 w-8 object-contain md:h-[44px] md:w-[44px]"
        />
      </button>

      <InfoButton project={projectInfo} />
    </motion.div>
    <div
      data-film-page
      className="w-full bg-[#fafafa]"
      style={{ height: scrollDriverHeightPx }}
      aria-hidden
    />
    </>
  );
}
