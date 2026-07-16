import type { StoryModule } from "../metadata.js";

const tabs: StoryModule = {
  title: "Components/Navigation/Tabs",
  meta: {
    id: "tabs",
    tag: "box-tabs",
    shortDescription: "A compact tablist for switching between peer views.",
    docsDescription: "Provide `options` and `value`. Use `layout=\"attached\"` for a segmented track; `separated` for independent tab buttons.",
    sourceSnippet: `<box-tabs label="Views" layout="attached" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"}]' value="all"></box-tabs>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible tablist label." },
      { kind: "attribute", name: "layout", type: '"attached" | "separated"', description: "Visual grouping of tabs." },
      { kind: "attribute", name: "options", type: "JSON", description: "Tab options `{ label, value }`." },
      { kind: "attribute", name: "value", type: "string", description: "Selected tab value." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when the selected tab changes." },
    ],
  },
  variants: [
    {
      name: "Attached",
      html: `<box-tabs label="Views" layout="attached" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"},{"label":"Shared","value":"shared"}]' value="all"></box-tabs>`,
    },
    {
      name: "Separated",
      html: `<box-tabs label="Views" layout="separated" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"},{"label":"Shared","value":"shared"}]' value="all"></box-tabs>`,
    },
  ],
};

export default tabs;
