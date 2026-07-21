import type { StoryModule } from "../metadata.js";

const menu: StoryModule = {
  title: "Components/Actions/Menu",
  meta: {
    id: "menu",
    tag: "box-menu",
    shortDescription: "An action menu driven by a JSON item list.",
    docsDescription:
      "Provide menu entries as JSON `items`. Beyond plain actions (`id`/`label`, optional `disabled`), an item can be a `header` (section label), carry a `separator` (divider before it), be a link (`href`), or be checkable (`checked` → menuitemcheckbox with a ✓).",
    sourceSnippet: "<box-menu label=\"File actions\" items='[{\"id\":\"open\",\"label\":\"Open\"},{\"id\":\"rename\",\"label\":\"Rename\"}]'></box-menu>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible menu label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { id, label, disabled?, header?, separator?, href?, checked? }." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the menu." },
      { kind: "event", name: "item-selected", type: "CustomEvent", description: "Fires with the chosen item (checkable items toggle aria-checked)." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-menu label=\"File actions\" items='[{\"id\":\"open\",\"label\":\"Open\"},{\"id\":\"rename\",\"label\":\"Rename\"},{\"id\":\"move\",\"label\":\"Move or copy\",\"disabled\":true}]'></box-menu>" },
    { name: "Rich", html: "<box-menu label=\"View\" items='[{\"id\":\"h\",\"label\":\"Sort by\",\"header\":true},{\"id\":\"name\",\"label\":\"Name\",\"checked\":true},{\"id\":\"date\",\"label\":\"Date\",\"checked\":false},{\"id\":\"help\",\"label\":\"Learn more\",\"href\":\"#\",\"separator\":true}]'></box-menu>" },
  ],
};

export default menu;
