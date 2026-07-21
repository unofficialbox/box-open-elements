import type { StoryModule } from "../metadata.js";

const alert: StoryModule = {
  title: "Components/Feedback/Alert",
  meta: {
    id: "alert",
    tag: "box-alert",
    shortDescription: "An inline message banner.",
    docsDescription: "A titled banner conveying status with a tone, and an optional message body. For richer notices, slot markup (links, buttons) as the default children — they render below the message, and an alert with only rich children still shows.",
    sourceSnippet: `<box-alert heading="Upload complete" message="24 files were added." tone="success"></box-alert>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Banner heading." },
      { kind: "attribute", name: "message", type: "string", description: "Optional body text." },
      { kind: "attribute", name: "tone", type: '"info" | "success" | "warning" | "error"', description: "Status color." },
      { kind: "slot", name: "(default)", type: "slot", description: "Rich body content (links, buttons) rendered below the message." },
      { kind: "event", name: "dismiss", type: "CustomEvent", description: "Emitted when the alert is dismissed." },
    ],
  },
  variants: [
    { name: "Info", html: `<box-alert heading="Heads up" message="Shared links expire in 30 days." tone="info"></box-alert>` },
    { name: "Success", html: `<box-alert heading="Upload complete" message="24 files were added to Marketing." tone="success"></box-alert>` },
    { name: "Warning", html: `<box-alert heading="Storage almost full" message="You've used 92% of your quota." tone="warning"></box-alert>` },
    { name: "Error", html: `<box-alert heading="Upload failed" message="3 files could not be added." tone="error"></box-alert>` },
    { name: "Rich content", html: `<box-alert heading="New collaborators" tone="info">Morgan and 2 others were added. <a href="#">Review access</a></box-alert>` },
  ],
};

export default alert;
