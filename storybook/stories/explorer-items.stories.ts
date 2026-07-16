import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerItems: StoryModule = {
  title: "Patterns/Content Explorer/Explorer Items",
  meta: {
    id: "explorer-items",
    tag: "box-explorer-items",
    shortDescription: "List adapter alias used by composed explorer shells.",
    docsDescription: "Same contract as box-explorer-list; assign `controller`.",
    sourceSnippet: `<box-explorer-items></box-explorer-items>`,
    referenceRows: [
      { kind: "attribute", name: "item-gesture", type: "string", description: "split | legacy." },
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
    ],
  },
  variants: [
    {
      name: "Connected",
      html: `<box-explorer-items item-gesture="split"></box-explorer-items>`,
      setup: root => setupExplorerAdapter(root, "box-explorer-items", { selectItemId: "123" }),
    },
  ],
};

export default explorerItems;
