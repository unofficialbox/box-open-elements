import type { StoryModule } from "../metadata.js";

const dropdown: StoryModule = {
  title: "Components/Forms/Dropdown",
  meta: {
    id: "dropdown",
    tag: "box-dropdown",
    shortDescription: "A labelled menu button for choosing one item.",
    docsDescription: "Provide entries as JSON `items` (`id`/`label`) and the selected `value` (item id).",
    sourceSnippet: "<box-dropdown label=\"Sort by\" items='[{\"id\":\"name\",\"label\":\"Name\"}]' value=\"name\"></box-dropdown>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { id, label }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected item id." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-dropdown label=\"Sort by\" items='[{\"id\":\"name\",\"label\":\"Name\"},{\"id\":\"modified\",\"label\":\"Modified\"},{\"id\":\"size\",\"label\":\"Size\"}]' value=\"modified\"></box-dropdown>" },
  ],
};

export default dropdown;
