import { shadows } from "../tokens";
import { Section, Grid, TokenCard } from "../primitives";

export default function ShadowSection() {
  return (
    <Section
      id="shadows"
      title="Shadows"
      subtitle="Soft, low-opacity elevation. shadow-default (a zinc-tinted lift) is the workhorse; images and experiments layer their own."
    >
      <Grid min="240px">
        {shadows.map((s) => (
          <TokenCard
            key={s.name}
            name={s.name}
            tag={s.tag}
            value={s.value}
            usage={s.usage}
            sample={
              <div
                className="h-14 w-14 rounded-2xl bg-white"
                style={{ boxShadow: s.value }}
              />
            }
          />
        ))}
      </Grid>
    </Section>
  );
}
