import type { StoryModule } from "../metadata.js";

const versionGraph: StoryModule = {
  title: "Patterns/Versions/Version Graph",
  meta: {
    id: "version-graph",
    tag: "box-version-graph",
    shortDescription: "Git-network rendering of a version history — branch and merge lanes from a pure layout engine.",
    docsDescription:
      "The visual layer of the versions surface, depicted the way git networks render branches and merges: computeVersionGraphLayout assigns lanes in topological order (first child continues its parent's lane, siblings branch to the lowest free lane, merges release lanes for reuse) and the shell draws SVG curves under one HTML button per node, so activation and focus stay native. Click emits version-selected; a modified click (Shift/Ctrl/Meta) or toggleCompare() pairs two nodes into compare-requested. Malformed topology degrades with warnings instead of throwing.",
    sourceSnippet: `<box-version-graph heading="Version graph"></box-version-graph>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "versions", type: "json", description: "Same VersionNode records as box-version-list." },
      { kind: "property", name: "versions", type: "VersionNode[]", description: "Property form of the history. The toggleCompare(id) method drives host-side compare pairing." },
      { kind: "event", name: "version-selected", description: "A node button was activated." },
      { kind: "event", name: "compare-requested", description: "Two nodes paired — baseId is the older side." },
    ],
  },
  variants: [
    {
      name: "Branch and merge",
      html: `<box-version-graph heading="Version graph"></box-version-graph>`,
      note: "The redline branch takes a side lane and merges back as v3.0; lanes are released for reuse after the merge.",
    },
  ],
};

export default versionGraph;
