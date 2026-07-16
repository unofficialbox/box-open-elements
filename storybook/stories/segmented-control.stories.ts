import type { StoryModule } from "../metadata.js";

const segmentedControl: StoryModule = {
  title: "Components/Actions/Segmented Control",
  meta: {
    id: "segmented-control",
    tag: "box-segmented-control",
    shortDescription: "A compact mutually exclusive choice control.",
    docsDescription: "Provide segment definitions as JSON `options` and the selected `value`.",
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
  ],
};

export default segmentedControl;
