import type { StoryModule } from "../metadata.js";

const unifiedShareModal: StoryModule = {
  title: "Patterns/Share/Unified Share Modal",
  meta: {
    id: "unified-share-modal",
    tag: "box-unified-share-modal",
    shortDescription: "A modal for shared-link and collaborator settings.",
    docsDescription: "Open the modal with `open`; connect a `dataSource` property in app code to load link and collaborator state.",
    sourceSnippet: `<box-unified-share-modal item-id="42" item-type="file" heading="Share Quarterly Plan.pdf" open></box-unified-share-modal>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Shows the modal dialog." },
      { kind: "attribute", name: "item-id", type: "string", description: "Item being shared." },
      { kind: "attribute", name: "item-type", type: "file | folder", description: "Shared item type." },
      { kind: "attribute", name: "heading", type: "string", description: "Dialog heading." },
      { kind: "property", name: "dataSource", type: "ShareDataSource", description: "Loads and updates shared-link/collaborator state." },
      { kind: "event", name: "invite", description: "Emitted when the invite affordance is used." },
      { kind: "event", name: "linkcopied", description: "Emitted after a successful link copy." },
      { kind: "event", name: "close", description: "Emitted when the modal is dismissed." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-unified-share-modal item-id="42" item-type="file" heading="Share Quarterly Plan.pdf" open></box-unified-share-modal>`,
      note: "A dataSource property is required for loaded share settings; serialized HTML shows the open modal shell.",
    },
  ],
};

export default unifiedShareModal;
