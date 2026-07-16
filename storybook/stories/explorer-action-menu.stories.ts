import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerActionMenu: StoryModule = {
  title: "Patterns/Content Explorer/Explorer Action Menu",
  meta: {
    id: "explorer-action-menu",
    tag: "box-explorer-action-menu",
    shortDescription: "Per-item action menu bound to a controller + itemId.",
    docsDescription: "Requires `controller` and `itemId`; actions come from the controller's itemActions config.",
    sourceSnippet: `<box-explorer-action-menu></box-explorer-action-menu>`,
    referenceRows: [
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
      { kind: "property", name: "itemId", type: "string", description: "Item whose actions to show." },
    ],
  },
  variants: [
    {
      name: "Connected item",
      html: `<box-explorer-action-menu></box-explorer-action-menu>`,
      note: "itemId=123 (Quarterly Plan.pdf) with Share / Download actions.",
      setup: root =>
        setupExplorerAdapter(root, "box-explorer-action-menu", { itemId: "123", selectItemId: "123" }),
    },
  ],
};

export default explorerActionMenu;
