import type { StoryModule } from "../metadata.js";

const errorMask: StoryModule = {
  title: "Components/Feedback/Error Mask",
  meta: {
    id: "error-mask",
    tag: "box-error-mask",
    shortDescription: "A full-section error recovery surface.",
    docsDescription: "Use when a region failed to load. Provide `heading`, `message`, and optional `action-label`. Slot additional markup (diagnostic details, a support link) as the default children — it renders below the message.",
    sourceSnippet: `<box-error-mask heading="Couldn't load files" message="Something went wrong." action-label="Retry"></box-error-mask>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Error title." },
      { kind: "attribute", name: "message", type: "string", description: "Recovery guidance." },
      { kind: "attribute", name: "action-label", type: "string", description: "Optional retry/action label." },
      { kind: "slot", name: "(default)", type: "slot", description: "Rich body content below the message." },
      { kind: "event", name: "retry", type: "CustomEvent", description: "Emitted when the action button is activated." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-error-mask heading="Couldn't load files" message="Something went wrong while loading this folder." action-label="Retry"></box-error-mask>`,
    },
  ],
};

export default errorMask;
