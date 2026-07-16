import type { StoryModule } from "../metadata.js";

const searchResultsHeader: StoryModule = {
  title: "Patterns/Search/Search Results Header",
  meta: {
    id: "search-results-header",
    tag: "box-search-results-header",
    shortDescription: "A search summary header with filters and actions.",
    docsDescription: "Set query/count context as attributes and pass active filters plus header actions as JSON.",
    sourceSnippet: `<box-search-results-header label="Results" query="contract" result-count="128" scope="All files" filters='["Type: PDF"]'></box-search-results-header>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Header label." },
      { kind: "attribute", name: "query", type: "string", description: "Search query summary." },
      { kind: "attribute", name: "result-count", type: "number", description: "Number of matching results." },
      { kind: "attribute", name: "scope", type: "string", description: "Search scope label." },
      { kind: "attribute", name: "sort-label", type: "string", description: "Current sort label." },
      { kind: "attribute", name: "view-label", type: "string", description: "Current view label." },
      { kind: "attribute", name: "filters", type: "json", description: "Active filter chips." },
      { kind: "attribute", name: "actions", type: "json", description: "Header action buttons." },
      { kind: "event", name: "action", type: "CustomEvent", description: "Emitted when an action is selected." },
      { kind: "event", name: "filter-removed", type: "CustomEvent", description: "Emitted when an active filter chip is removed." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-search-results-header label="Results" query="contract" result-count="128" scope="All files" sort-label="Updated" view-label="Grid" filters='["Type: PDF","Owner: Morgan Lee"]' actions='[{"id":"save-view","label":"Save view"}]'></box-search-results-header>`,
    },
  ],
};

export default searchResultsHeader;
