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
    { name: "Labelled", html: `<box-divider label="Shared with your team"></box-divider>` },
    { name: "Plain", html: `<box-divider></box-divider>` },
  ],
};

export default divider;
