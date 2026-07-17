import { radii, oddRadii, subSlug, uniformTag } from "../tokens";
import { Section, SubLabel, Grid, RowList, TokenCard, TokenRow } from "../primitives";

export default function RadiusSection() {
  const radiiTag = uniformTag(radii);
  const oddRadiiTag = uniformTag(oddRadii);

  return (
    <Section id={subSlug("Border Radius")} title="Border Radius">
      <div className="mb-10">
        <div className="rounded-2xl bg-zinc-50 px-6 py-12">
          <div className="flex justify-center gap-16">
            {(
              [
                {
                  label: "Round",
                  // Circular corner arcs (from Figma)
                  d: "M35.175 1.575H102.375C111.286 1.575 119.833 5.11499 126.134 11.4162C132.435 17.7174 135.975 26.2637 135.975 35.175V102.375C135.975 111.286 132.435 119.833 126.134 126.134C119.833 132.435 111.286 135.975 102.375 135.975H35.175C26.2637 135.975 17.7174 132.435 11.4162 126.134C5.11499 119.833 1.575 111.286 1.575 102.375V35.175C1.575 26.2637 5.11499 17.7174 11.4162 11.4162C17.7174 5.11499 26.2637 1.575 35.175 1.575Z",
                },
                {
                  label: "Squircle",
                  // Superellipse-ish corners — fuller near the edges (from Figma)
                  d: "M35.175 1.575H102.375C125.475 1.575 135.975 12.075 135.975 35.175V102.375C135.975 125.475 125.475 135.975 102.375 135.975H35.175C12.075 135.975 1.575 125.475 1.575 102.375V35.175C1.575 12.075 12.075 1.575 35.175 1.575Z",
                },
              ] as const
            ).map(({ label, d }) => (
              <div key={label} className="flex w-[168px] flex-col items-center">
                <div className="relative size-[168px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
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
                      strokeOpacity="0.3"
                      strokeWidth="3.15"
                    />
                  </svg>
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

      <SubLabel
        note="Deliberately precise / odd radii from Figma exports and device mockups."
        tag={oddRadiiTag}
      >
        Experiment radii
      </SubLabel>
      <RowList>
        {oddRadii.map((r) => (
          <TokenRow
            key={r.name}
            name={r.name}
            tag={oddRadiiTag ? undefined : r.tag}
            value={r.value}
            usage={r.usage}
          />
        ))}
      </RowList>
    </Section>
  );
}
