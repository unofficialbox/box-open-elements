import type { StoryModule } from "../metadata.js";
import { setupExplorerAdapter } from "../../docs-site/explorer-adapter-demo.js";

const explorerBreadcrumbs: StoryModule = {
  title: "Patterns/Content Explorer/Explorer Breadcrumbs",
  meta: {
    id: "explorer-breadcrumbs",
    tag: "box-explorer-breadcrumbs",
    shortDescription: "Breadcrumb trail driven by a ContentExplorerController.",
    docsDescription: "Assign `controller` and connect; crumbs call `navigateTo` on the controller.",
    sourceSnippet: `<box-explorer-breadcrumbs></box-explorer-breadcrumbs>`,
    referenceRows: [
      { kind: "property", name: "controller", type: "ContentExplorerController", description: "Bound explorer controller." },
    ],
  },
  variants: [
    {
      name: "Connected",
      html: `<box-explorer-breadcrumbs></box-explorer-breadcrumbs>`,
      note: "Live controller with mock transport.",
      setup: root => setupExplorerAdapter(root, "box-explorer-breadcrumbs", { selectItemId: "123" }),
    },
  ],
};

export default explorerBreadcrumbs;
