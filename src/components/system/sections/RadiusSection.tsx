import { radii, oddRadii } from "../tokens";
import { Section, SubLabel, Grid, RowList, TokenCard, TokenRow } from "../primitives";

export default function RadiusSection() {
  return (
    <Section
      id="radius"
      title="Corner Radius"
      subtitle="Generously rounded. 26px is the signature radius on project media & modals. A global squircle enhancement reshapes every corner where supported."
    >
      <div className="mb-10 rounded-2xl bg-zinc-50 p-6">
        <h3 className="text-sm font-medium text-zinc-500">
          Squircle corner-shape
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500 text-pretty">
          When a browser supports <code className="font-mono text-zinc-400">corner-shape: squircle</code>,
          <code className="font-mono text-zinc-400"> index.css</code> applies it globally and{" "}
          compensates the border-radius ~1.7× so the perceived roundness stays
          constant (a full squircle visually shrinks corners). Circles and pills opt back into{" "}
          <code className="font-mono text-zinc-400">corner-shape: round</code>. The samples below are
          squircled in supporting browsers.
        </p>
      </div>

      <SubLabel>Radius scale</SubLabel>
      <Grid min="170px">
        {radii.map((r) => (
          <TokenCard
            key={r.name}
            name={r.name}
            tag={r.tag}
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

      <SubLabel note="Deliberately precise / odd radii from Figma exports and device mockups.">
        Experiment radii
      </SubLabel>
      <RowList>
        {oddRadii.map((r) => (
          <TokenRow key={r.name} name={r.name} tag={r.tag} value={r.value} usage={r.usage} />
        ))}
      </RowList>
    </Section>
  );
}
