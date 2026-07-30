import { Section } from "../primitives";
import { ButtonSpecimens } from "./component-section/ButtonSpecimens";
import { InputSpecimens } from "./component-section/InputSpecimens";
import {
  CardSpecimens,
  DividerSpecimens,
  LoaderSpecimens,
  PillSpecimens,
} from "./component-section/MiscSpecimens";
import { NavigationSpecimens } from "./component-section/NavigationSpecimens";

export default function ComponentSection() {
  return (
    <Section id="components" title="Components">
      <ButtonSpecimens />
      <CardSpecimens />
      <DividerSpecimens />
      <InputSpecimens />
      <LoaderSpecimens />
      <NavigationSpecimens />
      <PillSpecimens />
    </Section>
  );
}
