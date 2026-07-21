import type { StoryModule } from "../metadata.js";

const helpText: StoryModule = {
  title: "Components/Feedback/Help Text",
  meta: {
    id: "help-text",
    tag: "box-help-text",
    shortDescription: "Inline supporting guidance for a field or section.",
    docsDescription:
      "Passive help copy with optional `tone`. Pair near the control it explains; keep messages short. With `tone=\"error\"` it becomes an inline validation error — announced assertively via `role=\"alert\"` — instead of the passive `role=\"note\"`.",
    sourceSnippet: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Short help title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting guidance body." },
      { kind: "attribute", name: "tone", type: '"info" | "success" | "warning" | "error"', description: "Emphasis; error announces as an alert." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>` },
    { name: "Warning", html: `<box-help-text label="Permissions" message="Editors can reshare this folder." tone="warning"></box-help-text>` },
    { name: "Error", html: `<box-help-text message="Enter a valid email address." tone="error"></box-help-text>` },
  ],
};

export default helpText;
