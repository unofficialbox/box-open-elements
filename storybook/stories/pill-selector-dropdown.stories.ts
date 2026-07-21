import type { StoryModule } from "../metadata.js";

const pillSelectorDropdown: StoryModule = {
  title: "Components/Forms/Pill Selector Dropdown",
  meta: {
    id: "pill-selector-dropdown",
    tag: "box-pill-selector-dropdown",
    shortDescription: "A multi-select pill field with an add menu.",
    docsDescription:
      "Pass people/options as JSON `options`; selected pills are the JSON array `value`. Set `allow-custom` to turn it into a collaborator/email token input: type + Enter/comma create a pill, Backspace removes the last, and pasting a comma/newline list creates several at once. A `pattern` (regex) validates each entry — invalid ones are rejected and emit `invalid-entry`.",
    sourceSnippet: `<box-pill-selector-dropdown label="Collaborators" placeholder="Add person" options='[{"value":"morgan","label":"Morgan Lee"}]' value='["morgan"]'></box-pill-selector-dropdown>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Empty-field prompt / add-button text." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { value, label } options." },
      { kind: "attribute", name: "value", type: "json", description: "Selected values as a string array." },
      { kind: "attribute", name: "allow-custom", type: "boolean", description: "Enable free-text token entry (custom pills)." },
      { kind: "attribute", name: "pattern", type: "string", description: "Regex each custom entry must match (e.g. an email)." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when selected values change." },
      { kind: "event", name: "invalid-entry", type: "CustomEvent", description: "Emitted when a custom entry fails the pattern." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-pill-selector-dropdown label="Collaborators" placeholder="Add person" options='[{"value":"morgan","label":"Morgan Lee"},{"value":"alex","label":"Alex Kim"},{"value":"sam","label":"Sam Patel"},{"value":"jordan","label":"Jordan Rivera"}]' value='["morgan"]'></box-pill-selector-dropdown>`,
    },
    {
      name: "Email token input",
      html: `<box-pill-selector-dropdown label="Invite by email" placeholder="Type an email" allow-custom pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]+" value='["morgan@box.com"]'></box-pill-selector-dropdown>`,
    },
  ],
};

export default pillSelectorDropdown;
