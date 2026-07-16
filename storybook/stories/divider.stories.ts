import type { StoryModule } from "../metadata.js";

const divider: StoryModule = {
  title: "Components/Layout/Divider",
  meta: {
    id: "divider",
    tag: "box-divider",
    shortDescription: "A horizontal or vertical rule, optionally labelled.",
    docsDescription: "Separates sections. Optional `label` annotates the rule; `orientation` switches axis.",
    sourceSnippet: `<box-divider label="Shared with your team"></box-divider>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Optional text on the divider." },
      { kind: "attribute", name: "orientation", type: '"horizontal" | "vertical"', description: "Axis of the rule." },
    ],
  },
  variants: [
    {
      name: "In context",
      html: `<div style="display:grid;gap:0.75rem;width:min(100%,22rem)">
  <div>
    <strong>Metadata</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Owner, shared status, and last activity.</p>
  </div>
  <box-divider label="Activity"></box-divider>
  <div>
    <strong>Recent comments</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Version history and discussion sit below the rule.</p>
  </div>
</div>`,
    },
    {
      name: "Labelled",
      html: `<box-divider label="Shared with your team"></box-divider>`,
    },
    {
      name: "Plain",
      html: `<div style="width:min(100%,22rem)"><box-divider></box-divider></div>`,
    },
  ],
};

export default divider;
