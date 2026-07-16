import type { StoryModule } from "../metadata.js";

const textArea: StoryModule = {
  title: "Components/Forms/Text Area",
  meta: {
    id: "text-area",
    tag: "box-text-area",
    shortDescription: "A multi-line labelled text input.",
    docsDescription: "Form-associated textarea with `label`, optional `placeholder` / `rows`, and validation hooks.",
    sourceSnippet: `<box-text-area label="Notes" placeholder="Add review notes"></box-text-area>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Hint when empty." },
      { kind: "attribute", name: "rows", type: "number", description: "Visible row count." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
      { kind: "attribute", name: "invalid", type: "boolean", description: "Marks the field invalid." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-text-area label="Notes" placeholder="Add review notes"></box-text-area>` },
    { name: "Filled", html: `<box-text-area label="Notes" rows="4" value="Looks good to merge."></box-text-area>` },
  ],
};

export default textArea;
