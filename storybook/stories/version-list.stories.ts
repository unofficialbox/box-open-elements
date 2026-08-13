import type { StoryModule } from "../metadata.js";

const versionList: StoryModule = {
  title: "Patterns/Versions/Version List",
  meta: {
    id: "version-list",
    tag: "box-version-list",
    shortDescription: "Accessible version history with status tones, compare pairing, and restore/promote intents.",
    docsDescription:
      "The core contract of the versions surface. Rows render in topological newest-first order (parents[] defines the topology, exactly as git does) with kind markers and status tones. Toggling Compare on two rows emits compare-requested with the older side as baseId — the diff viewer's input contract. can-restore / can-promote gate per-row intent buttons (hidden on the current version) for the host's confirm-before-apply flow. box-version-graph renders the same model as a git network; this list is the accessible fallback.",
    sourceSnippet: `<box-version-list heading="Version history" can-restore></box-version-list>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "versions", type: "json", description: "VersionNode records with parents[] topology; each is validated." },
      { kind: "attribute", name: "can-restore", type: "boolean", description: "Shows Restore on non-current rows." },
      { kind: "attribute", name: "can-promote", type: "boolean", description: "Shows Promote on non-current rows." },
      { kind: "property", name: "versions", type: "VersionNode[]", description: "Property form of the history." },
      { kind: "event", name: "version-selected", description: "A row title was activated." },
      { kind: "event", name: "compare-requested", description: "Two rows toggled — detail carries baseId (older) and targetId." },
      { kind: "event", name: "restore-requested", description: "Restore intent for the host's confirm flow." },
      { kind: "event", name: "promote-requested", description: "Promote intent for the host's confirm flow." },
    ],
  },
  variants: [
    {
      name: "Contract history",
      html: `<box-version-list heading="Version history" can-restore></box-version-list>`,
      note: "Majors, a minor, a counterparty redline branch, and the merge that became the current v3.0.",
    },
  ],
};

export default versionList;
