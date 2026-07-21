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
      { kind: "attribute", name: "type", type: "string", description: "Input type: text (default), email, tel, url, password, search, number." },
      { kind: "attribute", name: "loading", type: "boolean", description: "Shows a trailing spinner (e.g. async validation)." },
      { kind: "attribute", name: "valid", type: "boolean", description: "Shows a trailing success check." },
      { kind: "slot", name: "icon", type: "slot", description: "Leading icon inside the field." },
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
    {
      name: "With leading icon",
      html: `<box-text-field label="Search" placeholder="Find files"><svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M7 2a5 5 0 013.9 8.1l3 3-1.4 1.4-3-3A5 5 0 117 2zm0 2a3 3 0 100 6 3 3 0 000-6z" fill="currentColor"/></svg></box-text-field>`,
    },
    { name: "Loading", html: `<box-text-field label="Workspace URL" value="acme" loading></box-text-field>` },
    { name: "Valid", html: `<box-text-field label="Workspace URL" value="acme-team" valid></box-text-field>` },
  ],
};

export default textField;
