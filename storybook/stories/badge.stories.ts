import type { StoryModule } from "../metadata.js";

const badge: StoryModule = {
  title: "Components/Feedback/Badge",
  meta: {
    id: "badge",
    tag: "box-badge",
    shortDescription: "A compact status label.",
    docsDescription: "A small inline label for status or categorization, in the Box feedback tones.",
    sourceSnippet: `<box-badge label="Beta"></box-badge>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Badge text." },
      { kind: "attribute", name: "tone", type: '"neutral" | "success" | "warning" | "error"', description: "Status color." },
    ],
  },
  variants: [
    { name: "Neutral", html: `<box-badge label="Beta"></box-badge>` },
    { name: "Success", html: `<box-badge label="Active" tone="success"></box-badge>` },
    { name: "Warning", html: `<box-badge label="Pending" tone="warning"></box-badge>` },
    { name: "Error", html: `<box-badge label="Failed" tone="error"></box-badge>` },
  ],
};

export default badge;
