import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerList: StoryModule = {
  title: "Patterns/Content Explorer/Explorer List",
  meta: {
    id: "explorer-list",
    tag: "box-explorer-list",
    shortDescription: "Listbox presentation adapter for explorer items.",
    docsDescription: "Assign `controller`; optional `item-gesture` controls select vs activate.",
    sourceSnippet: `<box-explorer-list item-gesture="split"></box-explorer-list>`,
    referenceRows: [
      { kind: "attribute", name: "item-gesture", type: "string", description: "split | legacy." },
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
    ],
  },
  variants: [
    {
      name: "Connected",
      html: `<box-explorer-list item-gesture="split"></box-explorer-list>`,
      note: "Enriched item meta from the mock transport.",
      setup: root => setupExplorerAdapter(root, "box-explorer-list", { selectItemId: "123" }),
    },
  ],
};

export default explorerList;
