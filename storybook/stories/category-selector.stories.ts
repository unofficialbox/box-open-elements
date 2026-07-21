import type { StoryModule } from "../metadata.js";

const categorySelector: StoryModule = {
  title: "Components/Forms/Category Selector",
  meta: {
    id: "category-selector",
    tag: "box-category-selector",
    shortDescription: "A compact category filter control.",
    docsDescription: "Provide categories as JSON `options` and the selected `value`.",
    sourceSnippet: "<box-category-selector label=\"Filter by type\" options='[{\"value\":\"all\",\"label\":\"All\"}]' value=\"all\"></box-category-selector>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected category value." },
      { kind: "attribute", name: "max-links", type: "number", description: "Max inline categories before the rest collapse into a More menu." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-category-selector label=\"Filter by type\" options='[{\"value\":\"all\",\"label\":\"All\"},{\"value\":\"docs\",\"label\":\"Documents\"},{\"value\":\"media\",\"label\":\"Media\"},{\"value\":\"links\",\"label\":\"Links\"}]' value=\"all\"></box-category-selector>" },
    { name: "With overflow menu", html: "<box-category-selector label=\"Filter by type\" max-links=\"3\" options='[{\"value\":\"all\",\"label\":\"All\"},{\"value\":\"docs\",\"label\":\"Documents\"},{\"value\":\"media\",\"label\":\"Media\"},{\"value\":\"links\",\"label\":\"Links\"},{\"value\":\"notes\",\"label\":\"Notes\"},{\"value\":\"archived\",\"label\":\"Archived\"}]' value=\"all\"></box-category-selector>" },
  ],
};

export default categorySelector;
