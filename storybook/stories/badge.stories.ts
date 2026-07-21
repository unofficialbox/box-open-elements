import type { StoryModule } from "../metadata.js";

const badge: StoryModule = {
  title: "Components/Feedback/Badge",
  meta: {
    id: "badge",
    tag: "box-badge",
    shortDescription: "A compact status label.",
    docsDescription: "A small inline label for status or categorization, in the Box feedback tones. When used as a count, `max` caps the number (e.g. `max=\"99\"` shows `99+`), `hide-when-zero` removes it at zero/empty, and `animate` pops the badge whenever the count changes.",
    sourceSnippet: `<box-badge label="Beta"></box-badge>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Badge text (or a count when used as a count badge)." },
      { kind: "attribute", name: "tone", type: '"neutral" | "success" | "warning" | "error"', description: "Status color." },
      { kind: "attribute", name: "max", type: "number", description: "Cap a numeric label, rendering values above it as \"max+\"." },
      { kind: "attribute", name: "hide-when-zero", type: "boolean", description: "Hide the badge when the count is 0 or empty." },
      { kind: "attribute", name: "animate", type: "boolean", description: "Pop the badge when the displayed value changes." },
    ],
  },
  variants: [
    { name: "Neutral", html: `<box-badge label="Beta"></box-badge>` },
    { name: "Success", html: `<box-badge label="Active" tone="success"></box-badge>` },
    { name: "Warning", html: `<box-badge label="Pending" tone="warning"></box-badge>` },
    { name: "Error", html: `<box-badge label="Failed" tone="error"></box-badge>` },
    { name: "Capped count", html: `<box-badge label="128" tone="error" max="99"></box-badge>` },
  ],
};

export default badge;
