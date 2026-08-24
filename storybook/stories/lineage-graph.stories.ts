import type { StoryModule } from "../metadata.js";

const lineageGraph: StoryModule = {
  title: "Patterns/Lineage/Lineage Graph",
  meta: {
    id: "lineage-graph",
    tag: "box-lineage-graph",
    shortDescription: "Clause provenance DAG with deviation-toned edges, pairing with the diff viewer.",
    docsDescription:
      "The 'show me every executed contract that deviates from clause 4.2, and what the deviation is' surface: source clause → template versions → executed contracts, laid out by the versions pattern's shared graph engine. Each parent link carries a deviation severity (none/minor/major) that tones its SVG edge. Every node is an HTML button emitting node-selected with roving arrow-key focus, and every derivation edge is also a per-row chip button emitting edge-selected with the parent/child pair — the diff viewer's input — so edge activation needs no SVG hit targets.",
    sourceSnippet: `<box-lineage-graph heading="Clause 4.2 lineage"></box-lineage-graph>`,
    referenceRows: [
      { kind: "attribute", name: "arrows", type: "'none' | 'start' | 'end' | 'both'", description: "Which ends of each edge carry an arrowhead. Defaults to `end` — the head on the derived node, matching the direction the layout builds edges in. An unknown value falls back to `end` rather than silently dropping the direction." },
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "nodes", type: "json", description: "LineageNode records; parent links carry deviation + note." },
      { kind: "property", name: "nodes", type: "LineageNode[]", description: "Property form of the provenance DAG." },
      { kind: "event", name: "node-selected", description: "A node button was activated." },
      { kind: "event", name: "edge-selected", description: "A derivation chip was activated — detail carries parent, child, deviation, and note." },
    ],
  },
  variants: [
    {
      name: "Clause 4.2 estate",
      html: `<box-lineage-graph heading="Clause 4.2 lineage"></box-lineage-graph>`,
      note: "Two templates derive from the clause (one with a minor GDPR annex); MSA_Acme carries a major liability-cap deviation.",
    },
  ],
};

export default lineageGraph;
