import type { StoryModule } from "../metadata.js";
import { iconXBatsu } from "../../src/foundations/icons/glyphs/index.js";

const iconButton: StoryModule = {
  title: "Components/Actions/Icon Button",
  meta: {
    id: "icon-button",
    tag: "box-icon-button",
    shortDescription: "An icon-only action with an accessible label.",
    docsDescription: 'An icon action named by `label`. Supply a library glyph SVG node with `slot="icon"` without registering a design system; the slot takes precedence over the registered `icon` or escaped text fallback. `size="small"` renders a 24px button and `variant="quiet"` removes resting chrome while keeping hover and keyboard focus visible.',
    sourceSnippet: `<box-icon-button icon="+" label="Add item"></box-icon-button>`,
    referenceRows: [
      { kind: "slot", name: "icon", type: "SVG node", description: "Explicit glyph content, taking precedence over the icon fallback." },
      { kind: "attribute", name: "icon", type: "string", description: "Registered icon name or escaped text fallback." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible name (visually hidden)." },
      { kind: "attribute", name: "size", type: "medium | small", description: "Default 2rem button or 24px compact border box." },
      { kind: "attribute", name: "variant", type: "default | quiet", description: "Quiet removes resting border, surface and shadow." },
      { kind: "attribute", name: "tone", type: "secondary | primary | danger", description: "Action color, also supported by quiet buttons." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the button inert." },
    ],
  },
  variants: [
    { name: "Add", html: `<box-icon-button icon="+" label="Add item"></box-icon-button>` },
    { name: "Settings", html: `<box-icon-button icon="gear" label="Settings"></box-icon-button>` },
    { name: "Compact quiet glyph", html: `<box-icon-button size="small" variant="quiet" label="Remove variable">${iconXBatsu.replace("<svg", '<svg slot="icon"')}</box-icon-button>` },
    { name: "Disabled", html: `<box-icon-button icon="+" label="Add item" disabled></box-icon-button>` },
  ],
};

export default iconButton;
