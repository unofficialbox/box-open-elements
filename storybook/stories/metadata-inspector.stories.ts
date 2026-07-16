import type { StoryModule } from "../metadata.js";

const metadataInspector: StoryModule = {
  title: "Patterns/Metadata/Metadata Inspector",
  meta: {
    id: "metadata-inspector",
    tag: "box-metadata-inspector",
    shortDescription: "A sectioned inspector for item metadata fields.",
    docsDescription: "Set heading context and pass metadata sections as JSON `sections`; field selections emit `field-selected`.",
    sourceSnippet: `<box-metadata-inspector heading="Metadata" sections='[{"title":"Classification","fields":[{"label":"Confidentiality","value":"Internal"}]}]'></box-metadata-inspector>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Inspector heading." },
      { kind: "attribute", name: "eyebrow", type: "string", description: "Optional context label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting inspector copy." },
      { kind: "attribute", name: "sections", type: "json", description: "Sectioned metadata fields." },
      { kind: "event", name: "field-selected", type: "CustomEvent", description: "Emitted when a metadata field row is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-metadata-inspector heading="Metadata" eyebrow="Quarterly Plan.pdf" message="Review classification and retention metadata before sharing." sections='[{"title":"Classification","fields":[{"label":"Confidentiality","value":"Internal"},{"label":"Department","value":"Marketing"}]},{"title":"Retention","fields":[{"label":"Policy","value":"FY26 Launch","description":"7-year retention schedule"}]}]'></box-metadata-inspector>`,
    },
  ],
};

export default metadataInspector;
