import type { StoryModule } from "../metadata.js";

const linkButton: StoryModule = {
  title: "Components/Actions/Link Button",
  meta: {
    id: "link-button",
    tag: "box-link-button",
    shortDescription: "A button-styled link for navigation actions.",
    docsDescription:
      "Renders an anchor with Box button tones. Requires a safe `href`; the accessible name comes from `label`.",
    sourceSnippet: `<box-link-button label="Open docs" href="https://developer.box.com" tone="primary"></box-link-button>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Visible link text / accessible name." },
      { kind: "attribute", name: "href", type: "string", description: "Destination URL (http(s), mailto, or relative)." },
      { kind: "attribute", name: "tone", type: '"primary" | "neutral" | "danger"', description: "Visual emphasis." },
      { kind: "attribute", name: "target", type: "string", description: "Anchor target (e.g. _blank); _blank auto-adds a safe rel." },
      { kind: "attribute", name: "rel", type: "string", description: "Explicit rel (defaults to noopener noreferrer for _blank)." },
      { kind: "slot", name: "(default)", type: "slot", description: "Rich link content, replacing the label text." },
    ],
  },
  variants: [
    { name: "Primary", html: `<box-link-button label="Open docs" href="https://developer.box.com" tone="primary"></box-link-button>` },
    { name: "Neutral", html: `<box-link-button label="Learn more" href="/docs" tone="neutral"></box-link-button>` },
    { name: "New tab", html: `<box-link-button label="Open the Box API reference" href="https://developer.box.com" target="_blank"></box-link-button>` },
  ],
};

export default linkButton;
