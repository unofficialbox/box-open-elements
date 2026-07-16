import type { StoryModule } from "../metadata.js";

const bulkActionBar: StoryModule = {
  title: "Patterns/Item/Bulk Action Bar",
  meta: {
    id: "bulk-action-bar",
    tag: "box-bulk-action-bar",
    shortDescription: "A toolbar for acting on a selected item set.",
    docsDescription: "Use count/message attributes with JSON `items` and `actions`; action and clear events include the selected items.",
    sourceSnippet: `<box-bulk-action-bar label="Selection" count="3" actions='[{"id":"share","label":"Share"}]'></box-bulk-action-bar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Toolbar label." },
      { kind: "attribute", name: "count", type: "number", description: "Selected item count." },
      { kind: "attribute", name: "message", type: "string", description: "Selection summary copy." },
      { kind: "attribute", name: "clear-label", type: "string", description: "Clear button label." },
      { kind: "attribute", name: "items", type: "json", description: "Selected item chips." },
      { kind: "attribute", name: "actions", type: "json", description: "Bulk action buttons." },
      { kind: "event", name: "action", type: "CustomEvent", description: "Emitted when an action is selected." },
      { kind: "event", name: "clear", type: "CustomEvent", description: "Emitted when clear selection is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-bulk-action-bar label="Selection" count="3" message="3 items selected" items='[{"id":"123","label":"Quarterly Plan.pdf","description":"PDF · 2.1 MB"},{"id":"124","label":"Brand Guidelines.pdf","description":"PDF · 5.4 MB"},{"id":"42","label":"Marketing","description":"Folder · 18 items"}]' actions='[{"id":"move","label":"Move"},{"id":"share","label":"Share"},{"id":"delete","label":"Delete"}]'></box-bulk-action-bar>`,
    },
  ],
};

export default bulkActionBar;
