import type { StoryModule } from "../metadata.js";

const savedViewPicker: StoryModule = {
  title: "Patterns/Search/Saved View Picker",
  meta: {
    id: "saved-view-picker",
    tag: "box-saved-view-picker",
    shortDescription: "A radiogroup-style picker for saved search views.",
    docsDescription: "Pass saved views as JSON `views`; `value` selects the active saved view and updates via `value-changed`.",
    sourceSnippet: `<box-saved-view-picker label="Saved views" views='[{"id":"recent-contracts","label":"Recent contracts"}]' value="recent-contracts"></box-saved-view-picker>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Picker label." },
      { kind: "attribute", name: "views", type: "json", description: "Array of saved view definitions." },
      { kind: "attribute", name: "value", type: "string", description: "Selected saved view id." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when a saved view is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-saved-view-picker label="Saved views" views='[{"id":"recent-contracts","label":"Recent contracts"},{"id":"my-uploads","label":"My uploads"}]' value="recent-contracts"></box-saved-view-picker>`,
    },
  ],
};

export default savedViewPicker;
