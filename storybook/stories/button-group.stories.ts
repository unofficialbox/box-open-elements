import type { StoryModule } from "../metadata.js";

const buttonGroup: StoryModule = {
  title: "Components/Actions/Button Group",
  meta: {
    id: "button-group",
    tag: "box-button-group",
    shortDescription: "A grouped set of related action buttons.",
    docsDescription: "Pass button definitions as JSON `options`; `value` marks the active option when used as a toggle group.",
    sourceSnippet: "<box-button-group label=\"Item actions\" options='[{\"label\":\"Share\",\"value\":\"share\"},{\"label\":\"Download\",\"value\":\"download\"}]' value=\"share\"></box-button-group>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible group label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Active option value." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-button-group label=\"Item actions\" options='[{\"label\":\"Share\",\"value\":\"share\"},{\"label\":\"Download\",\"value\":\"download\"},{\"label\":\"Delete\",\"value\":\"delete\"}]' value=\"share\"></box-button-group>" },
  ],
};

export default buttonGroup;
