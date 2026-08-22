import type { StoryModule } from "../metadata.js";

const DOCUMENTS = `  <div slot="left">
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed the fees paid in
       the twelve (12) months preceding the claim.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of California.</p>
  </div>
  <div slot="right">
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed two times (2x) the
       fees paid in the twelve (12) months preceding the claim.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of New York.</p>
    <h4>4.6 Assignment</h4>
    <p>Neither party may assign without prior written consent.</p>
  </div>`;

const compareView: StoryModule = {
  title: "Patterns/Diff/Compare View",
  meta: {
    id: "compare-view",
    tag: "box-compare-view",
    shortDescription: "Scroll-locked side-by-side panes for doc-vs-doc review.",
    docsDescription:
      "The comparison shell for the cases `box-diff-viewer` cannot serve, where the two things being compared are rendered documents rather than lines of text. `mapScrollPosition` is pure and DOM-free, so the mapping is testable without a layout engine and a host can reuse it to drive its own panes. Sync is **proportional** by default — mapping by fraction of the scrollable range is the only sane behaviour when the documents are different lengths, since matching pixel offsets would run the shorter one out long before the longer one finished; **absolute** mode keeps the same pixel offset, for two renderings of the same document where proportional mapping would slowly drift them apart. Both degenerate cases resolve to 0 rather than NaN: a target that cannot scroll has nowhere to go, and a source that cannot scroll carries no position to map. The subtle part is the feedback loop — scrolling one pane moves the other, whose own scroll event would scroll the first back — so each programmatic scroll marks the pane it is about to move and that pane's next scroll event is swallowed, with the mark dropped immediately when the assignment does not actually move anything, since no event will arrive and a stale mark would eat the user's next real scroll.",
    sourceSnippet: `<box-compare-view left-label="Before" right-label="After"></box-compare-view>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Toolbar title and the frame's accessible name. Defaults to 'Compare'." },
      { kind: "attribute", name: "left-label", type: "string", description: "Names the left pane's region. Defaults to 'Before'." },
      { kind: "attribute", name: "right-label", type: "string", description: "Names the right pane's region. Defaults to 'After'." },
      { kind: "attribute", name: "sync", type: "string", description: "Scroll lock; on unless set to 'off'." },
      { kind: "attribute", name: "sync-mode", type: "string", description: "'proportional' (default) maps by fraction of range; 'absolute' keeps the same pixel offset." },
      { kind: "slot", name: "left", description: "Content of the left pane." },
      { kind: "slot", name: "right", description: "Content of the right pane." },
      { kind: "event", name: "sync-toggled", description: "The lock was toggled from the toolbar — detail carries `sync`." },
    ],
  },
  variants: [
    {
      name: "Proportional (default)",
      html: `<box-compare-view heading="Clause 4" left-label="Template 2026" right-label="MSA_Acme v4" style="block-size: 18rem">
${DOCUMENTS}
</box-compare-view>`,
      note: "The right document is longer. Proportional mapping keeps both ends aligned.",
    },
    {
      name: "Lock disengaged",
      html: `<box-compare-view heading="Clause 4" left-label="Template 2026" right-label="MSA_Acme v4" sync="off" style="block-size: 18rem">
${DOCUMENTS}
</box-compare-view>`,
      note: "Panes scroll independently; re-engaging the lock realigns them immediately.",
    },
  ],
};

export default compareView;
