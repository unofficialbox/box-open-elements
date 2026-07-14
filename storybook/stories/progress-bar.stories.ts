import type { StoryModule } from "../metadata.js";

const progressBar: StoryModule = {
  title: "Components/Feedback/Progress Bar",
  meta: {
    id: "progress-bar",
    tag: "box-progress-bar",
    shortDescription: "A determinate progress indicator.",
    docsDescription: "A horizontal bar showing completion from 0–100 with an accessible label.",
    sourceSnippet: `<box-progress-bar label="Storage used" value="64"></box-progress-bar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible progress label." },
      { kind: "attribute", name: "value", type: "number", description: "Completion percentage (0–100)." },
    ],
  },
  variants: [
    { name: "Low", html: `<box-progress-bar label="Storage used" value="18"></box-progress-bar>` },
    { name: "Mid", html: `<box-progress-bar label="Storage used" value="64"></box-progress-bar>` },
    { name: "Complete", html: `<box-progress-bar label="Storage used" value="100"></box-progress-bar>` },
  ],
};

export default progressBar;
