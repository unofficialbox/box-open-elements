import type { StoryModule } from "../metadata.js";

const pillSelectorDropdown: StoryModule = {
  title: "Components/Forms/Pill Selector Dropdown",
  meta: {
    id: "pill-selector-dropdown",
    tag: "box-pill-selector-dropdown",
    shortDescription: "A multi-select pill field with an add menu.",
    docsDescription: "Pass people/options as JSON `options`; selected pills are represented by JSON array `value`.",
    sourceSnippet: `<box-pill-selector-dropdown label="Collaborators" placeholder="Add person" options='[{"value":"morgan","label":"Morgan Lee"}]' value='["morgan"]'></box-pill-selector-dropdown>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Trigger text after the plus sign." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { value, label } options." },
      { kind: "attribute", name: "value", type: "json", description: "Selected values as a string array." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when selected values change." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-pill-selector-dropdown label="Collaborators" placeholder="Add person" options='[{"value":"morgan","label":"Morgan Lee"},{"value":"alex","label":"Alex Kim"},{"value":"sam","label":"Sam Patel"},{"value":"jordan","label":"Jordan Rivera"}]' value='["morgan"]'></box-pill-selector-dropdown>`,
    },
  ],
};

export default pillSelectorDropdown;
