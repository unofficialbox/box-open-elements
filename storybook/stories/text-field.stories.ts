import type { StoryModule } from "../metadata.js";

const textField: StoryModule = {
  title: "Components/Forms/Text Field",
  meta: {
    id: "text-field",
    tag: "box-text-field",
    shortDescription: "A single-line labelled text input.",
    docsDescription:
      "Form-associated text input with label, optional placeholder, and the shared field contract every form field carries: `required`, `description`, `invalid` + `error-message`, `hide-label`. Forward `autocomplete` so password managers and autofill can classify the field — the shadow boundary hides anything written on the custom element itself. On `type=\"password\"`, opt into `reveal` for a Show/Hide toggle that swaps the inner input without changing the declared type; the word and `aria-pressed` state the toggle, and a revealed password re-hides whenever the field stops being a password.",
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
      { kind: "attribute", name: "autocomplete", type: "string", description: "Forwarded to the inner input ('email', 'current-password', 'off', …)." },
      { kind: "attribute", name: "reveal", type: "boolean", description: "Show/Hide toggle on type=password; presentation-only swap." },
      { kind: "attribute", name: "required", type: "boolean", description: "Shared field contract: required mark + aria-required." },
      { kind: "attribute", name: "description", type: "string", description: "Shared field contract: help text linked via aria-describedby." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Value changed while typing — detail { value } (TextFieldValueChangedDetail)." },
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
    {
      name: "Password with reveal",
      html: `<box-text-field label="Password" type="password" reveal autocomplete="current-password" value="hunter2-plus-entropy"></box-text-field>`,
      note: "The toggle is a word, not an eye glyph, so the state is stated; aria-pressed carries it to AT.",
    },
    { name: "Valid", html: `<box-text-field label="Workspace URL" value="acme-team" valid></box-text-field>` },
  ],
};

export default textField;
