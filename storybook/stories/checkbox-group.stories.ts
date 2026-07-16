import type { StoryModule } from "../metadata.js";

const checkboxGroup: StoryModule = {
  title: "Components/Forms/Checkbox Group",
  meta: {
    id: "checkbox-group",
    tag: "box-checkbox-group",
    shortDescription: "A labelled set of multi-select checkboxes.",
    docsDescription: "Form-associated checkbox group. `options` is JSON; `value` is a JSON array of selected values.",
    sourceSnippet: "<box-checkbox-group label=\"Permissions\" options='[{\"label\":\"Can view\",\"value\":\"view\"}]' value='[\"view\"]'></box-checkbox-group>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible group label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "json", description: "JSON array of selected values." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-checkbox-group label=\"Permissions\" options='[{\"label\":\"Can view\",\"value\":\"view\"},{\"label\":\"Can edit\",\"value\":\"edit\"},{\"label\":\"Can share\",\"value\":\"share\"}]' value='[\"view\",\"edit\"]'></box-checkbox-group>" },
  ],
};

export default checkboxGroup;
