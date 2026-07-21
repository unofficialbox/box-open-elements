import type { StoryModule } from "../metadata.js";

const button: StoryModule = {
  title: "Components/Actions/Button",
  meta: {
    id: "button",
    tag: "box-button",
    shortDescription: "The primary action trigger.",
    docsDescription:
      "A labelled button with Box tones and sizes. Emits a `click` event; set `disabled` to make it inert, `is-loading` to show a spinner and block activation, `type=\"submit\"|\"reset\"` to drive the owning form, and slot an `icon` for a leading glyph.",
    sourceSnippet: `<box-button label="Save" tone="primary"></box-button>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Visible button text." },
      { kind: "attribute", name: "tone", type: '"primary" | "neutral" | "danger"', description: "Visual emphasis." },
      { kind: "attribute", name: "size", type: '"small" | "large"', description: "Compact / roomy size; omit for default." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the button inert." },
      { kind: "attribute", name: "is-loading", type: "boolean", description: "Shows a spinner and blocks activation (stays focusable)." },
      { kind: "attribute", name: "type", type: '"button" | "submit" | "reset"', description: "Submit or reset the owning form." },
      { kind: "slot", name: "icon", type: "slot", description: "Leading 16px icon before the label." },
      { kind: "event", name: "click", description: "Fired when the button is activated." },
    ],
  },
  variants: [
    { name: "Primary", html: `<box-button label="Save" tone="primary"></box-button>` },
    { name: "Neutral", html: `<box-button label="Cancel" tone="neutral"></box-button>` },
    { name: "Danger", html: `<box-button label="Delete" tone="danger"></box-button>` },
    { name: "Small", html: `<box-button label="Small" tone="primary" size="small"></box-button>` },
    { name: "Loading", html: `<box-button label="Saving" tone="primary" is-loading></box-button>` },
    { name: "With icon", html: `<box-button label="Add" tone="neutral"><svg slot="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2"/></svg></box-button>` },
    { name: "Disabled", html: `<box-button label="Disabled" tone="primary" disabled></box-button>` },
  ],
};

export default button;
