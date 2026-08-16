"use client";

import { useState } from "react";
import clsx from "clsx";
import { radii, uniformTag } from "../tokens";
import { SubLabel, Grid, TokenCard } from "../primitives";
import { ghostIconButtonClass } from "../../shared/ghostIconButton";
import { iconSize } from "../../shared/iconSizes";
import { GridIcon } from "../../library/icons";
import Tooltip from "../../shared/Tooltip";

/** viewBox 137.55; 1.575 inset keeps the stroke inside the box. */
const VIEWBOX = 137.55;
const PAD = 1.575;
/** Large enough that round vs squircle diverges clearly at the corners. */
const RADIUS = 56;
/** Handle ratios from the original r=40 Figma squircle export. */
const SQUIRCLE_H = 27.4 / 40;
const SQUIRCLE_H2 = 27.52 / 40;

const fmt = (n: number) => String(Number(n.toFixed(3)));

function roundPath(r: number): string {
  const min = PAD;
  const max = VIEWBOX - PAD;
  const a = min + r;
  const b = max - r;
  return `M${fmt(a)} ${fmt(min)}H${fmt(b)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(max)} ${fmt(a)}V${fmt(b)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(b)} ${fmt(max)}H${fmt(a)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(min)} ${fmt(b)}V${fmt(a)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(a)} ${fmt(min)}Z`;
}

function squirclePath(r: number): string {
  const min = PAD;
  const max = VIEWBOX - PAD;
  const a = min + r;
  const b = max - r;
  const h = r * SQUIRCLE_H;
  const h2 = r * SQUIRCLE_H2;
  return `M${fmt(a)} ${fmt(min)}H${fmt(b)}C${fmt(b + h)} ${fmt(min)} ${fmt(max)} ${fmt(a - h2)} ${fmt(max)} ${fmt(a)}V${fmt(b)}C${fmt(max)} ${fmt(b + h)} ${fmt(b + h2)} ${fmt(max)} ${fmt(b)} ${fmt(max)}H${fmt(a)}C${fmt(a - h)} ${fmt(max)} ${fmt(min)} ${fmt(b + h2)} ${fmt(min)} ${fmt(b)}V${fmt(a)}C${fmt(min)} ${fmt(a - h)} ${fmt(a - h2)} ${fmt(min)} ${fmt(a)} ${fmt(min)}Z`;
}

const ROUND_PATH = roundPath(RADIUS);
const SQUIRCLE_PATH = squirclePath(RADIUS);

/** blue-600 — same hue, different opacities, so the overlay reads as a key. */
const COMPARE_BLUE = "37 99 235";
/** Shared overlay weight so round doesn’t read as a hairline against squircle. */
const COMPARE_STROKE = 2;

/**
 * Half of (own width + column gap) — 50% of the specimen plus half the gap.
 * gap-8 → 1rem, sm:gap-16 → 2rem.
 */
const MEET_RIGHT =
  "translate-x-[calc(50%+1rem)] sm:translate-x-[calc(50%+2rem)]";
const MEET_LEFT =
  "-translate-x-[calc(50%+1rem)] sm:-translate-x-[calc(50%+2rem)]";

const CORNER_SPECIMENS = [
  {
    label: "Round",
    d: ROUND_PATH,
    meetClass: MEET_RIGHT,
    strokeAlpha: 0.38,
    labelAlpha: 0.5,
  },
  {
    label: "Squircle",
    d: SQUIRCLE_PATH,
    meetClass: MEET_LEFT,
    strokeAlpha: 0.95,
    labelAlpha: 0.95,
  },
] as const;

const GRID_STYLE = {
  backgroundImage: `
    linear-gradient(to right, transparent calc(100% - 1px), rgb(147 197 253 / 0.32) 1px),
    linear-gradient(to bottom, transparent calc(100% - 1px), rgb(147 197 253 / 0.32) 1px)
  `,
  backgroundSize: "10% 10%",
  backgroundPosition: "0 0",
  clipPath: "inset(1px)",
} as const;

/** Same curve as modalSlideIn — compositor-only so the slide stays at 60fps. */
const SLIDE =
  "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";
const MOVE = `transform-gpu transition-transform ${SLIDE}`;
const FADE = `transition-opacity ${SLIDE}`;
const COLOR = `transition-[fill,stroke,color] ${SLIDE}`;

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms    grid toggle; drop-shadow snaps off (not interpolated)
 *    0–500  shapes translate on the compositor; fills/strokes tint
 *           labels tint to matching blue; shared grid fades in
 *    off    reverse — shapes travel back out, gray stroke + white fill
 * ───────────────────────────────────────────────────────── */

/** Radius diagram + scale — first subhead under Borders. */
export default function RadiusBlock() {
  const radiiTag = uniformTag(radii);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <>
      <SubLabel>Radius</SubLabel>
      <div className="mb-10">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
          <div className="absolute right-3 top-3 z-[3]">
            <Tooltip
              label={showGrid ? "Hide grid" : "Show grid"}
              position="bottom"
              portal
            >
              <button
                type="button"
                aria-pressed={showGrid}
                aria-label={showGrid ? "Hide grid" : "Show grid"}
                onClick={() => setShowGrid((v) => !v)}
                className={clsx(
                  // Solid zinc-50 fill so card grid never shows through the circle
                  ghostIconButtonClass("sm", "bg-zinc-50 text-zinc-300"),
                  "hover:bg-zinc-100 hover:text-zinc-400",
                  "active:bg-zinc-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
                )}
              >
                <GridIcon size={iconSize("sm")} filled={showGrid} />
              </button>
            </Tooltip>
          </div>

          <div className="relative flex justify-center gap-8 sm:gap-16">
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute left-1/2 top-0 z-[1] size-[112px] -translate-x-1/2 sm:size-[168px]",
                FADE,
                showGrid ? "opacity-100" : "opacity-0",
              )}
              style={GRID_STYLE}
            />

            {CORNER_SPECIMENS.map(
              ({ label, d, meetClass, strokeAlpha, labelAlpha }) => (
                <div
                  key={label}
                  className="flex w-[112px] flex-col items-center sm:w-[168px]"
                >
                  <div
                    className={clsx(
                      "relative z-[2] size-[112px] sm:size-[168px]",
                      MOVE,
                      showGrid ? meetClass : "translate-x-0",
                      !showGrid &&
                        "drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
                    )}
                  >
                    <svg
                      viewBox="0 0 137.55 137.55"
                      className="absolute inset-[10%] overflow-visible"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d={d}
                        className={COLOR}
                        style={{
                          fill: showGrid ? "rgb(255 255 255 / 0)" : "rgb(255 255 255)",
                          stroke: showGrid
                            ? `rgb(${COMPARE_BLUE} / ${strokeAlpha})`
                            : "rgb(159 159 169 / 0.3)",
                          strokeWidth: showGrid ? COMPARE_STROKE : 2.4,
                        }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p
                    className={clsx(
                      "relative z-[2] mt-2 text-center text-sm",
                      COLOR,
                    )}
                    style={{
                      color: showGrid
                        ? `rgb(${COMPARE_BLUE} / ${labelAlpha})`
                        : "rgb(113 113 122)",
                    }}
                  >
                    {label}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-500 text-pretty">
          Supporting browsers get{" "}
          <code className="font-mono text-zinc-400">corner-shape: squircle</code>{" "}
          globally. Radius is bumped ~1.7× so corners don’t look tighter. Circles
          and pills stay <code className="font-mono text-zinc-400">round</code>.
        </p>
      </div>

      <SubLabel tag={radiiTag}>Radius scale</SubLabel>
      <Grid min="170px">
        {radii.map((r) => (
          <TokenCard
            key={r.name}
            name={r.name}
            tag={radiiTag ? undefined : r.tag}
            value={
              r.compensated
                ? `${r.value}px → ${r.compensated} squircle`
                : r.value >= 999
                  ? "fully round"
                  : `${r.value}px`
            }
            usage={r.usage}
            sample={
              <div
                className="h-16 w-16 bg-white ring-1 ring-inset ring-zinc-200"
                style={{ borderRadius: r.value >= 999 ? "9999px" : `${r.value}px` }}
              />
            }
          />
        ))}
      </Grid>
    </>
  );
}
