import type { StoryModule } from "../metadata.js";

const treeGrid: StoryModule = {
  title: "Components/Collections/Tree Grid",
  meta: {
    id: "tree-grid",
    tag: "box-tree-grid",
    shortDescription: "A hierarchical grid with expandable rows and selectable items.",
    docsDescription: "Pass JSON `columns` and nested `items`; branches start expanded and expose selection plus expand events.",
    sourceSnippet: `<box-tree-grid label="Folders" columns='[{"key":"name","label":"Name"},{"key":"owner","label":"Owner"}]' items='[{"value":"marketing","label":"Marketing","cells":["Morgan Lee"]}]'></box-tree-grid>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible tree grid label." },
      { kind: "attribute", name: "columns", type: "json", description: "Array of column definitions." },
      { kind: "attribute", name: "items", type: "json", description: "Nested rows with value, label, cells, and children." },
      { kind: "attribute", name: "value", type: "string", description: "Selected row value." },
      { kind: "event", name: "expand-changed", type: "CustomEvent", description: "Emitted when a branch expands or collapses." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when row selection changes." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-tree-grid label="Folders" value="marketing" columns='[{"key":"name","label":"Name"},{"key":"owner","label":"Owner"}]' items='[{"value":"marketing","label":"Marketing","cells":["Morgan Lee"],"children":[{"value":"brand","label":"Brand","cells":["Alex Kim"]}]},{"value":"finance","label":"Finance","cells":["Sam Rivera"]}]'></box-tree-grid>`,
      note: "Column/item shapes follow the component's `columns` and `items` attributes.",
    },
  ],
};

export default treeGrid;
