import type { StoryModule } from "../metadata.js";

const chip: StoryModule = {
  title: "Components/Feedback/Chip",
  meta: {
    id: "chip",
    tag: "box-chip",
    shortDescription: "A compact, optionally removable tag.",
    docsDescription: "A small token for a selected value or filter. Emits `remove` with its `value` when dismissed.",
    sourceSnippet: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Chip text." },
      { kind: "attribute", name: "tone", type: '"brand" | "neutral"', description: "Visual emphasis." },
      { kind: "attribute", name: "removable", type: "boolean", description: "Shows a remove affordance." },
      { kind: "attribute", name: "value", type: "string", description: "Payload emitted on remove." },
      { kind: "event", name: "remove", description: "Fired with `{ value }` when the chip is dismissed." },
    ],
  },
  variants: [
    { name: "Brand removable", html: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>` },
    { name: "Neutral removable", html: `<box-chip label="Legal" removable value="legal"></box-chip>` },
    { name: "Static", html: `<box-chip label="Read only" tone="neutral"></box-chip>` },
  ],
};

export default chip;
