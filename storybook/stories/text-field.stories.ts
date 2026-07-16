import type { StoryModule } from "../metadata.js";

const textField: StoryModule = {
  title: "Components/Forms/Text Field",
  meta: {
    id: "text-field",
    tag: "box-text-field",
    shortDescription: "A single-line labelled text input.",
    docsDescription:
      "Form-associated text input with label, optional placeholder, and validation hooks (`invalid`, `error-message`).",
    sourceSnippet: `<box-text-field label="Folder name" placeholder="Marketing"></box-text-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "string", description: "Current text value." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Hint shown when empty." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
      { kind: "attribute", name: "invalid", type: "boolean", description: "Marks the field invalid." },
      { kind: "event", name: "input", description: "Fired as the value changes." },
      { kind: "event", name: "change", description: "Fired when the value is committed." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-text-field label="Folder name" placeholder="Marketing"></box-text-field>` },
    { name: "Filled", html: `<box-text-field label="Folder name" value="Q3 Plans"></box-text-field>` },
    { name: "Disabled", html: `<box-text-field label="Folder name" value="Locked" disabled></box-text-field>` },
    {
      name: "Invalid",
      html: `<box-text-field label="Folder name" value="" invalid error-message="Name is required"></box-text-field>`,
    },
  ],
};

export default textField;
