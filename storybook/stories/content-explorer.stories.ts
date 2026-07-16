import type { StoryModule } from "../metadata.js";

const contentExplorer: StoryModule = {
  title: "Patterns/Content Explorer/Content Explorer",
  meta: {
    id: "content-explorer",
    tag: "box-content-explorer",
    shortDescription: "Folder browsing with host chrome; metadata query is a separate host composition.",
    docsDescription:
      "The composed shell owns its list. Host apps that need list/table presentation swap use explorer adapters + ContentExplorerController (see docs-site Folder host chrome). Metadata-query browsing is also host-owned — not a controller view mode.",
    sourceSnippet: `<box-content-explorer root-folder-id="0" token="…" page-size="25"></box-content-explorer>`,
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
      name: "Composed shell",
      html: `<box-content-explorer root-folder-id="0" token="…" page-size="25"></box-content-explorer>`,
      note: "Shell list is fixed. For list/table swap, compose breadcrumbs + list/table adapters with a shared controller (docs-site Folder host chrome).",
    },
  ],
};

export default contentExplorer;
