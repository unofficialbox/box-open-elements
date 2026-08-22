import type { StoryModule } from "../metadata.js";

const drawer: StoryModule = {
  title: "Components/Overlays/Drawer",
  meta: {
    id: "drawer",
    tag: "box-drawer",
    shortDescription: "A side panel overlay for details and tasks.",
    docsDescription:
      "Toggle with `open` (reflected; `open-changed` reports both directions, and `show()`/`close()` are the imperative pair). **`dismiss` is cancelable and names its source** (close-button / backdrop / escape): call `preventDefault()` to keep the drawer open — that is the whole unsaved-changes guard, and the drawer learns nothing about your form. Slot `header` content under the heading and `footer` actions into the sticky footer row (rendered only when slotted). `size` presets small/medium/large/full scale the travel axis; under 640px every drawer is the whole screen. `busy` veils the body with a spinner and sets `aria-busy` while Close stays reachable. For a mobile nav drawer, slot a `box-nav-sidebar` straight into the body — that is the rail-to-drawer recipe.",
    sourceSnippet: `<box-drawer heading="Details" open></box-drawer>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the drawer is shown." },
      { kind: "attribute", name: "heading", type: "string", description: "Drawer title." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "position", type: "string", description: "Edge the drawer anchors to: right (default), left, bottom." },
      { kind: "attribute", name: "size", type: '"small" | "medium" | "large" | "full"', description: "Width preset for side drawers, height for the bottom sheet." },
      { kind: "attribute", name: "busy", type: "boolean", description: "Saving/loading veil over the body plus aria-busy; Close stays reachable." },
      { kind: "slot", name: "header", type: "slot", description: "Extra header content under the heading." },
      { kind: "slot", name: "footer", type: "slot", description: "Sticky footer actions; the row renders only when content is slotted." },
      { kind: "event", name: "open-changed", type: "CustomEvent", description: "Open state changed — detail { open }." },
      { kind: "event", name: "dismiss", type: "CustomEvent (cancelable)", description: "The user asked to close (close-button / backdrop / escape). preventDefault() keeps it open." },
    ],
  },
  variants: [
    { name: "Open", html: `<box-drawer heading="Details" description="Item metadata and activity." open></box-drawer>` },
    { name: "Closed", html: `<box-drawer heading="Details" description="Item metadata and activity."></box-drawer>` },
  ],
};

export default drawer;
