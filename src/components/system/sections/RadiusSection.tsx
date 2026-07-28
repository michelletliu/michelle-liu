"use client";

import { useState } from "react";
import clsx from "clsx";
import { radii, uniformTag } from "../tokens";
import { SubLabel, Grid, TokenCard } from "../primitives";
import { ghostIconButtonClass } from "../../ghostIconButton";
import { iconSize } from "../../iconSizes";
import { GridIcon } from "../../library/icons";

/** Radius 40 so round vs squircle reads clearly. viewBox 137.55. */
const ROUND_PATH =
  "M41.575 1.575H95.975A40 40 0 0 1 135.975 41.575V95.975A40 40 0 0 1 95.975 135.975H41.575A40 40 0 0 1 1.575 95.975V41.575A40 40 0 0 1 41.575 1.575Z";
const SQUIRCLE_PATH =
  "M41.575 1.575H95.975C123.375 1.575 135.975 14.055 135.975 41.575V95.975C135.975 123.375 123.495 135.975 95.975 135.975H41.575C14.175 135.975 1.575 123.495 1.575 95.975V41.575C1.575 14.175 14.055 1.575 41.575 1.575Z";

/** Corner arcs only — same geometry as the closed paths above. */
const ROUND_CORNERS = [
  "M95.975 1.575A40 40 0 0 1 135.975 41.575",
  "M135.975 95.975A40 40 0 0 1 95.975 135.975",
  "M41.575 135.975A40 40 0 0 1 1.575 95.975",
  "M1.575 41.575A40 40 0 0 1 41.575 1.575",
] as const;
const SQUIRCLE_CORNERS = [
  "M95.975 1.575C123.375 1.575 135.975 14.055 135.975 41.575",
  "M135.975 95.975C135.975 123.375 123.495 135.975 95.975 135.975",
  "M41.575 135.975C14.175 135.975 1.575 123.495 1.575 95.975",
  "M1.575 41.575C1.575 14.175 14.055 1.575 41.575 1.575",
] as const;

const CORNER_SPECIMENS = [
  { label: "Round", d: ROUND_PATH, overlayCorners: SQUIRCLE_CORNERS },
  { label: "Squircle", d: SQUIRCLE_PATH, overlayCorners: ROUND_CORNERS },
] as const;

/** Radius diagram + scale — first subhead under Borders. */
export default function RadiusBlock() {
  const radiiTag = uniformTag(radii);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <>
      <SubLabel>Radius</SubLabel>
      <div className="mb-10">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
          <button
            type="button"
            aria-pressed={showGrid}
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            onClick={() => setShowGrid((v) => !v)}
            className={clsx(
              // Solid zinc-50 fill so card grid never shows through the circle
              ghostIconButtonClass("sm", "absolute right-3 top-3 z-[3] bg-zinc-50 text-zinc-300"),
              "hover:bg-zinc-100 hover:text-zinc-400",
              "active:bg-zinc-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
            )}
          >
            <GridIcon size={iconSize("inline")} filled={showGrid} />
          </button>

          <div className="relative flex justify-center gap-8 sm:gap-16">
            {CORNER_SPECIMENS.map(({ label, d, overlayCorners }) => (
              <div
                key={label}
                className="flex w-[112px] flex-col items-center sm:w-[168px]"
              >
                <div className="relative size-[112px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)] sm:size-[168px]">
                  <svg
                    viewBox="0 0 137.55 137.55"
                    className="absolute inset-[10%] overflow-visible"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d={d}
                      fill="white"
                      stroke="#9F9FA9"
                      strokeOpacity={showGrid ? 0.15 : 0.3}
                      strokeWidth={showGrid ? 1 : 3.15}
                      vectorEffect={showGrid ? "non-scaling-stroke" : undefined}
                    />
                  </svg>
                  {showGrid && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-[1]"
                      style={{
                        // 5% cells → shape (inset 10%) spans 16 cells with 2 cells outside each edge.
                        // Line at end of each cell; clip outer 1px so no perimeter on any side.
                        backgroundImage: `
                          linear-gradient(to right, transparent calc(100% - 1px), rgb(161 161 170 / 0.18) 1px),
                          linear-gradient(to bottom, transparent calc(100% - 1px), rgb(161 161 170 / 0.18) 1px)
                        `,
                        backgroundSize: "5% 5%",
                        backgroundPosition: "0 0",
                        clipPath: "inset(1px)",
                      }}
                    />
                  )}
                  {showGrid && (
                    <svg
                      viewBox="0 0 137.55 137.55"
                      className="pointer-events-none absolute inset-[10%] z-[2] overflow-visible"
                      fill="none"
                      aria-hidden
                    >
                      {overlayCorners.map((corner) => (
                        <path
                          key={corner}
                          d={corner}
                          fill="none"
                          stroke="#60a5fa"
                          strokeOpacity="0.55"
                          strokeWidth="1"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>
                  )}
                </div>
                <p className="mt-2 text-center text-sm text-zinc-500">{label}</p>
              </div>
            ))}
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
