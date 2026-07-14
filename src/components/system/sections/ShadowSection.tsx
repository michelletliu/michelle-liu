import { shadows, uniformTag } from "../tokens";
import { Section, Grid, TokenCard } from "../primitives";

export default function ShadowSection() {
  const sectionTag = uniformTag(shadows);
  return (
    <Section id="shadows" title="Shadows" tag={sectionTag}>
      <Grid min="240px">
        {shadows.map((s) => (
          <TokenCard
            key={s.name}
            name={s.name}
            tag={sectionTag ? undefined : s.tag}
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
