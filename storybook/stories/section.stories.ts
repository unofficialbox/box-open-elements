import type { StoryModule } from "../metadata.js";

const section: StoryModule = {
  title: "Components/Layout/Section",
  meta: {
    id: "section",
    tag: "box-section",
    shortDescription: "A titled content section with optional actions.",
    docsDescription: "Use eyebrow/heading/description attributes and slots for actions and body content.",
    sourceSnippet: `<box-section eyebrow="Workspace" heading="Members" description="People with access to this workspace."><box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona></box-section>`,
    referenceRows: [
      { kind: "attribute", name: "eyebrow", type: "string", description: "Small label above the heading." },
      { kind: "attribute", name: "heading", type: "string", description: "Section title." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting copy." },
      { kind: "slot", name: "actions", description: "Header actions." },
      { kind: "slot", name: "default", description: "Section body." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-section eyebrow="Workspace" heading="Members" description="People with access to this workspace.">
  <box-button slot="actions" label="Invite" tone="primary"></box-button>
  <box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona>
</box-section>`,
    },
  ],
};

export default section;
