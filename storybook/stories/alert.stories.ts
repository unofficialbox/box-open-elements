import type { StoryModule } from "../metadata.js";

const alert: StoryModule = {
  title: "Components/Feedback/Alert",
  meta: {
    id: "alert",
    tag: "box-alert",
    shortDescription: "An inline message banner.",
    docsDescription: "A titled banner conveying status with a tone, and an optional message body.",
    sourceSnippet: `<box-alert title="Upload complete" message="24 files were added." tone="success"></box-alert>`,
    referenceRows: [
      { kind: "attribute", name: "title", type: "string", description: "Banner heading." },
      { kind: "attribute", name: "message", type: "string", description: "Optional body text." },
      { kind: "attribute", name: "tone", type: '"info" | "success" | "warning" | "error"', description: "Status color." },
    ],
  },
  variants: [
    { name: "Info", html: `<box-alert title="Heads up" message="Shared links expire in 30 days." tone="info"></box-alert>` },
    { name: "Success", html: `<box-alert title="Upload complete" message="24 files were added to Marketing." tone="success"></box-alert>` },
    { name: "Warning", html: `<box-alert title="Storage almost full" message="You've used 92% of your quota." tone="warning"></box-alert>` },
    { name: "Error", html: `<box-alert title="Upload failed" message="3 files could not be added." tone="error"></box-alert>` },
  ],
};

export default alert;
