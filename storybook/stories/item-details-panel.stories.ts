import type { StoryModule } from "../metadata.js";

const itemDetailsPanel: StoryModule = {
  title: "Patterns/Item/Item Details Panel",
  meta: {
    id: "item-details-panel",
    tag: "box-item-details-panel",
    shortDescription: "A metadata and action panel for a selected item.",
    docsDescription: "Combine item summary attributes with JSON `owner`, `meta`, and `actions` for a complete details panel.",
    sourceSnippet: `<box-item-details-panel heading="Quarterly Plan.pdf" owner='{"name":"Morgan Lee"}' meta='[{"label":"Modified","value":"Jul 10, 2026"}]'></box-item-details-panel>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Item title." },
      { kind: "attribute", name: "eyebrow", type: "string", description: "Small item type/size label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting item summary." },
      { kind: "attribute", name: "status", type: "string", description: "Status chip label." },
      { kind: "attribute", name: "owner", type: "json", description: "Owner summary object." },
      { kind: "attribute", name: "meta", type: "json", description: "Array of metadata rows." },
      { kind: "attribute", name: "actions", type: "json", description: "Action buttons." },
      { kind: "event", name: "action", type: "CustomEvent", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-item-details-panel heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" status="Shared" message="Latest board-ready plan with updated forecasts." owner='{"name":"Morgan Lee","description":"Enterprise Admin","status":"Owner"}' meta='[{"label":"Owner","value":"Morgan Lee"},{"label":"Modified","value":"Jul 10, 2026"}]' actions='[{"id":"share","label":"Share"},{"id":"download","label":"Download"}]'></box-item-details-panel>`,
    },
  ],
};

export default itemDetailsPanel;
