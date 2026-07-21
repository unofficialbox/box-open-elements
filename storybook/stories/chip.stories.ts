import type { StoryModule } from "../metadata.js";

const chip: StoryModule = {
  title: "Components/Feedback/Chip",
  meta: {
    id: "chip",
    tag: "box-chip",
    shortDescription: "A compact, optionally removable tag.",
    docsDescription: "A small token for a selected value or filter. Emits `remove` with its `value` when dismissed. Use `tone` for a status palette (`success`/`warning`/`error`/`info`), `size=\"small\"` for a compact form, and the `icon` slot for a leading glyph.",
    sourceSnippet: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Chip text." },
      { kind: "attribute", name: "tone", type: '"neutral" | "brand" | "info" | "success" | "warning" | "error"', description: "Visual emphasis / status palette." },
      { kind: "attribute", name: "size", type: '"medium" | "small"', description: "Chip size." },
      { kind: "attribute", name: "removable", type: "boolean", description: "Shows a remove affordance." },
      { kind: "attribute", name: "value", type: "string", description: "Payload emitted on remove." },
      { kind: "slot", name: "icon", type: "slot", description: "Leading icon before the label." },
      { kind: "event", name: "remove", description: "Fired with `{ value }` when the chip is dismissed." },
    ],
  },
  variants: [
    { name: "Brand removable", html: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>` },
    { name: "Neutral removable", html: `<box-chip label="Legal" removable value="legal"></box-chip>` },
    { name: "Static", html: `<box-chip label="Read only" tone="neutral"></box-chip>` },
    { name: "Success", html: `<box-chip label="Approved" tone="success"></box-chip>` },
    { name: "Warning", html: `<box-chip label="Expiring" tone="warning"></box-chip>` },
    { name: "Error", html: `<box-chip label="Blocked" tone="error"></box-chip>` },
    { name: "Small with icon", html: `<box-chip label="Verified" tone="success" size="small"><svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 11L3 7.5l1-1 2.5 2.5L12 3.5l1 1z" fill="currentColor"/></svg></box-chip>` },
  ],
};

export default chip;
