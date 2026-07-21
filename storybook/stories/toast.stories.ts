import type { StoryModule } from "../metadata.js";

const toast: StoryModule = {
  title: "Components/Feedback/Toast",
  meta: {
    id: "toast",
    tag: "box-toast",
    shortDescription: "A transient status message.",
    docsDescription:
      "Shows a short `message` with an optional tone. Toggle visibility with `open`, or call `show(message, { duration, tone })`. A declarative `duration` (ms) auto-dismisses the toast; slot an `action` (e.g. an Undo button/link) before the dismiss control. Long unbroken tokens wrap instead of overflowing.",
    sourceSnippet: `<box-toast open message="Upload complete" tone="success"></box-toast>`,
    referenceRows: [
      { kind: "attribute", name: "message", type: "string", description: "Toast body copy." },
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the toast is visible." },
      { kind: "attribute", name: "tone", type: "string", description: "Status emphasis (e.g. success, error)." },
      { kind: "attribute", name: "duration", type: "number", description: "Auto-dismiss delay in ms for the declarative open path (0 = sticky)." },
      { kind: "slot", name: "action", type: "slot", description: "Action affordance (e.g. Undo) before the dismiss button." },
      { kind: "event", name: "dismiss", type: "CustomEvent", description: "Emitted when the toast is dismissed." },
    ],
  },
  variants: [
    { name: "Success", html: `<box-toast open message="Upload complete" tone="success"></box-toast>` },
    { name: "Error", html: `<box-toast open message="Upload failed" tone="error"></box-toast>` },
    { name: "With action", html: `<box-toast open message="File deleted" tone="info"><button slot="action" type="button">Undo</button></box-toast>` },
    { name: "Closed", html: `<box-toast message="Hidden until open" tone="success"></box-toast>` },
  ],
};

export default toast;
