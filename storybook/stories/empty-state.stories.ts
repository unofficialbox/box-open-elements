import type { StoryModule } from "../metadata.js";

const emptyState: StoryModule = {
  title: "Components/Feedback/Empty State",
  meta: {
    id: "empty-state",
    tag: "box-empty-state",
    shortDescription: "A heading + message for empty result surfaces.",
    docsDescription:
      "Use when a list or panel has nothing to show. Prefer `heading` + `message`; optional `action-label` for a recovery CTA.",
    sourceSnippet: `<box-empty-state heading="No results" message="Try a different search."></box-empty-state>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Primary empty-state title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting guidance." },
      { kind: "attribute", name: "action-label", type: "string", description: "Optional recovery action label." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-empty-state heading="No results" message="Try a different search or clear the filters."></box-empty-state>` },
    {
      name: "With action",
      html: `<box-empty-state heading="Folder empty" message="Upload a file to get started." action-label="Upload"></box-empty-state>`,
    },
  ],
};

export default emptyState;
