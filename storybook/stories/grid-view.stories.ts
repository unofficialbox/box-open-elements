import type { StoryModule } from "../metadata.js";

const gridView: StoryModule = {
  title: "Components/Collections/Grid View",
  meta: {
    id: "grid-view",
    tag: "box-grid-view",
    shortDescription: "A selectable gallery view for files, folders, and links.",
    docsDescription: "Pass tile data as JSON `items`; `value` marks the selected tile and updates via `value-changed`.",
    sourceSnippet: `<box-grid-view label="Files" value="123" items='[{"value":"123","label":"Quarterly Plan.pdf","meta":"PDF · 2.1 MB","icon":"P"}]'></box-grid-view>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible grid label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { value, label, meta, icon } tiles." },
      { kind: "attribute", name: "value", type: "string", description: "Selected item value." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when selection changes." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-grid-view label="Files" value="123" items='[{"value":"123","label":"Quarterly Plan.pdf","meta":"PDF · 2.1 MB","icon":"P"},{"value":"124","label":"Brand Guidelines.pdf","meta":"PDF · 5.4 MB","icon":"P"},{"value":"42","label":"Marketing","meta":"Folder · 18 items","icon":"M"},{"value":"125","label":"box.com/launch","meta":"Web link","icon":"L"}]'></box-grid-view>`,
    },
  ],
};

export default gridView;
