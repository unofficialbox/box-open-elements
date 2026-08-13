import type { StoryModule } from "../metadata.js";

const diffViewer: StoryModule = {
  title: "Patterns/Diff/Diff Viewer",
  meta: {
    id: "diff-viewer",
    tag: "box-diff-viewer",
    shortDescription: "Side-by-side and unified text comparison over a pure line+word diff engine.",
    docsDescription:
      "The engine is DOM-free and deterministic: line-level LCS with prefix/suffix trimming (a DP-size cap degrades to whole-replacement on hostile input), similar removed/added lines paired into changed rows, and word-level segments with whitespace coalescing. The shell renders split and inline modes from one table — synchronized scrolling by construction — with per-document line-number gutters, del/ins word semantics, a stats chip, and prev/next change navigation.",
    sourceSnippet: `<box-diff-viewer heading="Clause 4.2" before-label="Template 2026" after-label="MSA_Acme"></box-diff-viewer>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "mode", type: "string", description: "`split` (side-by-side, default) or `inline` (unified)." },
      { kind: "attribute", name: "before-label", type: "string", description: "Left/old document label." },
      { kind: "attribute", name: "after-label", type: "string", description: "Right/new document label." },
      { kind: "attribute", name: "before-text", type: "string", description: "Old text (attribute form)." },
      { kind: "attribute", name: "after-text", type: "string", description: "New text (attribute form)." },
      { kind: "property", name: "beforeText", type: "string", description: "Old text; preferred for multi-line content." },
      { kind: "property", name: "afterText", type: "string", description: "New text; preferred for multi-line content." },
      { kind: "event", name: "change-focused", description: "Prev/next navigation focused a change range." },
    ],
  },
  variants: [
    {
      name: "Template vs executed clause",
      html: `<box-diff-viewer heading="Clause 4.2 — template vs executed" before-label="Template 2026" after-label="MSA_Acme"></box-diff-viewer>`,
      note: "The liability-cap rewording renders as a paired changed row with word-level emphasis.",
    },
  ],
};

export default diffViewer;
