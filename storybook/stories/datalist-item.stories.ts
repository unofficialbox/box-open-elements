import type { StoryModule } from "../metadata.js";

const datalistItem: StoryModule = {
  title: "Components/Collections/Datalist Item",
  meta: {
    id: "datalist-item",
    tag: "box-datalist-item",
    shortDescription: "A selectable row for picker lists.",
    docsDescription: "Show a labelled row with optional meta, icon, and selected state.",
    sourceSnippet: `<box-datalist-item label="Quarterly Plan.pdf" meta="PDF · 2.1 MB" icon="P" value="123"></box-datalist-item>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Primary row label." },
      { kind: "attribute", name: "meta", type: "string", description: "Secondary meta line." },
      { kind: "attribute", name: "icon", type: "string", description: "Compact icon glyph or text." },
      { kind: "attribute", name: "value", type: "string", description: "Row value." },
      { kind: "attribute", name: "selected", type: "boolean", description: "Marks the row selected." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-datalist-item label="Quarterly Plan.pdf" meta="PDF · 2.1 MB" icon="P" value="123"></box-datalist-item>` },
    { name: "Selected", html: `<box-datalist-item label="Marketing" meta="Folder · 18 items" icon="M" value="42" selected></box-datalist-item>` },
  ],
};

export default datalistItem;
