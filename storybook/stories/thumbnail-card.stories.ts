import type { StoryModule } from "../metadata.js";

const thumb = `<div slot="thumbnail" style="width:100%;height:100%;display:grid;place-items:center;font-size:32px">📄</div>`;

const thumbnailCard: StoryModule = {
  title: "Components/Collections/Thumbnail Card",
  meta: {
    id: "thumbnail-card",
    tag: "box-thumbnail-card",
    shortDescription: "A rich file/grid card with a thumbnail and details.",
    docsDescription:
      "A gallery card: a thumbnail slot above a details row (title, subtitle, optional icon and action). Set `interactive` to make the whole card a keyboard-activated button that emits `activate`.",
    sourceSnippet: `<box-thumbnail-card title="Quarterly Plan.pdf" subtitle="PDF · 2.4 MB" interactive>${thumb}</box-thumbnail-card>`,
    referenceRows: [
      { kind: "attribute", name: "title", type: "string", description: "Card title (also the accessible name when interactive)." },
      { kind: "attribute", name: "subtitle", type: "string", description: "Secondary line under the title." },
      { kind: "attribute", name: "interactive", type: "boolean", description: "Make the card a focusable button that emits `activate`." },
      { kind: "attribute", name: "highlight-on-hover", type: "boolean", description: "Raise a hover shadow without making it a button." },
      { kind: "slot", name: "thumbnail", type: "slot", description: "The visual (image or icon) shown at the top." },
      { kind: "slot", name: "icon", type: "slot", description: "Small leading icon in the details row." },
      { kind: "slot", name: "action", type: "slot", description: "Trailing action (e.g. an overflow menu button)." },
      { kind: "event", name: "activate", type: "CustomEvent", description: "Fires on click/Enter/Space when interactive." },
    ],
  },
  variants: [
    {
      name: "Interactive",
      html: `<box-thumbnail-card title="Quarterly Plan.pdf" subtitle="PDF · 2.4 MB" interactive style="width:220px">${thumb}</box-thumbnail-card>`,
    },
    {
      name: "Static",
      html: `<box-thumbnail-card title="Brand Guidelines.pdf" subtitle="PDF · 5.1 MB" highlight-on-hover style="width:220px">${thumb}</box-thumbnail-card>`,
    },
  ],
};

export default thumbnailCard;
