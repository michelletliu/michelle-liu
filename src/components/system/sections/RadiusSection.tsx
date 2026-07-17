import { radii, oddRadii, subSlug, uniformTag } from "../tokens";
import { Section, SubLabel, Grid, RowList, TokenCard, TokenRow } from "../primitives";

export default function RadiusSection() {
  const radiiTag = uniformTag(radii);
  const oddRadiiTag = uniformTag(oddRadii);

  return (
    <Section id={subSlug("Border Radius")} title="Border Radius">
      <div className="mb-10 rounded-2xl bg-zinc-50 p-6">
        <h3 className="text-sm font-medium text-zinc-500">
          Squircle corner-shape
        </h3>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-zinc-500 text-pretty">
          Supporting browsers get{" "}
          <code className="font-mono text-zinc-400">corner-shape: squircle</code>{" "}
          globally; radius is bumped ~1.7× so corners don’t look tighter. Circles
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
