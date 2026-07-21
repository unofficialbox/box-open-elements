import type { StoryModule } from "../metadata.js";

const tooltip: StoryModule = {
  title: "Components/Overlays/Tooltip",
  meta: {
    id: "tooltip",
    tag: "box-tooltip",
    shortDescription: "A short hover/focus hint for a control.",
    docsDescription:
      "Associates a concise `label` tip with a trigger. The tip is positioned as a viewport-fixed overlay (via the shared `foundations/overlay` primitive), so it escapes ancestor `overflow: hidden` and flips/shifts to stay on-screen. Set `placement` (e.g. `top-center`, `right-start`) to steer it, `theme` (`error`, `callout`) to recolor it, and slot rich content into `content` for image or multi-line tips. Use `open` to force visibility in demos.",
    sourceSnippet: `<box-tooltip label="Rename" open trigger-label="More"></box-tooltip>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Tooltip text." },
      { kind: "attribute", name: "placement", type: "string", description: "Preferred side/align, e.g. bottom-center, top-start, right-center. Default bottom-center." },
      { kind: "attribute", name: "theme", type: "string", description: "Visual theme: default (dark), error, or callout (light)." },
      { kind: "attribute", name: "trigger-label", type: "string", description: "Accessible name for the demo trigger." },
      { kind: "attribute", name: "open", type: "boolean", description: "Forces the tooltip open." },
      { kind: "slot", name: "content", type: "slot", description: "Rich tip body (image, multiple lines) shown after the label." },
      { kind: "event", name: "open-changed", type: "CustomEvent", description: "Emitted when visibility changes." },
    ],
  },
  variants: [
    { name: "Open", html: `<box-tooltip label="Rename this item" open trigger-label="More actions"></box-tooltip>` },
    { name: "Closed", html: `<box-tooltip label="Rename this item" trigger-label="More actions"></box-tooltip>` },
    { name: "Placement: top", html: `<box-tooltip label="Appears above the trigger" placement="top-center" open trigger-label="More actions"></box-tooltip>` },
    { name: "Error theme", html: `<box-tooltip label="This field is required" theme="error" open trigger-label="Field help"></box-tooltip>` },
    { name: "Callout theme", html: `<box-tooltip label="Rich hint on a light surface" theme="callout" open trigger-label="More info"></box-tooltip>` },
  ],
};

export default tooltip;
