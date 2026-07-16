import type { StoryModule } from "../metadata.js";

const progressSteps: StoryModule = {
  title: "Components/Feedback/Progress Steps",
  meta: {
    id: "progress-steps",
    tag: "box-progress-steps",
    shortDescription: "A stepped progress indicator.",
    docsDescription: "Pass steps as JSON `items` and the active `value`.",
    sourceSnippet: `<box-progress-steps label="Migration" items='[{"label":"Scan","value":"scan"}]' value="scan"></box-progress-steps>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible steps label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { label, value, description? }." },
      { kind: "attribute", name: "value", type: "string", description: "Active step value." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-progress-steps label="Migration" items='[{"label":"Scan","value":"scan"},{"label":"Copy","value":"copy","description":"In progress"},{"label":"Verify","value":"verify"}]' value="copy"></box-progress-steps>`,
    },
  ],
};

export default progressSteps;
