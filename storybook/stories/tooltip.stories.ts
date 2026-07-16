import type { StoryModule } from "../metadata.js";

const tooltip: StoryModule = {
  title: "Components/Overlays/Tooltip",
  meta: {
    id: "tooltip",
    tag: "box-tooltip",
    shortDescription: "A short hover/focus hint for a control.",
    docsDescription:
      "Associates a concise `label` tip with a trigger. Use `open` to force visibility in demos.",
    sourceSnippet: `<box-tooltip label="Rename" open trigger-label="More"></box-tooltip>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Tooltip text." },
      { kind: "attribute", name: "trigger-label", type: "string", description: "Accessible name for the demo trigger." },
      { kind: "attribute", name: "open", type: "boolean", description: "Forces the tooltip open." },
    ],
  },
  variants: [
    { name: "Open", html: `<box-tooltip label="Rename this item" open trigger-label="More actions"></box-tooltip>` },
    { name: "Closed", html: `<box-tooltip label="Rename this item" trigger-label="More actions"></box-tooltip>` },
  ],
};

export default tooltip;
