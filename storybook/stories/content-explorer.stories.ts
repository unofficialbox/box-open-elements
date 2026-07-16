import type { StoryModule } from "../metadata.js";
import {
  contentExplorerChromeHtml,
  setupContentExplorerChrome,
} from "../../docs-site/explorer-chrome-demo.js";
import { createExplorerDemoTransport } from "../../docs-site/explorer-adapter-demo.js";

const contentExplorer: StoryModule = {
  title: "Patterns/Content Explorer/Content Explorer",
  meta: {
    id: "content-explorer",
    tag: "box-content-explorer",
    shortDescription: "Folder browsing with host chrome; metadata query is a separate host composition.",
    docsDescription:
      "Folder mode uses transport + host filter-bar / saved-view bindings. Metadata-query browsing is a host composition (docs-site Metadata query chrome variant) using metadata-filter-builder + explorer adapters + metadata-inspector — not a controller view mode.",
    sourceSnippet: contentExplorerChromeHtml,
    referenceRows: [
      { kind: "attribute", name: "root-folder-id", type: "string", description: "Folder session root." },
      { kind: "attribute", name: "token", type: "string", description: "Session token for the transport." },
      { kind: "attribute", name: "page-size", type: "number", description: "Page size for folder loads." },
      { kind: "attribute", name: "selection-mode", type: "string", description: "single | multiple." },
      { kind: "attribute", name: "search-query", type: "string", description: "Reflective search query." },
      { kind: "property", name: "transport", type: "ExplorerTransport", description: "Data source for folder/search." },
      { kind: "event", name: "selection-changed", description: "Selection set changed." },
      { kind: "event", name: "search-succeeded", description: "Search mode loaded results." },
    ],
  },
  variants: [
    {
      name: "Folder host chrome",
      html: contentExplorerChromeHtml,
      note: "saved-view-picker + filter-bar bound to explorer search. See docs-site for Metadata query chrome.",
      setup: root => setupContentExplorerChrome(root, createExplorerDemoTransport()),
    },
  ],
};

export default contentExplorer;
