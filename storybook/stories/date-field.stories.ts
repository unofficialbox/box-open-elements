import type { StoryModule } from "../metadata.js";

const dateField: StoryModule = {
  title: "Components/Forms/Date Field",
  meta: {
    id: "date-field",
    tag: "box-date-field",
    shortDescription: "A labelled date input.",
    docsDescription: "Form-associated date field. Pin demo values with `value` (and optional `min` / `max`). Add `clearable` for a reset button (shown only when a date is set) that emits `value-changed` with an empty value.",
    sourceSnippet: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "string", description: "ISO date value." },
      { kind: "attribute", name: "min", type: "string", description: "Earliest allowed date." },
      { kind: "attribute", name: "max", type: "string", description: "Latest allowed date." },
      { kind: "attribute", name: "clearable", type: "boolean", description: "Shows a clear button when a date is set." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>` },
    { name: "Clearable", html: `<box-date-field label="Due date" value="2026-07-18" clearable></box-date-field>` },
    { name: "Disabled", html: `<box-date-field label="Due date" value="2026-07-18" disabled></box-date-field>` },
  ],
};

export default dateField;
