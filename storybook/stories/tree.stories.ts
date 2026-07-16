import type { StoryModule } from "../metadata.js";

const tree: StoryModule = {
  title: "Components/Collections/Tree",
  meta: {
    id: "tree",
    tag: "box-tree",
    shortDescription: "A hierarchical folder/tree navigator.",
    docsDescription: "Provide nested nodes as JSON `items` and the selected `value`.",
    sourceSnippet: `<box-tree label="Folders" items='[{"label":"Marketing","value":"marketing"}]' value="marketing"></box-tree>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible tree label." },
      { kind: "attribute", name: "items", type: "json", description: "Nested { label, value, children? } nodes." },
      { kind: "attribute", name: "value", type: "string", description: "Selected node value." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-tree label="Folders" items='[{"label":"Marketing","value":"marketing","children":[{"label":"Brand","value":"brand"},{"label":"Events","value":"events"}]},{"label":"Finance","value":"finance"}]' value="marketing"></box-tree>`,
    },
  ],
};

export default tree;
