import type { StoryModule } from "../metadata.js";

const spinButton: StoryModule = {
  title: "Components/Forms/Spin Button",
  meta: {
    id: "spin-button",
    tag: "box-spin-button",
    shortDescription: "A numeric stepper control.",
    docsDescription: "Form-associated spinbutton with `value` between optional `min` / `max`.",
    sourceSnippet: "<box-spin-button label=\"Quota (GB)\" value=\"50\" min=\"0\" max=\"500\"></box-spin-button>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "number", description: "Current value." },
      { kind: "attribute", name: "min", type: "number", description: "Lower bound." },
      { kind: "attribute", name: "max", type: "number", description: "Upper bound." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-spin-button label=\"Quota (GB)\" value=\"50\" min=\"0\" max=\"500\"></box-spin-button>" },
  ],
};

export default spinButton;
