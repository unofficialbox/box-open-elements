import type { StoryModule } from "../metadata.js";

const checkbox: StoryModule = {
  title: "Components/Forms/Checkbox",
  meta: {
    id: "checkbox",
    tag: "box-checkbox",
    shortDescription: "A single selectable option.",
    docsDescription: "A labelled checkbox for an individual boolean choice; emits `change` when toggled.",
    sourceSnippet: `<box-checkbox label="Enable shared links" checked></box-checkbox>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Checkbox label." },
      { kind: "attribute", name: "checked", type: "boolean", description: "Selected state." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the checkbox inert." },
    ],
  },
  variants: [
    { name: "Checked", html: `<box-checkbox label="Enable shared links" checked></box-checkbox>` },
    { name: "Unchecked", html: `<box-checkbox label="Require password"></box-checkbox>` },
    { name: "Disabled", html: `<box-checkbox label="Managed by admin" checked disabled></box-checkbox>` },
  ],
};

export default checkbox;
