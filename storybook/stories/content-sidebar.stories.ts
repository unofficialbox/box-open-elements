import type { StoryModule } from "../metadata.js";

const contentSidebar: StoryModule = {
  title: "Patterns/Content Sidebar/Content Sidebar",
  meta: {
    id: "content-sidebar",
    tag: "box-content-sidebar",
    shortDescription: "Tabbed details/activity/metadata/versions shell composed over box-tabs with slot-fed panels.",
    docsDescription:
      "The sidebar is pure composition: box-tabs supplies the ARIA tabs machinery, and every panel comes from the host through a named slot — box-item-details-panel, box-metadata-inspector, an activity feed, or your own element. A tab's id doubles as its slot name, so custom tabs are first-class: declare them in the tabs attribute and slot matching content. By default only tabs with slotted content render, so the same element scales from a details-only panel to the full upstream sidebar.",
    sourceSnippet: `<box-content-sidebar heading="Quarterly Plan.pdf" collapsible>
  <box-item-details-panel slot="details" heading="Quarterly Plan.pdf"></box-item-details-panel>
  <box-metadata-inspector slot="metadata" heading="Metadata"></box-metadata-inspector>
</box-content-sidebar>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Names the complementary landmark and the tab strip." },
      { kind: "attribute", name: "tabs", type: "json", description: "Explicit [{id,label}] configuration; overrides slot detection, [] renders no tabs." },
      { kind: "attribute", name: "active-tab", type: "string", description: "Reflected current tab; falls back to the first tab when invalid." },
      { kind: "attribute", name: "collapsible", type: "boolean", description: "Renders the Expand/Collapse toggle." },
      { kind: "attribute", name: "collapsed", type: "boolean", description: "Hides the tab body while collapsed." },
      { kind: "slot", name: "details", description: "Details panel content (default tab 1)." },
      { kind: "slot", name: "activity", description: "Activity feed content (default tab 2)." },
      { kind: "slot", name: "metadata", description: "Metadata panel content (default tab 3)." },
      { kind: "slot", name: "versions", description: "Version history content (default tab 4; surface not yet built)." },
      { kind: "event", name: "tab-changed", description: "User switched tabs — detail carries the tabId." },
      { kind: "event", name: "collapsed-changed", description: "Collapse toggle used — detail carries the collapsed state." },
    ],
  },
  variants: [
    {
      name: "Slot-resolved tabs",
      html: `<box-content-sidebar heading="Quarterly Plan.pdf" collapsible>
  <box-item-details-panel slot="details" heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" status="Shared"></box-item-details-panel>
  <box-metadata-inspector slot="metadata" heading="Metadata"></box-metadata-inspector>
</box-content-sidebar>`,
      note: "Only the details and metadata tabs render — activity and versions have no slotted content here.",
    },
  ],
};

export default contentSidebar;
