"use client";

import clsx from "clsx";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import imgFinalSealLogo from "../assets/logo.png";
import imgSealGlyph from "../assets/logo-glyph.png";

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
  // Hover mode: ignore sticky hover after nav until the pointer leaves once.
  // Always mode arms immediately so gray→red still works on first hover.
  const [hoverArmed, setHoverArmed] = useState(always);
  const prevBlueprint = useRef<boolean | null>(null);

  const roundedControls = useAnimationControls();
  const railControls = useAnimationControls();

  useEffect(() => {
    const group = rootRef.current?.closest(".group");
    if (!group) return;

    const onEnter = () => setGroupHovered(true);
    const onLeave = () => {
      setGroupHovered(false);
      setHoverArmed(true);
    };
    group.addEventListener("pointerenter", onEnter);
    group.addEventListener("pointerleave", onLeave);
    return () => {
      group.removeEventListener("pointerenter", onEnter);
      group.removeEventListener("pointerleave", onLeave);
    };
  }, []);

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
