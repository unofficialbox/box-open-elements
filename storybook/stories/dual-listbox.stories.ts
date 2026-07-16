import type { StoryModule } from "../metadata.js";

const dualListbox: StoryModule = {
  title: "Components/Forms/Dual Listbox",
  meta: {
    id: "dual-listbox",
    tag: "box-dual-listbox",
    shortDescription: "A transfer list for choosing multiple options.",
    docsDescription: "Provide `options` and selected `value` as JSON arrays.",
    sourceSnippet: `<box-dual-listbox label="Report fields" options='[{"label":"File name","value":"name"}]' value='["name"]'></box-dual-listbox>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "json", description: "Selected values array." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-dual-listbox label="Report fields" options='[{"label":"File name","value":"name"},{"label":"Owner","value":"owner"},{"label":"Modified","value":"modified"},{"label":"Size","value":"size"}]' value='["name","owner"]'></box-dual-listbox>`,
    },
  ],
};

export default dualListbox;
