import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerTable: StoryModule = {
  title: "Patterns/Content Explorer/Explorer Table",
  meta: {
    id: "explorer-table",
    tag: "box-explorer-table",
    shortDescription: "Table presentation with enriched summary columns.",
    docsDescription: "Assign `controller`; columns show Name, Type, Modified, Size, Owner, Shared, Actions.",
    sourceSnippet: `<box-explorer-table item-gesture="split"></box-explorer-table>`,
    referenceRows: [
      { kind: "attribute", name: "item-gesture", type: "string", description: "split | legacy." },
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
    ],
  },
  variants: [
    {
      name: "Connected",
      html: `<box-explorer-table item-gesture="split"></box-explorer-table>`,
      note: "Enriched columns from the mock transport.",
      setup: root => setupExplorerAdapter(root, "box-explorer-table", { selectItemId: "123" }),
    },
  ],
};

export default explorerTable;
