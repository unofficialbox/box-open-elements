import type { StoryModule } from "../metadata.js";

const badgeable: StoryModule = {
  title: "Components/Feedback/Badgeable",
  meta: {
    id: "badgeable",
    tag: "box-badgeable",
    shortDescription: "Overlays badges on the corners of its content.",
    docsDescription:
      "A wrapper that pins badges to the corners of its subject. The subject goes in the default slot; each corner is a named slot: `top-left`, `top-right`, `bottom-left`, `bottom-right`. Corners with no content are hidden.",
    sourceSnippet: `<box-badgeable>\n  <box-avatar name="Morgan Lee" size="48"></box-avatar>\n  <box-badge slot="bottom-right" label="3" tone="brand"></box-badge>\n</box-badgeable>`,
    referenceRows: [
      { kind: "slot", name: "(default)", type: "slot", description: "The badged subject (avatar, thumbnail, icon…)." },
      { kind: "slot", name: "top-left", type: "slot", description: "Badge pinned to the top-left corner." },
      { kind: "slot", name: "top-right", type: "slot", description: "Badge pinned to the top-right corner." },
      { kind: "slot", name: "bottom-left", type: "slot", description: "Badge pinned to the bottom-left corner." },
      { kind: "slot", name: "bottom-right", type: "slot", description: "Badge pinned to the bottom-right corner." },
    ],
  },
  variants: [
    {
      name: "Count badge",
      html: `<box-badgeable>\n  <box-avatar name="Morgan Lee" size="48"></box-avatar>\n  <box-badge slot="bottom-right" label="3" tone="brand"></box-badge>\n</box-badgeable>`,
    },
    {
      name: "Status dot",
      html: `<box-badgeable>\n  <box-avatar name="Alex Kim" size="48"></box-avatar>\n  <box-badge slot="top-right" label="●" tone="success"></box-badge>\n</box-badgeable>`,
    },
  ],
};

export default badgeable;
