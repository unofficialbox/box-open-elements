import type { StoryModule } from "../metadata.js";

const itemForm: StoryModule = {
  title: "Patterns/Item/Item Form",
  meta: {
    id: "item-form",
    tag: "box-item-form",
    shortDescription: "A schema-driven item properties form.",
    docsDescription: "Pass form schema through JSON `fields` and current field values through JSON `value`; edit mode emits submit/cancel events.",
    sourceSnippet: `<box-item-form label="File properties" fields='[{"id":"name","label":"Name"}]' value='{"name":"Quarterly Plan.pdf"}'></box-item-form>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Form label." },
      { kind: "attribute", name: "fields", type: "json", description: "Array of field definitions." },
      { kind: "attribute", name: "value", type: "json", description: "Current field values keyed by field id." },
      { kind: "attribute", name: "mode", type: "string", description: "`edit` or `read`." },
      { kind: "attribute", name: "submit-label", type: "string", description: "Submit button label." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables controls and actions." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when a field value changes." },
      { kind: "event", name: "submit", type: "CustomEvent", description: "Emitted with current values on submit." },
      { kind: "event", name: "cancel", type: "CustomEvent", description: "Emitted when cancel is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-item-form label="File properties" submit-label="Save properties" fields='[{"id":"name","label":"Name","section":"Details"},{"id":"status","label":"Status","section":"Details"},{"id":"description","label":"Description","section":"Details","type":"textarea"}]' value='{"name":"Quarterly Plan.pdf","status":"Final","description":"Latest board-ready plan with updated forecasts."}'></box-item-form>`,
    },
  ],
};

export default itemForm;
