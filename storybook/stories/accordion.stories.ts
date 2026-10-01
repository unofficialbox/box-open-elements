import type { StoryModule } from "../metadata.js";

const accordion: StoryModule = {
  title: "Components/Navigation/Accordion",
  meta: {
    id: "accordion",
    tag: "box-accordion",
    shortDescription: "An expandable section list.",
    docsDescription: "Pass panels as JSON items (label/value/content/summary). Use value for single-open mode or multiple with values for independent panels.",
    sourceSnippet: "<box-accordion label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner and size.\"}]' value=\"props\"></box-accordion>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible accordion label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { label, value, content? }." },
      { kind: "attribute", name: "value", type: "string", description: "Expanded item value." },
      { kind: "attribute", name: "multiple", type: "boolean", description: "Allow independent expanded panels." },
      { kind: "property", name: "values", type: "string[]", description: "Expanded panels in multiple mode (JSON attribute supported)." },
      { kind: "event", name: "values-changed", type: "{ values: string[] }", description: "Independent panel state changed." },
      { kind: "attribute", name: "borderless", type: "boolean", description: "Flat variant with no outer card chrome." },
      { kind: "slot", name: "panel-<value>", type: "slot", description: "Rich panel body for an item; default text content is the fallback." },
    ],
  },
  variants: [
    { name: "Independent sections", html: `<box-accordion multiple values='["options","hosts"]' items='[{"label":"More options","summary":"api.box.com","value":"options","content":"Configure the service."},{"label":"Other hosts","summary":"none","value":"hosts","content":"Add another host."}]'></box-accordion>` },
    { name: "Default", html: "<box-accordion label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner, size, and classification.\"},{\"label\":\"Activity\",\"value\":\"activity\",\"content\":\"Recent comments and versions.\"}]' value=\"props\"></box-accordion>" },
    { name: "Borderless", html: "<box-accordion borderless label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner, size, and classification.\"},{\"label\":\"Activity\",\"value\":\"activity\",\"content\":\"Recent comments and versions.\"}]' value=\"props\"></box-accordion>" },
  ],
};

export default accordion;
