import type { StoryModule } from "../metadata.js";

const pillCloud: StoryModule = {
  title: "Components/Forms/Pill Cloud",
  meta: {
    id: "pill-cloud",
    tag: "box-pill-cloud",
    shortDescription: "A multi-select cloud of toggle pills for filters.",
    docsDescription: "Pass selectable facets as JSON `options`; `value` is a JSON string array of selected option values.",
    sourceSnippet: `<box-pill-cloud label="File type" options='[{"value":"pdf","label":"PDF"}]' value='["pdf"]'></box-pill-cloud>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible group label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { value, label, disabled } options." },
      { kind: "attribute", name: "value", type: "json", description: "Selected values as a string array." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when selected values change." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-pill-cloud label="File type" options='[{"value":"pdf","label":"PDF"},{"value":"doc","label":"Documents"},{"value":"img","label":"Images"},{"value":"video","label":"Video"},{"value":"audio","label":"Audio"}]' value='["pdf","img"]'></box-pill-cloud>`,
    },
  ],
};

export default pillCloud;
