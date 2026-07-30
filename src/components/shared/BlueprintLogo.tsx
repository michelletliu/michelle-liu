"use client";

import clsx from "clsx";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import imgFinalSealLogo from "../../assets/logo.png";
import imgSealGlyph from "../../assets/logo-glyph.png";
import {
  clearBlueprintDoorwaySticky,
  peekBlueprintDoorwaySticky,
} from "./blueprintDoorwayNav";

type BlueprintLogoProps = {
  /**
   * hover: red default → blueprint on group-hover (home doorway).
   * always: blueprint default → red on group-hover (design-system doorway home).
   */
  mode?: "hover" | "always";
  className?: string;
};

/**
 * Same curve as alexsafayan.com’s squircle↔box toggle:
 * co-tween radius + geometry on a short, controlled ease — not corner-shape.
 */
const MORPH_EASE: [number, number, number, number] = [0.2, 0.2, 0.2, 1];
const MORPH_DURATION = 0.2;

/** Seal outer border in 100×100 space (from ~88px artwork). */
const SEAL_RX = 8;
const SEAL_INSET = 1.5;
const OVERHANG = 11;
/** Straight segment between rounded corners (rail morph target). */
const RAIL_INSET = SEAL_INSET + SEAL_RX;

const morphTransition = (reduce: boolean): Transition =>
  reduce
    ? { duration: 0.12, ease: "easeOut" }
    : { duration: MORPH_DURATION, ease: MORPH_EASE };

/**
 * Hover morph only on true hover pointers. Touch/coarse leaves sticky
 * `:hover` after tap (gray seal stuck on home), so skip morph there —
 * tap just navigates. Mirrors Tooltip: also latch off on first touchstart
 * for hybrid iPad / simulator cases where `(hover: hover)` still matches.
 */
function useHoverMorphCapable(): boolean {
  const [capable, setCapable] = useState(() => {
    if (typeof window === "undefined") return true;
    return (
      window.matchMedia("(hover: hover)").matches &&
      !window.matchMedia("(pointer: coarse)").matches
    );
  });

  useEffect(() => {
    const hoverMq = window.matchMedia("(hover: hover)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    let touchLatched = false;
    const sync = () => {
      setCapable(
        hoverMq.matches && !coarseMq.matches && !touchLatched
      );
    };
    const onTouch = () => {
      touchLatched = true;
      setCapable(false);
      window.removeEventListener("touchstart", onTouch);
    };
    sync();
    hoverMq.addEventListener("change", sync);
    coarseMq.addEventListener("change", sync);
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      hoverMq.removeEventListener("change", sync);
      coarseMq.removeEventListener("change", sync);
      window.removeEventListener("touchstart", onTouch);
    };
  }, []);

  return capable;
}

/**
 * Seal logo with a morphing blueprint frame.
 * Squircle→crop-marks: co-tween rect rx with rail extension on a shared
 * 200ms cubic-bezier(.2,.2,.2,1) (same idea as alexsafayan.com’s toggle).
 * Glyph layers cross-fade on that curve. Morph-in clears the bridge before
 * rails go solid; morph-out drops rails early so gray never rings the red seal.
 */
export default function BlueprintLogo({
  mode = "hover",
  className,
}: BlueprintLogoProps) {
  const always = mode === "always";
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const hoverMorphCapable = useHoverMorphCapable();
  const [groupHovered, setGroupHovered] = useState(false);
  // Arm on mount so the first hover morph works. Stay disarmed when arriving
  // through the doorway with the pointer still over the logo
  // (see markBlueprintDoorwayNav) — hover mode stays red, always stays gray
  // until pointerleave.
  const [hoverArmed, setHoverArmed] = useState(true);
  /** True when this instance is holding a sticky-return lock (until leave). */
  const stickyLockRef = useRef(false);
  const prevBlueprint = useRef<boolean | null>(null);

  const roundedControls = useAnimationControls();
  const railControls = useAnimationControls();

  useLayoutEffect(() => {
    const group = rootRef.current?.closest(".group");
    if (!group) return;

    // Touch / coarse: resting seal only (red on home, blueprint on DS).
    // Sticky :hover after tap must not drive morph / doorway lock.
    if (!hoverMorphCapable) {
      stickyLockRef.current = false;
      clearBlueprintDoorwaySticky();
      setGroupHovered(false);
      setHoverArmed(true);
      return;
    }

    let raf1 = 0;
    let raf2 = 0;

    // On client nav the new logo node often isn't :hover yet inside
    // useLayoutEffect even when the pointer never moved. Tentatively disarm
    // when a doorway mark is pending, then confirm after paint.
    // Only the instance actually under the pointer claims the lock — the DS
    // footer brand also uses mode="always" and must not steal/clear the mark.
    if (peekBlueprintDoorwaySticky()) {
      setHoverArmed(false);
      if (group.matches(":hover")) setGroupHovered(true);

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (group.matches(":hover")) {
            // Keep resting color (home red / DS gray) until pointer leaves.
            setGroupHovered(true);
            stickyLockRef.current = true;
            return;
          }
          // Not under the pointer — re-arm; leave the mark for the seal that is.
          stickyLockRef.current = false;
          setGroupHovered(false);
          setHoverArmed(true);
        });
      });
    } else {
      stickyLockRef.current = false;
      setHoverArmed(true);
      // Hydration/remount can miss pointerenter when the cursor is already over.
      if (group.matches(":hover")) setGroupHovered(true);
    }

    const onEnter = (event: Event) => {
      // Ignore touch/pen "hover" emulation — only real mouse hover morphs.
      if (event instanceof PointerEvent && event.pointerType !== "mouse") {
        return;
      }
      // Defer morph re-render so an in-flight click on the parent Link
      // isn't interrupted mid-gesture.
      startTransition(() => setGroupHovered(true));
    };
    const onLeave = () => {
      startTransition(() => {
        setGroupHovered(false);
        setHoverArmed(true);
        if (!stickyLockRef.current) return;
        stickyLockRef.current = false;
        // Real pointer leave (node still mounted) clears the mark. Unmount
        // during doorway nav disconnects the node — keep the mark so the
        // destination seal can stay resting while the cursor hasn't moved.
        if (rootRef.current?.isConnected) {
          clearBlueprintDoorwaySticky();
        }
      });
    };
    group.addEventListener("pointerenter", onEnter);
    group.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      group.removeEventListener("pointerenter", onEnter);
      group.removeEventListener("pointerleave", onLeave);
    };
  }, [always, hoverMorphCapable]);

  // Hover: red resting, gray while armed+hovered.
  // Always: gray resting, red while armed+hovered.
  // Disarmed (sticky doorway): keep resting color until pointer leaves.
  const showBlueprint = always
    ? !(hoverArmed && groupHovered)
    : hoverArmed && groupHovered;
  const t = morphTransition(!!reduceMotion);

  const h1 = showBlueprint ? -OVERHANG : RAIL_INSET;
  const h2 = showBlueprint ? 100 + OVERHANG : 100 - RAIL_INSET;
  const v1 = showBlueprint ? -OVERHANG : RAIL_INSET;
  const v2 = showBlueprint ? 100 + OVERHANG : 100 - RAIL_INSET;

  // Resting opacities on first paint; morph bridge only when state actually flips.
  // Radius + rail opacity share one curve (Alex-style): animate rx→0 with the
  // crop marks, don't try to interpolate corner-shape.
  useEffect(() => {
    if (prevBlueprint.current === null) {
      prevBlueprint.current = showBlueprint;
      roundedControls.set({
        opacity: 0,
        rx: showBlueprint ? 0 : SEAL_RX,
        ry: showBlueprint ? 0 : SEAL_RX,
      });
      railControls.set({ opacity: showBlueprint ? 1 : 0 });
      return;
    }

    if (prevBlueprint.current === showBlueprint) return;
    prevBlueprint.current = showBlueprint;

    if (reduceMotion) {
      roundedControls.set({
        opacity: 0,
        rx: showBlueprint ? 0 : SEAL_RX,
        ry: showBlueprint ? 0 : SEAL_RX,
      });
      railControls.start({
        opacity: showBlueprint ? 1 : 0,
        transition: { duration: 0.12, ease: "easeOut" },
      });
      return;
    }

    const shared = { duration: MORPH_DURATION, ease: MORPH_EASE } as const;

    // Morph-in: closed squircle flattens (rx→0) while rails extend + fade in.
    // Bridge clears before rails go solid so corners don't double-stroke.
    if (showBlueprint) {
      roundedControls.start({
        opacity: [0, 0.95, 0, 0],
        rx: [SEAL_RX, SEAL_RX * 0.4, 0, 0],
        ry: [SEAL_RX, SEAL_RX * 0.4, 0, 0],
        transition: { ...shared, times: [0, 0.35, 0.7, 1] },
      });
      railControls.start({
        opacity: [0, 0.2, 1],
        transition: { ...shared, times: [0, 0.4, 1] },
      });
    } else {
      // Morph-out: rails drop fast; brief radius restore so gray never rings the red seal.
      roundedControls.start({
        opacity: [0, 0.55, 0, 0],
        rx: [0, SEAL_RX * 0.45, SEAL_RX, SEAL_RX],
        ry: [0, SEAL_RX * 0.45, SEAL_RX, SEAL_RX],
        transition: { ...shared, times: [0, 0.2, 0.45, 1] },
      });
      railControls.start({
        opacity: [0.3, 0, 0],
        transition: { ...shared, times: [0, 0.35, 1] },
      });
    }
  }, [showBlueprint, reduceMotion, roundedControls, railControls]);

  return (
    <span
      ref={rootRef}
      className={clsx(
        // pointer-events-none: hit the parent <a class="group"> directly so
        // morph re-renders on this node can't swallow the doorway click.
        "blueprint-logo pointer-events-none relative block size-full overflow-visible",
        always && "blueprint-logo--always",
        showBlueprint && "blueprint-logo--blueprint",
        className
      )}
      aria-hidden="true"
    >
      <motion.img
        alt=""
        src={imgFinalSealLogo}
        className="absolute inset-0 size-full object-contain pointer-events-none"
        initial={false}
        animate={{ opacity: showBlueprint ? 0 : 1 }}
        transition={t}
      />

      <motion.span
        className="absolute inset-0 bg-zinc-400 pointer-events-none"
        style={{
          WebkitMaskImage: `url(${imgSealGlyph})`,
          maskImage: `url(${imgSealGlyph})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        initial={false}
        animate={{ opacity: showBlueprint ? 1 : 0 }}
        transition={t}
      />

      <svg
        className="blueprint-frame pointer-events-none absolute inset-0 text-zinc-400/60 will-change-transform"
        viewBox="0 0 100 100"
        fill="none"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g
          stroke="currentColor"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        >
          <motion.rect
            className="blueprint-frame-rounded"
            x={SEAL_INSET}
            y={SEAL_INSET}
            width={100 - SEAL_INSET * 2}
            height={100 - SEAL_INSET * 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, rx: SEAL_RX, ry: SEAL_RX }}
            animate={roundedControls}
          />

          <motion.g
            className="blueprint-frame-strokes"
            strokeLinecap="square"
            initial={{ opacity: always ? 1 : 0 }}
            animate={railControls}
          >
            <motion.line
              className="blueprint-frame-line"
              y1={0}
              y2={0}
              initial={false}
              animate={{ x1: h1, x2: h2 }}
              transition={t}
            />
            <motion.line
              className="blueprint-frame-line"
              y1={100}
              y2={100}
              initial={false}
              animate={{ x1: h1, x2: h2 }}
              transition={t}
            />
            <motion.line
              className="blueprint-frame-line"
              x1={0}
              x2={0}
              initial={false}
              animate={{ y1: v1, y2: v2 }}
              transition={t}
            />
            <motion.line
              className="blueprint-frame-line"
              x1={100}
              x2={100}
              initial={false}
              animate={{ y1: v1, y2: v2 }}
              transition={t}
            />
          </motion.g>
        </g>
      </svg>
    </span>
  );
}
