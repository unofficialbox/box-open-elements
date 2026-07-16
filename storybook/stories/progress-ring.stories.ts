import type { StoryModule } from "../metadata.js";

const progressRing: StoryModule = {
  title: "Components/Feedback/Progress Ring",
  meta: {
    id: "progress-ring",
    tag: "box-progress-ring",
    shortDescription: "A circular determinate progress indicator.",
    docsDescription: "Shows completion with `value` (and optional `max`) plus an accessible `label`.",
    sourceSnippet: `<box-progress-ring label="Sync" value="80"></box-progress-ring>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the progress." },
      { kind: "attribute", name: "value", type: "number", description: "Current progress value." },
      { kind: "attribute", name: "max", type: "number", description: "Maximum value (default 100)." },
      { kind: "attribute", name: "size", type: "string", description: "Visual size variant when supported." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-progress-ring label="Sync" value="80"></box-progress-ring>` },
    { name: "Empty", html: `<box-progress-ring label="Sync" value="0"></box-progress-ring>` },
    { name: "Complete", html: `<box-progress-ring label="Sync" value="100"></box-progress-ring>` },
  ],
};

export default progressRing;
