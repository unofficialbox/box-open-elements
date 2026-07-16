import type { StoryModule } from "../metadata.js";

const dateField: StoryModule = {
  title: "Components/Forms/Date Field",
  meta: {
    id: "date-field",
    tag: "box-date-field",
    shortDescription: "A labelled date input.",
    docsDescription: "Form-associated date field. Pin demo values with `value` (and optional `min` / `max`).",
    sourceSnippet: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "string", description: "ISO date value." },
      { kind: "attribute", name: "min", type: "string", description: "Earliest allowed date." },
      { kind: "attribute", name: "max", type: "string", description: "Latest allowed date." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>` },
    { name: "Disabled", html: `<box-date-field label="Due date" value="2026-07-18" disabled></box-date-field>` },
  ],
};

export default dateField;
