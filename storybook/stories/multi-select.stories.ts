import type { StoryModule } from "../metadata.js";

const multiSelect: StoryModule = {
  title: "Components/Forms/Multi Select",
  meta: {
    id: "multi-select",
    tag: "box-multi-select",
    shortDescription: "A multi-value select field.",
    docsDescription: "Form-associated multi-select. `options` is JSON; `value` is a JSON array of selected values.",
    sourceSnippet: "<box-multi-select label=\"Collaborators\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"}]' value='[\"morgan\"]'></box-multi-select>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "json", description: "JSON array of selected values." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-multi-select label=\"Collaborators\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"},{\"label\":\"Alex Kim\",\"value\":\"alex\"},{\"label\":\"Sam Rivera\",\"value\":\"sam\"}]' value='[\"morgan\",\"alex\"]'></box-multi-select>" },
  ],
};

export default multiSelect;
