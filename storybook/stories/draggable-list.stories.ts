import type { StoryModule } from "../metadata.js";

const draggableList: StoryModule = {
  title: "Components/Collections/Draggable List",
  meta: {
    id: "draggable-list",
    tag: "box-draggable-list",
    shortDescription: "A reorderable list with pointer and keyboard drag controls.",
    docsDescription: "Pass saved view rows as JSON `items`; reordering emits `reorder` with the new item order.",
    sourceSnippet: `<box-draggable-list label="Saved views" items='[{"value":"recents","label":"Recents"},{"value":"shared","label":"Shared with me"}]'></box-draggable-list>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible list label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { value, label } rows." },
      { kind: "event", name: "reorder", type: "CustomEvent", description: "Emitted with moved value, indexes, and reordered items." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-draggable-list label="Saved views" items='[{"value":"recents","label":"Recents"},{"value":"shared","label":"Shared with me"},{"value":"starred","label":"Starred"},{"value":"trash","label":"Trash"}]'></box-draggable-list>`,
      note: "Focus a handle, then ArrowUp/ArrowDown (or drag) to reorder.",
    },
  ],
};

export default draggableList;
