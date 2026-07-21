import type { StoryModule } from "../metadata.js";

const combobox: StoryModule = {
  title: "Components/Forms/Combobox",
  meta: {
    id: "combobox",
    tag: "box-combobox",
    shortDescription: "A filterable single-select combobox.",
    docsDescription: "Form-associated combobox with a real ARIA listbox popup: type to filter, navigate with Arrow keys (`aria-activedescendant`), Enter/click to select, Escape to close. The popup is positioned as a viewport-fixed overlay (via `foundations/overlay`), so it escapes ancestor overflow. Options may carry a `group` (rendered as divider headers) and a `description` (secondary line). Typed free-text still commits as the value (resolving to an option value when the text matches a label). Set `placement` (e.g. `top-start`) to steer the popup.",
    sourceSnippet: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"}]'></box-combobox>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value, description?, group?, disabled? }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected value when set." },
      { kind: "attribute", name: "placement", type: "string", description: "Preferred popup side/align (default bottom-start)." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted with { value } on selection or typed input." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"},{\"label\":\"Document\",\"value\":\"doc\"},{\"label\":\"Spreadsheet\",\"value\":\"xls\"}]'></box-combobox>" },
    { name: "Selected", html: "<box-combobox label=\"File type\" options='[{\"label\":\"PDF\",\"value\":\"pdf\"},{\"label\":\"Document\",\"value\":\"doc\"},{\"label\":\"Spreadsheet\",\"value\":\"xls\"}]' value=\"pdf\"></box-combobox>" },
  ],
};

export default combobox;
