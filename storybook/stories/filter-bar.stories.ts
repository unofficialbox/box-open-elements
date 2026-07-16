import type { StoryModule } from "../metadata.js";

const filterBar: StoryModule = {
  title: "Patterns/Search/Filter Bar",
  meta: {
    id: "filter-bar",
    tag: "box-filter-bar",
    shortDescription: "A search filter surface with query, sort, view, and facet chips.",
    docsDescription: "Use JSON option attributes for filters, sort choices, and view choices; selected filters serialize as JSON `filters`.",
    sourceSnippet: `<box-filter-bar label="Filters" query="contract" filter-options='[{"label":"Type","value":"type"}]' filters='["type"]'></box-filter-bar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Filter bar label." },
      { kind: "attribute", name: "query", type: "string", description: "Current search query." },
      { kind: "attribute", name: "filter-options", type: "json", description: "Facet chip options." },
      { kind: "attribute", name: "filters", type: "json", description: "Selected filter values." },
      { kind: "attribute", name: "sort-options", type: "json", description: "Sort select options." },
      { kind: "attribute", name: "sort-value", type: "string", description: "Selected sort value." },
      { kind: "attribute", name: "view-options", type: "json", description: "View select options." },
      { kind: "attribute", name: "view-value", type: "string", description: "Selected view value." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when query, sort, view, or filters change." },
      { kind: "event", name: "search", type: "CustomEvent", description: "Emitted when the query is committed." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-filter-bar label="Filters" query="contract" filter-options='[{"label":"Modified","value":"modified"},{"label":"Owner","value":"owner"},{"label":"Type","value":"type"}]' filters='["type"]' sort-options='[{"label":"Updated","value":"updated"},{"label":"Name","value":"name"}]' sort-value="updated" view-options='[{"label":"List","value":"list"},{"label":"Grid","value":"grid"}]' view-value="grid"></box-filter-bar>`,
    },
  ],
};

export default filterBar;
