import type { StoryModule } from "../metadata.js";

const dialog: StoryModule = {
  title: "Components/Overlays/Dialog",
  meta: {
    id: "dialog",
    tag: "box-dialog",
    shortDescription: "A modal dialog for confirmations and focused tasks.",
    docsDescription:
      "Toggle with `open`. Provide `heading` and optional `description` / `confirm-label` for the primary action. `size` picks the modal width (small / medium / large / fullscreen), and opening locks background page scroll.",
    sourceSnippet: `<box-dialog open heading="Delete item?" description="This cannot be undone." confirm-label="Delete"></box-dialog>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the dialog is shown (locks page scroll while open)." },
      { kind: "attribute", name: "heading", type: "string", description: "Dialog title." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting body copy." },
      { kind: "attribute", name: "confirm-label", type: "string", description: "Primary action label." },
      { kind: "attribute", name: "size", type: '"small" | "medium" | "large" | "fullscreen"', description: "Modal width; default medium." },
    ],
  },
  variants: [
    {
      name: "Open",
      html: `<box-dialog open heading="Delete item?" description="This cannot be undone." confirm-label="Delete"></box-dialog>`,
    },
    {
      name: "Closed",
      html: `<box-dialog heading="Delete item?" description="This cannot be undone." confirm-label="Delete"></box-dialog>`,
    },
  ],
};

export default dialog;
