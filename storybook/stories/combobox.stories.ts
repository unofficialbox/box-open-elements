import type { StoryModule } from "../metadata.js";

const combobox: StoryModule = {
  title: "Components/Forms/Combobox",
  meta: {
    id: "combobox",
    tag: "box-combobox",
    shortDescription: "A filterable single-select combobox.",
    docsDescription: "Form-associated combobox. Provide choices as JSON `options`.",
    sourceSnippet: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"}]'></box-combobox>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected value when set." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"},{\"label\":\"Document\",\"value\":\"doc\"},{\"label\":\"Spreadsheet\",\"value\":\"xls\"}]'></box-combobox>" },
    { name: "Selected", html: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"},{\"label\":\"Document\",\"value\":\"doc\"},{\"label\":\"Spreadsheet\",\"value\":\"xls\"}]' value=\"pdf\"></box-combobox>" },
  ],
};

export default combobox;
