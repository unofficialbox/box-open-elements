import type { StoryModule } from "../metadata.js";

const metadataFilterBuilder: StoryModule = {
  title: "Patterns/Metadata/Metadata Filter Builder",
  meta: {
    id: "metadata-filter-builder",
    tag: "box-metadata-filter-builder",
    shortDescription: "A rule builder for metadata search filters.",
    docsDescription: "Pass available metadata fields as JSON `fields` and active filter rules as JSON `rules`.",
    sourceSnippet: `<box-metadata-filter-builder label="Metadata filters" fields='[{"id":"classification","label":"Classification"}]' rules='[{"field":"classification","operator":"is","value":"internal"}]'></box-metadata-filter-builder>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Builder label." },
      { kind: "attribute", name: "fields", type: "json", description: "Metadata field catalog." },
      { kind: "attribute", name: "rules", type: "json", description: "Current filter rules." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when rules change." },
      { kind: "event", name: "rule-added", type: "CustomEvent", description: "Emitted after adding a rule." },
      { kind: "event", name: "rule-removed", type: "CustomEvent", description: "Emitted after removing a rule." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-metadata-filter-builder label="Metadata filters" fields='[{"id":"classification","label":"Classification"},{"id":"department","label":"Department"}]' rules='[{"field":"classification","operator":"is","value":"internal"},{"field":"department","operator":"contains","value":"Marketing"}]'></box-metadata-filter-builder>`,
    },
  ],
};

export default metadataFilterBuilder;
