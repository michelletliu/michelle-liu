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
import imgFinalSealLogo from "../assets/logo.png";
import imgSealGlyph from "../assets/logo-glyph.png";
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

/** Soft ease — quick start, long settle. */
const MORPH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const MORPH_DURATION = 0.3;

/** Seal outer border in 100×100 space (from ~88px artwork). */
const SEAL_RX = 8;
const SEAL_INSET = 1.5;
const OVERHANG = 11;
/** Straight segment between rounded corners (rail morph target). */
const RAIL_INSET = SEAL_INSET + SEAL_RX;

const morphTransition = (reduce: boolean): Transition =>
  reduce
    ? { duration: 0.15, ease: "easeOut" }
    : { duration: MORPH_DURATION, ease: MORPH_EASE };

/**
 * Seal logo with a morphing blueprint frame.
 * Four open crop rails retract toward the seal’s straight edge segments while
 * a rounded rect peaks mid-transition (matching the red seal border). Glyph
 * layers cross-fade on the same curve. Morph-in fades the bridge out before
 * rails go opaque (avoids stroke stacking); morph-out kills bridge + rails
 * early so the gray path never overlaps the red seal border.
 */
export default function BlueprintLogo({
  mode = "hover",
  className,
}: BlueprintLogoProps) {
  const always = mode === "always";
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const [groupHovered, setGroupHovered] = useState(false);
  // Hover mode: arm on mount so the first red→blueprint hover works. Only stay
  // disarmed when returning from the design-system doorway with the pointer
  // still over the logo (see markBlueprintDoorwayNav). Always mode ignores this.
  const [hoverArmed, setHoverArmed] = useState(true);
  /** True when this instance is holding a sticky-return lock (red until leave). */
  const stickyLockRef = useRef(false);
  const prevBlueprint = useRef<boolean | null>(null);

  const roundedControls = useAnimationControls();
  const railControls = useAnimationControls();

  useLayoutEffect(() => {
    const group = rootRef.current?.closest(".group");
    if (!group) return;

    let raf1 = 0;
    let raf2 = 0;

    if (!always) {
      // On client nav the new logo node often isn't :hover yet inside
      // useLayoutEffect even when the pointer never moved. Tentatively lock
      // when a doorway mark is pending, then confirm after paint.
      if (peekBlueprintDoorwaySticky()) {
        stickyLockRef.current = true;
        setHoverArmed(false);
        if (group.matches(":hover")) setGroupHovered(true);

        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            if (group.matches(":hover")) {
              setGroupHovered(true);
              return;
            }
            // Pointer isn't on the doorway — normal first-hover arming.
            stickyLockRef.current = false;
            clearBlueprintDoorwaySticky();
            setHoverArmed(true);
          });
        });
      } else {
        stickyLockRef.current = false;
        setHoverArmed(true);
        // Hydration/remount can miss pointerenter when the cursor is already over.
        if (group.matches(":hover")) setGroupHovered(true);
      }
    }

    const onEnter = () => {
      // Defer morph re-render so an in-flight click on the parent Link
      // isn't interrupted mid-gesture.
      startTransition(() => setGroupHovered(true));
    };
    const onLeave = () => {
      startTransition(() => {
        setGroupHovered(false);
        setHoverArmed(true);
        // Only the sticky-locked hover doorway clears the mark — never the
        // always-mode DS logo (its unmount leave would wipe a just-set mark).
        if (stickyLockRef.current) {
          stickyLockRef.current = false;
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
  }, [always]);

  const showBlueprint = always
    ? !groupHovered
    : hoverArmed && groupHovered;
  const t = morphTransition(!!reduceMotion);

  const h1 = showBlueprint ? -OVERHANG : RAIL_INSET;
  const h2 = showBlueprint ? 100 + OVERHANG : 100 - RAIL_INSET;
  const v1 = showBlueprint ? -OVERHANG : RAIL_INSET;
  const v2 = showBlueprint ? 100 + OVERHANG : 100 - RAIL_INSET;

  // Resting opacities on first paint; morph bridge only when state actually flips.
  useEffect(() => {
    if (prevBlueprint.current === null) {
      prevBlueprint.current = showBlueprint;
      roundedControls.set({ opacity: 0 });
      railControls.set({ opacity: showBlueprint ? 1 : 0 });
      return;
    }

    if (prevBlueprint.current === showBlueprint) return;
    prevBlueprint.current = showBlueprint;

    if (reduceMotion) {
      roundedControls.set({ opacity: 0 });
      railControls.start({
        opacity: showBlueprint ? 1 : 0,
        transition: { duration: 0.15, ease: "easeOut" },
      });
      return;
    }

    // Bridge peaks then hides; morph-in clears it before rails go solid so
    // corners don't stack (ghost/shadow). Morph-out kills bridge + rails in
    // the first ~25% so the gray rounded path never rings the red seal.
    if (showBlueprint) {
      roundedControls.start({
        opacity: [0, 0.9, 0, 0],
        transition: {
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          times: [0, 0.22, 0.48, 1],
        },
      });
      railControls.start({
        opacity: [0, 0.12, 1],
        transition: {
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          times: [0, 0.42, 1],
        },
      });
    } else {
      roundedControls.start({
        opacity: [0, 0.55, 0, 0],
        transition: {
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          times: [0, 0.1, 0.26, 1],
        },
      });
      railControls.start({
        opacity: [0.25, 0, 0],
        transition: {
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          times: [0.08, 0.24, 1],
        },
      });
    }
  }, [showBlueprint, reduceMotion, roundedControls, railControls]);

  return (
    <span
      ref={rootRef}
      className={clsx(
        "blueprint-logo relative block size-full overflow-visible",
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
        className="blueprint-frame pointer-events-none absolute inset-0 text-zinc-400/60"
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
            rx={SEAL_RX}
            ry={SEAL_RX}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
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
