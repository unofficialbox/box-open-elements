import type { StoryModule } from "../metadata.js";

const tabs: StoryModule = {
  title: "Components/Navigation/Tabs",
  meta: {
    id: "tabs",
    tag: "box-tabs",
    shortDescription: "A labelled tablist for switching views.",
    docsDescription: "Pass tab definitions as a JSON `options` attribute (`label`/`value`) and the selected `value`.",
    sourceSnippet: "<box-tabs label=\"Views\" options='[{\"label\":\"All files\",\"value\":\"all\"},{\"label\":\"Recents\",\"value\":\"recents\"}]' value=\"all\"></box-tabs>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the tablist." },
      { kind: "attribute", name: "options", type: "json", description: "Array of { label, value }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected tab value." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-tabs label=\"Views\" options='[{\"label\":\"All files\",\"value\":\"all\"},{\"label\":\"Recents\",\"value\":\"recents\"},{\"label\":\"Shared\",\"value\":\"shared\"}]' value=\"all\"></box-tabs>" },
    { name: "Shared selected", html: "<box-tabs label=\"Views\" options='[{\"label\":\"All files\",\"value\":\"all\"},{\"label\":\"Recents\",\"value\":\"recents\"},{\"label\":\"Shared\",\"value\":\"shared\"}]' value=\"shared\"></box-tabs>" },
  ],
};

export default tabs;
