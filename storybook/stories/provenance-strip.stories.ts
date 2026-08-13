import type { StoryModule } from "../metadata.js";

const provenanceStrip: StoryModule = {
  title: "Patterns/Lineage/Provenance Strip",
  meta: {
    id: "provenance-strip",
    tag: "box-provenance-strip",
    shortDescription: "Linear ancestry chips for record headers — the high-frequency lineage sibling.",
    docsDescription:
      "The cheap companion to box-lineage-graph: a linear ancestry strip (Library clause v5 → Template 2026 → MSA_Acme §4.2) for record headers and the sidebar. It reads the same LineageNode topology contract, renders the chain oldest-first with the newest entry marked current, and emits node-selected on chip activation. Branched input degrades to topological order.",
    sourceSnippet: `<box-provenance-strip></box-provenance-strip>`,
    referenceRows: [
      { kind: "attribute", name: "nodes", type: "json", description: "LineageNode records forming the ancestry chain." },
      { kind: "property", name: "nodes", type: "LineageNode[]", description: "Property form of the chain." },
      { kind: "event", name: "node-selected", description: "An ancestry chip was activated." },
    ],
  },
  variants: [
    {
      name: "Record header ancestry",
      html: `<box-provenance-strip></box-provenance-strip>`,
      note: "Clause → template → executed contract, newest marked current.",
    },
  ],
};

export default provenanceStrip;
