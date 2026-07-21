import type { StoryModule } from "../metadata.js";

const accordion: StoryModule = {
  title: "Components/Navigation/Accordion",
  meta: {
    id: "accordion",
    tag: "box-accordion",
    shortDescription: "An expandable section list.",
    docsDescription: "Pass panels as JSON `items` (`label`/`value`/`content`) and the open panel `value`.",
    sourceSnippet: "<box-accordion label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner and size.\"}]' value=\"props\"></box-accordion>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible accordion label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { label, value, content? }." },
      { kind: "attribute", name: "value", type: "string", description: "Expanded item value." },
      { kind: "attribute", name: "borderless", type: "boolean", description: "Flat variant with no outer card chrome." },
      { kind: "slot", name: "panel-<value>", type: "slot", description: "Rich panel body for an item; default text content is the fallback." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-accordion label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner, size, and classification.\"},{\"label\":\"Activity\",\"value\":\"activity\",\"content\":\"Recent comments and versions.\"}]' value=\"props\"></box-accordion>" },
    { name: "Borderless", html: "<box-accordion borderless label=\"Details\" items='[{\"label\":\"Properties\",\"value\":\"props\",\"content\":\"Owner, size, and classification.\"},{\"label\":\"Activity\",\"value\":\"activity\",\"content\":\"Recent comments and versions.\"}]' value=\"props\"></box-accordion>" },
  ],
};

export default accordion;
