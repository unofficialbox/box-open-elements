import type { StoryModule } from "../metadata.js";

const drawer: StoryModule = {
  title: "Components/Overlays/Drawer",
  meta: {
    id: "drawer",
    tag: "box-drawer",
    shortDescription: "A side panel overlay for details and tasks.",
    docsDescription: "Toggle with `open`. Set `heading` and optional `description` / `position`.",
    sourceSnippet: `<box-drawer heading="Details" open></box-drawer>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the drawer is shown." },
      { kind: "attribute", name: "heading", type: "string", description: "Drawer title." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "position", type: "string", description: "Edge the drawer anchors to." },
    ],
  },
  variants: [
    { name: "Open", html: `<box-drawer heading="Details" description="Item metadata and activity." open></box-drawer>` },
    { name: "Closed", html: `<box-drawer heading="Details" description="Item metadata and activity."></box-drawer>` },
  ],
};

export default drawer;
