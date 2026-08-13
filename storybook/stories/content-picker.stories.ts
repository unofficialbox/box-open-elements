import type { StoryModule } from "../metadata.js";

const contentPicker: StoryModule = {
  title: "Patterns/Content Picker/Content Picker",
  meta: {
    id: "content-picker",
    tag: "box-content-picker",
    shortDescription: "Constrained browse-and-choose surface composed from the explorer headless blocks.",
    docsDescription:
      "The picker is a worked example of pattern composition: ContentPickerController wraps the same ContentExplorerController (navigation, collection, search, transport contract) the explorer uses, and adds only what choosing needs — a cross-folder pick roster, type/extension/max constraints, and a choose/cancel contract. Nothing is reimplemented; a host that outgrows the shell can compose the same blocks with its own chrome.",
    sourceSnippet: `<box-content-picker root-folder-id="0" token="…" max-selectable="2" extensions="pdf" choose-label="Attach"></box-content-picker>`,
    referenceRows: [
      { kind: "attribute", name: "root-folder-id", type: "string", description: "Folder session root." },
      { kind: "attribute", name: "token", type: "string", description: "Session token for the transport." },
      { kind: "attribute", name: "max-selectable", type: "number", description: "Roster limit; 1 switches to single-select replacement." },
      { kind: "attribute", name: "extensions", type: "string", description: "Comma-separated file-extension allowlist." },
      { kind: "attribute", name: "selectable-types", type: "string", description: "Pickable item types (default: file). Folders always navigate." },
      { kind: "attribute", name: "choose-label", type: "string", description: "Footer confirm-button label." },
      { kind: "property", name: "transport", type: "ExplorerTransport", description: "The same data-source contract the explorer uses." },
      { kind: "event", name: "chosen", description: "Choose confirmed — detail carries the picked items in pick order." },
      { kind: "event", name: "cancelled", description: "Session abandoned; the roster is cleared." },
      { kind: "event", name: "selection-rejected", description: "A pick was refused: not-selectable or limit-reached." },
    ],
  },
  variants: [
    {
      name: "Attach flow",
      html: `<box-content-picker root-folder-id="0" token="…" max-selectable="2" extensions="pdf" choose-label="Attach"></box-content-picker>`,
      note: "Only PDFs are pickable; folders stay navigable. The roster survives navigating between folders.",
    },
  ],
};

export default contentPicker;
