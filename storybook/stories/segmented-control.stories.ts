import type { StoryModule } from "../metadata.js";

const segmentedControl: StoryModule = {
  title: "Components/Actions/Segmented Control",
  meta: {
    id: "segmented-control",
    tag: "box-segmented-control",
    shortDescription: "A compact mutually exclusive choice control.",
    docsDescription: "Provide segment definitions as JSON `options` and the selected `value`. Segments wrap within the available width in both separated and attached layouts; oversized labels wrap within their segment. Arrow keys follow option order across rows, skipping disabled options.",
    sourceSnippet: "<box-segmented-control label=\"Density\" options='[{\"label\":\"Comfortable\",\"value\":\"comfortable\"},{\"label\":\"Compact\",\"value\":\"compact\"}]' value=\"comfortable\"></box-segmented-control>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the control." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected segment value." },
    ],
  },
  variants: [
    { name: "Comfortable", html: "<box-segmented-control label=\"Density\" options='[{\"label\":\"Comfortable\",\"value\":\"comfortable\"},{\"label\":\"Compact\",\"value\":\"compact\"}]' value=\"comfortable\"></box-segmented-control>" },
    { name: "Compact", html: "<box-segmented-control label=\"Density\" options='[{\"label\":\"Comfortable\",\"value\":\"comfortable\"},{\"label\":\"Compact\",\"value\":\"compact\"}]' value=\"compact\"></box-segmented-control>" },
    { name: "Narrow load shapes", html: "<div style=\"width:288px;max-width:100%\"><box-segmented-control label=\"Load shape\" options='[{\"label\":\"Steady\",\"value\":\"steady\"},{\"label\":\"Spike\",\"value\":\"spike\"},{\"label\":\"Soak\",\"value\":\"soak\"},{\"label\":\"In stages\",\"value\":\"stages\"},{\"label\":\"Capacity test\",\"value\":\"capacity\"}]' value=\"steady\"></box-segmented-control></div>" },
  ],
};

export default segmentedControl;
