import type { StoryModule } from "../metadata.js";

const tileGroup: StoryModule = {
  title: "Components/Forms/Tile Group",
  meta: {
    id: "tile-group",
    tag: "box-tile-group",
    shortDescription: "Choose one option, or several, as cards.",
    docsDescription:
      "Each tile wraps a real `<input type=\"radio\">` or `<input type=\"checkbox\">`, visually hidden but present in the tab order and the accessibility tree. That is the whole design: grouping, arrow-key navigation between radios, roving focus and form participation all come from the platform rather than being reimplemented on `<div>`s and then subtly diverging from what a screen reader user expects. Because the control is hidden, the focus ring is drawn on the tile around it — without that, keyboard focus would be invisible. A disabled option disables the control itself, not just its styling, so it is neither focusable nor submitted. Use tiles where the choice deserves explaining — a plan, a permission level, a retention policy — and a bare radio label would not have room; where the options are one word each, radios are smaller and better.",
    sourceSnippet: `<box-tile-group name="plan" options='[{"id":"team","label":"Team"}]'></box-tile-group>`,
    referenceRows: [
      { kind: "attribute", name: "options", type: "TileOption[]", description: "The choices, as JSON. Each needs `id` and `label`; `description` and `disabled` are optional." },
      { kind: "attribute", name: "name", type: "string", description: "The radio group name. Required for radios to behave as one group." },
      { kind: "attribute", name: "value", type: "string", description: "Selected ids, comma-separated. Read `.selected` for an array." },
      { kind: "attribute", name: "multiple", type: "boolean", description: "Several selections rather than one; switches radios for checkboxes." },
      { kind: "attribute", name: "legend", type: "string", description: "The fieldset legend." },
      { kind: "event", name: "tile-change", type: "{ selected: string[] }", description: "Emitted when the selection changes." },
      { kind: "part", name: "tile", type: "part", description: "One tile. Carries `data-selected` and `data-disabled`." },
      { kind: "part", name: "control", type: "part", description: "The visually hidden native input." },
    ],
  },
  variants: [
    { name: "Single choice", html: `<box-tile-group name="retention" legend="Retention policy" value="standard" options='[{"id":"standard","label":"Standard","description":"Delete 7 years after the contract ends."},{"id":"extended","label":"Extended","description":"Retain indefinitely; legal hold applies."}]'></box-tile-group>`, note: "Where the choice deserves explaining — the description is what a radio label could not carry." },
    { name: "Several", html: `<box-tile-group multiple name="notify" legend="Notify me when" value="signed,expiring" options='[{"id":"signed","label":"Signed","description":"A counterparty completes the ceremony."},{"id":"expiring","label":"Expiring","description":"30 days before the renewal date."},{"id":"shared","label":"Shared","description":"Someone shares this outside the company."}]'></box-tile-group>` },
    { name: "With a disabled option", html: `<box-tile-group name="plan" legend="Plan" value="team" options='[{"id":"team","label":"Team","description":"Up to 25 people."},{"id":"business","label":"Business","description":"Unlimited storage."},{"id":"legacy","label":"Legacy","description":"No longer available.","disabled":true}]'></box-tile-group>`, note: "The control is disabled, not merely dimmed, so it is neither focusable nor submitted." },
  ],
};

export default tileGroup;
