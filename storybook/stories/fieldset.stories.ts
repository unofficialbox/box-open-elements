import type { StoryModule } from "../metadata.js";

const fieldset: StoryModule = {
  title: "Components/Forms/Fieldset",
  meta: {
    id: "fieldset",
    tag: "box-fieldset",
    shortDescription: "A labelled grouping for related form controls.",
    docsDescription: "Use `label` and optional `description`; slotted controls remain in light DOM and mirror `disabled` from the group.",
    sourceSnippet: `<box-fieldset label="File details" description="Group related file metadata fields."></box-fieldset>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Legend text for the group." },
      { kind: "attribute", name: "description", type: "string", description: "Optional helper text for the group." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the group and mirrors to slotted controls." },
      { kind: "slot", name: "default", description: "Related form controls." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-fieldset label="File details" description="Group related file metadata fields.">
  <box-text-field label="Name" value="Quarterly Plan"></box-text-field>
  <box-text-field label="Owner" value="Morgan Lee"></box-text-field>
</box-fieldset>`,
    },
  ],
};

export default fieldset;
