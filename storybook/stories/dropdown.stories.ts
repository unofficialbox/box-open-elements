import type { StoryModule } from "../metadata.js";

const dropdown: StoryModule = {
  title: "Components/Forms/Dropdown",
  meta: {
    id: "dropdown",
    tag: "box-dropdown",
    shortDescription: "A labelled menu button for choosing one item.",
    docsDescription: "Provide entries as JSON `items` (`id`/`label`) and the selected `value` (item id). The open menu is positioned as a viewport-fixed overlay (via the shared `foundations/overlay` primitive), so it escapes ancestor `overflow: hidden` and flips above the trigger when there's no room below. Set `placement` (e.g. `top-start`) to steer it.",
    sourceSnippet: "<box-dropdown label=\"Sort by\" items='[{\"id\":\"name\",\"label\":\"Name\"}]' value=\"name\"></box-dropdown>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { id, label }." },
      { kind: "attribute", name: "value", type: "string", description: "Selected item id." },
      { kind: "attribute", name: "placement", type: "string", description: "Preferred menu side/align, e.g. bottom-start (default), top-start." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted with { value, item } when a choice is made." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-dropdown label=\"Sort by\" items='[{\"id\":\"name\",\"label\":\"Name\"},{\"id\":\"modified\",\"label\":\"Modified\"},{\"id\":\"size\",\"label\":\"Size\"}]' value=\"modified\"></box-dropdown>" },
  ],
};

export default dropdown;
