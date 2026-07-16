import type { StoryModule } from "../metadata.js";

const colorPicker: StoryModule = {
  title: "Components/Forms/Color Picker",
  meta: {
    id: "color-picker",
    tag: "box-color-picker",
    shortDescription: "A form-associated color input with optional swatches.",
    docsDescription: "Use `value` for the selected hex color and pass curated swatches as JSON `swatches`.",
    sourceSnippet: `<box-color-picker label="Brand color" value="#0061d5" swatches='[{"value":"#0061d5","label":"Box blue"}]'></box-color-picker>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Field label." },
      { kind: "attribute", name: "value", type: "string", description: "Selected #rrggbb color." },
      { kind: "attribute", name: "swatches", type: "json", description: "Array of { value, label } swatches." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the input and swatches." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when the selected color changes." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-color-picker label="Brand color" value="#0061d5" swatches='[{"value":"#0061d5","label":"Box blue"},{"value":"#26c281","label":"Success"},{"value":"#f5b31b","label":"In progress"},{"value":"#ed3757","label":"Error"}]'></box-color-picker>`,
    },
  ],
};

export default colorPicker;
