import type { StoryModule } from "../metadata.js";

const iconButton: StoryModule = {
  title: "Components/Actions/Icon Button",
  meta: {
    id: "icon-button",
    tag: "box-icon-button",
    shortDescription: "An icon-only action with an accessible label.",
    docsDescription: "A compact action rendering a single glyph; the required `label` provides the accessible name.",
    sourceSnippet: `<box-icon-button icon="+" label="Add item"></box-icon-button>`,
    referenceRows: [
      { kind: "attribute", name: "icon", type: "string", description: "Icon token or glyph." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible name (visually hidden)." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the button inert." },
    ],
  },
  variants: [
    { name: "Add", html: `<box-icon-button icon="+" label="Add item"></box-icon-button>` },
    { name: "Settings", html: `<box-icon-button icon="gear" label="Settings"></box-icon-button>` },
    { name: "Disabled", html: `<box-icon-button icon="+" label="Add item" disabled></box-icon-button>` },
  ],
};

export default iconButton;
