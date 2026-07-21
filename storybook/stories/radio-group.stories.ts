import type { StoryModule } from "../metadata.js";

const radioGroup: StoryModule = {
  title: "Components/Forms/Radio Group",
  meta: {
    id: "radio-group",
    tag: "box-radio-group",
    shortDescription: "A labelled set of mutually exclusive choices.",
    docsDescription: "Form-associated radio group. Provide choices as JSON `options` and the selected `value`. Each option may carry a `description` (supporting subsection under its label) and a `disabled` flag to make that single choice inert.",
    sourceSnippet: "<box-radio-group label=\"Access level\" options='[{\"label\":\"Company\",\"value\":\"company\"}]' value=\"company\"></box-radio-group>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible group label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value, description?, disabled? }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected option value." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-radio-group label=\"Access level\" options='[{\"label\":\"Company\",\"value\":\"company\"},{\"label\":\"Invited people only\",\"value\":\"invited\"}]' value=\"company\"></box-radio-group>" },
    { name: "With descriptions", html: "<box-radio-group label=\"Access level\" options='[{\"label\":\"Company\",\"value\":\"company\",\"description\":\"Anyone at your company can find and open this.\"},{\"label\":\"Invited people only\",\"value\":\"invited\",\"description\":\"Only people you invite can open this.\"},{\"label\":\"Public\",\"value\":\"public\",\"description\":\"Requires an admin to enable.\",\"disabled\":true}]' value=\"company\"></box-radio-group>" },
  ],
};

export default radioGroup;
