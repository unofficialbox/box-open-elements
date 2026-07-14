import type { StoryModule } from "../metadata.js";

const button: StoryModule = {
  title: "Components/Actions/Button",
  meta: {
    id: "button",
    tag: "box-button",
    shortDescription: "The primary action trigger.",
    docsDescription:
      "A labelled button with Box tones and sizes. Emits a `click` event; set `disabled` to make it inert.",
    sourceSnippet: `<box-button label="Save" tone="primary"></box-button>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Visible button text." },
      { kind: "attribute", name: "tone", type: '"primary" | "neutral" | "danger"', description: "Visual emphasis." },
      { kind: "attribute", name: "size", type: '"small"', description: "Compact size; omit for default." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the button inert." },
      { kind: "event", name: "click", description: "Fired when the button is activated." },
    ],
  },
  variants: [
    { name: "Primary", html: `<box-button label="Save" tone="primary"></box-button>` },
    { name: "Neutral", html: `<box-button label="Cancel" tone="neutral"></box-button>` },
    { name: "Danger", html: `<box-button label="Delete" tone="danger"></box-button>` },
    { name: "Small", html: `<box-button label="Small" tone="primary" size="small"></box-button>` },
    { name: "Disabled", html: `<box-button label="Disabled" tone="primary" disabled></box-button>` },
  ],
};

export default button;
