import type { StoryModule } from "../metadata.js";

const menuItem: StoryModule = {
  title: "Components/Actions/Menu Item",
  meta: {
    id: "menu-item",
    tag: "box-menu-item",
    shortDescription: "A single menu row for composed menus.",
    docsDescription: "Use inside custom menu compositions when you are not driving `box-menu` from JSON `items`.",
    sourceSnippet: "<box-menu-item label=\"Rename\"></box-menu-item>",
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Visible item label." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the item inert." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-menu-item label=\"Rename\"></box-menu-item>" },
    { name: "Disabled", html: "<box-menu-item label=\"Move or copy\" disabled></box-menu-item>" },
  ],
};

export default menuItem;
