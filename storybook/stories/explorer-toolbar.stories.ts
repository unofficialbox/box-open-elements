import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerToolbar: StoryModule = {
  title: "Patterns/Content Explorer/Explorer Toolbar",
  meta: {
    id: "explorer-toolbar",
    tag: "box-explorer-toolbar",
    shortDescription: "Search field, status, and selection actions for an explorer session.",
    docsDescription: "Assign `controller`; embeds box-search-field and wires search/clear/refresh.",
    sourceSnippet: `<box-explorer-toolbar></box-explorer-toolbar>`,
    referenceRows: [
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
    ],
  },
  variants: [
    {
      name: "Connected",
      html: `<box-explorer-toolbar></box-explorer-toolbar>`,
      note: "Live controller with mock transport and a selected file.",
      setup: root => setupExplorerAdapter(root, "box-explorer-toolbar", { selectItemId: "123" }),
    },
  ],
};

export default explorerToolbar;
