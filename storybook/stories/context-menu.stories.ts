import type { StoryModule } from "../metadata.js";

const items = JSON.stringify([
  { id: "open", label: "Open" },
  { id: "rename", label: "Rename" },
  { id: "download", label: "Download" },
  { id: "delete", label: "Delete", separator: true },
]);

const target = `<div style="display:grid;place-items:center;height:120px;width:240px;border:1px dashed #ccc;border-radius:12px">Right-click here</div>`;

const contextMenu: StoryModule = {
  title: "Components/Overlays/Context Menu",
  meta: {
    id: "context-menu",
    tag: "box-context-menu",
    shortDescription: "A right-click menu anchored to the pointer.",
    docsDescription:
      "Wraps a target area (default slot). Right-clicking — or Shift+F10 / the ContextMenu key while focused — opens a menu at the pointer, positioned to stay in the viewport. Full keyboard menu (arrows, Home/End, Enter/Space, Escape). Emits `item-selected` with the chosen item.",
    sourceSnippet: `<box-context-menu items='${items}'>${target}</box-context-menu>`,
    referenceRows: [
      { kind: "attribute", name: "items", type: "ContextMenuItem[] (JSON)", description: "Menu items: { id, label, disabled?, separator? }." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Suppress the menu entirely." },
      { kind: "slot", name: "(default)", type: "slot", description: "The area that responds to right-click." },
      { kind: "event", name: "item-selected", type: "CustomEvent", description: "Fires with the chosen item." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-context-menu items='${items}'>${target}</box-context-menu>` },
  ],
};

export default contextMenu;
