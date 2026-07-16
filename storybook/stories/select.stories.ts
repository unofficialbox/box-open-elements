import type { StoryModule } from "../metadata.js";

const select: StoryModule = {
  title: "Components/Forms/Select",
  meta: {
    id: "select",
    tag: "box-select",
    shortDescription: "A single-select dropdown field.",
    docsDescription: "Form-associated select. Provide choices as JSON `options` and the current `value`.",
    sourceSnippet: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"}]' value=\"morgan\"></box-select>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected option value." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"},{\"label\":\"Alex Kim\",\"value\":\"alex\"}]' value=\"morgan\"></box-select>" },
    { name: "Disabled", html: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"},{\"label\":\"Alex Kim\",\"value\":\"alex\"}]' value=\"morgan\" disabled></box-select>" },
  ],
};

export default select;
