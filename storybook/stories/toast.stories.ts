import type { StoryModule } from "../metadata.js";

const toast: StoryModule = {
  title: "Components/Feedback/Toast",
  meta: {
    id: "toast",
    tag: "box-toast",
    shortDescription: "A transient status message.",
    docsDescription:
      "Shows a short `message` with an optional tone. Toggle visibility with `open`.",
    sourceSnippet: `<box-toast open message="Upload complete" tone="success"></box-toast>`,
    referenceRows: [
      { kind: "attribute", name: "message", type: "string", description: "Toast body copy." },
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the toast is visible." },
      { kind: "attribute", name: "tone", type: "string", description: "Status emphasis (e.g. success, error)." },
    ],
  },
  variants: [
    { name: "Success", html: `<box-toast open message="Upload complete" tone="success"></box-toast>` },
    { name: "Error", html: `<box-toast open message="Upload failed" tone="error"></box-toast>` },
    { name: "Closed", html: `<box-toast message="Hidden until open" tone="success"></box-toast>` },
  ],
};

export default toast;
