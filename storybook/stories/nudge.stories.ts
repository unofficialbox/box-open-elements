import type { StoryModule } from "../metadata.js";

const nudge: StoryModule = {
  title: "Components/Feedback/Nudge",
  meta: {
    id: "nudge",
    tag: "box-nudge",
    shortDescription: "A dismissible tip with an optional action.",
    docsDescription: "Inline coaching surface with `heading`, `message`, optional `action-label`, and `open`.",
    sourceSnippet: `<box-nudge heading="Try grid view" message="Preview files as thumbnails." action-label="Show me"></box-nudge>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Nudge title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting tip copy." },
      { kind: "attribute", name: "action-label", type: "string", description: "Optional CTA label." },
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the nudge is visible." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-nudge open heading="Try grid view" message="Preview files as thumbnails from the view switcher." action-label="Show me"></box-nudge>`,
    },
    {
      name: "No action",
      html: `<box-nudge open heading="Tip" message="Use filters to narrow results."></box-nudge>`,
    },
  ],
};

export default nudge;
