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
      { kind: "attribute", name: "size", type: "string", description: "Indicator size: small, medium (default), or large." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-spinner label="Loading"></box-spinner>` },
    { name: "With context", html: `<box-spinner label="Syncing files"></box-spinner>` },
    { name: "Small", html: `<box-spinner label="Loading" size="small"></box-spinner>` },
    { name: "Large", html: `<box-spinner label="Loading" size="large"></box-spinner>` },
  ],
};

export default spinner;
