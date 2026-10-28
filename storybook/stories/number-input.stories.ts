import type { StoryModule } from "../metadata.js";

const numberInput: StoryModule = {
  title: "Components/Forms/Number Input",
  meta: {
    id: "number-input",
    tag: "box-number-input",
    shortDescription: "A labelled numeric field with optional bounds.",
    docsDescription: "Form-associated number entry. Use `min` / `max` / `value` with an accessible `label`.",
    sourceSnippet: `<box-number-input label="Page size" value="25" min="1" max="100"></box-number-input>`,
    referenceRows: [
      { kind:"attribute", name:"allow-empty", type:"boolean", description:"Opt in to nullable empty values and placeholder display." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "number", description: "Current numeric value." },
      { kind: "attribute", name: "min", type: "number", description: "Lower bound." },
      { kind: "attribute", name: "max", type: "number", description: "Upper bound." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
    ],
  },
  variants: [
    { name:"Optional empty", html:`<box-number-input label="Needs at least" allow-empty placeholder="No minimum" min="1"></box-number-input>` },
    { name: "Default", html: `<box-number-input label="Page size" value="25" min="1" max="100"></box-number-input>` },
    { name: "Disabled", html: `<box-number-input label="Page size" value="25" min="1" max="100" disabled></box-number-input>` },
  ],
};

export default numberInput;
