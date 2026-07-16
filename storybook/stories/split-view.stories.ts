import type { StoryModule } from "../metadata.js";

const splitView: StoryModule = {
  title: "Components/Layout/Split View",
  meta: {
    id: "split-view",
    tag: "box-split-view",
    shortDescription: "A two-pane layout with optional pointer resizing.",
    docsDescription: "Slot primary content into `primary`, place secondary content in the default slot, and use `ratio` plus `resizable` to control the split.",
    sourceSnippet: `<box-split-view label="Master detail" ratio="0.4" resizable></box-split-view>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible split view label." },
      { kind: "attribute", name: "ratio", type: "number", description: "Primary pane ratio from 0.2 to 0.8." },
      { kind: "attribute", name: "resizable", type: "boolean", description: "Shows a draggable separator." },
      { kind: "slot", name: "primary", description: "Primary pane content." },
      { kind: "slot", name: "default", description: "Secondary pane content." },
      { kind: "event", name: "ratio-changed", type: "CustomEvent", description: "Emitted when the separator changes the ratio." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-split-view label="Master detail" ratio="0.4" resizable>
  <box-grid-view slot="primary" label="Files" value="123" items='[{"value":"123","label":"Quarterly Plan.pdf","meta":"PDF · 2.1 MB","icon":"P"},{"value":"124","label":"Brand Guidelines.pdf","meta":"PDF · 5.4 MB","icon":"P"},{"value":"42","label":"Marketing","meta":"Folder · 18 items","icon":"M"}]'></box-grid-view>
  <box-item-details-panel heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner='{"name":"Morgan Lee","description":"Enterprise Admin"}' meta='[{"label":"Modified","value":"Jul 10, 2026"},{"label":"Status","value":"Shared"}]'></box-item-details-panel>
</box-split-view>`,
    },
  ],
};

export default splitView;
