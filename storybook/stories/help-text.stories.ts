import type { StoryModule } from "../metadata.js";

const helpText: StoryModule = {
  title: "Components/Feedback/Help Text",
  meta: {
    id: "help-text",
    tag: "box-help-text",
    shortDescription: "Inline supporting guidance for a field or section.",
    docsDescription:
      "Passive help copy with optional `tone`. Pair near the control it explains; keep messages short.",
    sourceSnippet: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Short help title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting guidance body." },
      { kind: "attribute", name: "tone", type: "string", description: "Optional emphasis." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>` },
    { name: "Warning", html: `<box-help-text label="Permissions" message="Editors can reshare this folder." tone="warning"></box-help-text>` },
  ],
};

export default helpText;
