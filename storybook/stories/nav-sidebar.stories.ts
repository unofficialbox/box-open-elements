import type { StoryModule } from "../metadata.js";

const navSidebar: StoryModule = {
  title: "Components/Layout/Nav Sidebar",
  meta: {
    id: "nav-sidebar",
    tag: "box-nav-sidebar",
    shortDescription: "A labelled, collapsible navigation rail for workspace shells.",
    docsDescription:
      "Slot header, navigation rows, and footer content; pair icon/label spans with `data-nav-icon` and `data-nav-label` for collapsed rails. Nav rows are your own light-DOM anchors, so the common asks are host markup, not component API: **active item** — set `aria-current=\"page\"` on the active link and style `[aria-current=\"page\"]`; **badges** — drop a `box-badge` inside the row after the label. While collapsed the rail mirrors each row's label onto `aria-label` and `title` (hover tooltip) so icon-only rows keep their accessible names — host-authored names are never overwritten. **Rail to drawer on phones** is a composition: render the same `box-nav-sidebar` inside a `box-drawer` (`position=\"left\"`), which is already full-screen under 640px.",
    sourceSnippet: `<box-nav-sidebar label="Workspace"><button type="button" aria-label="All Files"><span data-nav-icon>A</span><span data-nav-label>All Files</span></button></box-nav-sidebar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible navigation label." },
      { kind: "attribute", name: "collapsed", type: "boolean", description: "Shrinks the rail and exposes the icon-strip state." },
      { kind: "slot", name: "header", description: "Branding or sidebar toggle content." },
      { kind: "slot", name: "default", description: "Navigation anchors or buttons. Slot a [data-nav-group] element as a section header and <hr> as a divider for grouped nav." },
      { kind: "slot", name: "footer", description: "Footer/status content." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<style>
  #demo-nav-sidebar [data-nav-label] { display: var(--boe-nav-label-display, inline); }
  #demo-nav-sidebar [data-nav-icon] { inline-size: 1.1rem; text-align: center; }
</style>
<box-nav-sidebar label="Workspace" id="demo-nav-sidebar">
  <box-sidebar-toggle-button slot="header" controls="demo-nav-sidebar" label="Collapse navigation"></box-sidebar-toggle-button>
  <button type="button" aria-label="All Files"><span data-nav-icon aria-hidden="true">A</span><span data-nav-label>All Files</span></button>
  <button type="button" aria-label="Recents"><span data-nav-icon aria-hidden="true">R</span><span data-nav-label>Recents</span></button>
  <button type="button" aria-label="Synced"><span data-nav-icon aria-hidden="true">S</span><span data-nav-label>Synced</span></button>
  <button type="button" aria-label="Trash"><span data-nav-icon aria-hidden="true">T</span><span data-nav-label>Trash</span></button>
  <span slot="footer">2.4 GB of 10 GB used</span>
</box-nav-sidebar>`,
      note: "Wire the toggle event to `collapsed` in host code; labels hide through `--boe-nav-label-display`.",
    },
  ],
};

export default navSidebar;
