import type { StoryModule } from "../metadata.js";

const slider: StoryModule = {
  title: "Components/Forms/Slider",
  meta: {
    id: "slider",
    tag: "box-slider",
    shortDescription: "A labelled range slider.",
    docsDescription: "Form-associated slider with `value` between `min` and `max`.",
    sourceSnippet: `<box-slider label="Density" value="40" min="0" max="100"></box-slider>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "number", description: "Current value." },
      { kind: "attribute", name: "min", type: "number", description: "Lower bound." },
      { kind: "attribute", name: "max", type: "number", description: "Upper bound." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the control inert." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-slider label="Density" value="40" min="0" max="100"></box-slider>` },
    { name: "Disabled", html: `<box-slider label="Density" value="40" min="0" max="100" disabled></box-slider>` },
  ],
};

export default slider;
