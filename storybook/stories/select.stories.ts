import type { StoryModule } from "../metadata.js";

const select: StoryModule = {
  title: "Components/Forms/Select",
  meta: {
    id: "select",
    tag: "box-select",
    shortDescription: "A single-select dropdown field.",
    docsDescription: "Form-associated select. Provide choices as JSON `options` and the current `value`. Options may carry a `group` (rendered as native `<optgroup>` dividers) and a `disabled` flag. Set `multiple` for a native multi-select list box — read/write the selection via the `values` array, and each choice mirrors into the form under the field `name`. Like every form field it carries the shared contract: `required`, `description`, `invalid` + `error-message`, `hide-label`. For async options set `loading` — the control says 'Loading options…' with a spinner — and when a load comes back with nothing, the control states `empty-text` instead of sitting blank. (For a searchable, tokenised picker use `box-combobox` / `box-pill-selector-dropdown`.)",
    sourceSnippet: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"}]' value=\"morgan\"></box-select>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value, group?, disabled? }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected option value (first when multiple)." },
      { kind: "attribute", name: "multiple", type: "boolean", description: "Enable multi-select (native list box)." },
      { kind: "property", name: "values", type: "string[]", description: "Selected values (canonical when multiple)." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
      { kind: "attribute", name: "loading", type: "boolean", description: "Trailing spinner; the control says 'Loading options…'." },
      { kind: "attribute", name: "empty-text", type: "string", description: "What the control says with zero options (default 'No options available')." },
      { kind: "attribute", name: "required", type: "boolean", description: "Shared field contract: required mark + aria-required." },
      { kind: "attribute", name: "description", type: "string", description: "Shared field contract: help text linked via aria-describedby." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Selection changed — detail { value, values? } (SelectValueChangedDetail)." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"},{\"label\":\"Alex Kim\",\"value\":\"alex\"}]' value=\"morgan\"></box-select>" },
    { name: "Grouped", html: "<box-select label=\"Sort\" options='[{\"label\":\"Relevance\",\"value\":\"relevance\"},{\"label\":\"Name\",\"value\":\"name\",\"group\":\"Fields\"},{\"label\":\"Modified\",\"value\":\"modified\",\"group\":\"Fields\"}]' value=\"relevance\"></box-select>" },
    { name: "Multiple", html: "<box-select label=\"Views\" multiple options='[{\"label\":\"List\",\"value\":\"list\"},{\"label\":\"Table\",\"value\":\"table\"},{\"label\":\"Grid\",\"value\":\"grid\"}]' value=\"list\"></box-select>" },
    { name: "Disabled", html: "<box-select label=\"Owner\" options='[{\"label\":\"Morgan Lee\",\"value\":\"morgan\"},{\"label\":\"Alex Kim\",\"value\":\"alex\"}]' value=\"morgan\" disabled></box-select>" },
    { name: "Loading", html: "<box-select label=\"Team\" loading description=\"Fetching teams…\"></box-select>" },
    { name: "Empty", html: "<box-select label=\"Team\" empty-text=\"No teams match your filter\"></box-select>" },
  ],
};

export default select;
