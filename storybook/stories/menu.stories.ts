import type { StoryModule } from "../metadata.js";

const menu: StoryModule = {
  title: "Components/Actions/Menu",
  meta: {
    id: "menu",
    tag: "box-menu",
    shortDescription: "An action menu driven by a JSON item list.",
    docsDescription: "Provide menu entries as JSON `items` (`id`/`label`, optional `disabled`).",
    sourceSnippet: "<box-menu label=\"File actions\" items='[{\"id\":\"open\",\"label\":\"Open\"},{\"id\":\"rename\",\"label\":\"Rename\"}]'></box-menu>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible menu label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { id, label, disabled? }." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the menu." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-menu label=\"File actions\" items='[{\"id\":\"open\",\"label\":\"Open\"},{\"id\":\"rename\",\"label\":\"Rename\"},{\"id\":\"move\",\"label\":\"Move or copy\",\"disabled\":true}]'></box-menu>" },
  ],
};

export default menu;
