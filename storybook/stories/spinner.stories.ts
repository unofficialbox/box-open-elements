import type { StoryModule } from "../metadata.js";

const spinner: StoryModule = {
  title: "Components/Feedback/Spinner",
  meta: {
    id: "spinner",
    tag: "box-spinner",
    shortDescription: "An indeterminate loading indicator.",
    docsDescription: "A looping indicator for indeterminate waits. The `label` names it for assistive technology.",
    sourceSnippet: `<box-spinner label="Loading"></box-spinner>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible loading label." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-spinner label="Loading"></box-spinner>` },
    { name: "With context", html: `<box-spinner label="Syncing files"></box-spinner>` },
  ],
};

export default spinner;
