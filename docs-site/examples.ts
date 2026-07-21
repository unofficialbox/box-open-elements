/**
 * Curated live examples per catalog entry. `html` is the canonical usage-first
 * snippet (shown verbatim on the Code tab); `setup` binds rich properties that
 * cannot be expressed as simple attributes. Entries without an example fall
 * back to a bare element with a `label` attribute.
 */
import {
  type InviteCollaboratorsTransport,
  type PresenceTransport,
  type PresenceUser,
  type ShareDataSource,
  type ShareState,
} from "@unofficialbox/box-open-elements";
import {
  contentExplorerChromeHtml,
  contentExplorerChromeNote,
  setupContentExplorerChrome,
} from "./explorer-chrome-demo.js";
import {
  createExplorerDemoTransport,
  setupExplorerAdapter,
} from "./explorer-adapter-demo.js";
import {
  contentExplorerMetadataChromeHtml,
  contentExplorerMetadataChromeNote,
  setupContentExplorerMetadataChrome,
} from "./explorer-metadata-demo.js";
import { boxIconography } from "@unofficialbox/box-open-elements";

/** Inline a Box iconography glyph by name (for slotted demo icons). */
const icon = (name: keyof typeof boxIconography): string =>
  (boxIconography as Record<string, string>)[name] ?? "";

/** Optional return value unsubscribes host listeners when the preview remounts. */
type SetupFn = (root: HTMLElement) => void | (() => void);

export interface ExampleVariant {
  name: string;
  html: string;
  setup?: SetupFn;
  note?: string;
}

export interface ComponentExample {
  html: string;
  setup?: SetupFn;
  note?: string;
  /** Live docs-site variants with setup (preferred over extracted workshop HTML). */
  variants?: ExampleVariant[];
}

/** Re-export for gallery / tests that still import the mock transport by this name. */
export const createMockTransport = createExplorerDemoTransport;

const explorerAdapterSetup =
  (selector: string, options?: { selectItemId?: string; itemId?: string }): SetupFn =>
  root =>
    setupExplorerAdapter(root, selector, {
      selectItemId: options?.selectItemId ?? "123",
      itemId: options?.itemId,
    });

const set = (root: HTMLElement, selector: string, props: Record<string, unknown>): void => {
  const element = root.querySelector(selector) as (HTMLElement & Record<string, unknown>) | null;
  if (!element) return;
  for (const [key, value] of Object.entries(props)) {
    (element as Record<string, unknown>)[key] = value;
  }
};

export const examples: Record<string, ComponentExample> = {
  button: { html: `<box-button label="Save" tone="primary"></box-button>\n<box-button label="Cancel" tone="neutral"></box-button>\n<box-button label="Delete" tone="danger"></box-button>\n<box-button label="Small" size="small"></box-button>\n<box-button label="Disabled" disabled></box-button>` },
  "icon-button": { html: `<box-icon-button icon="+" label="Add item"></box-icon-button>\n<box-icon-button icon="gear" label="Settings"></box-icon-button>` },
  "link-button": { html: `<box-link-button label="Open documentation" href="#"></box-link-button>` },
  "button-group": {
    html: `<box-button-group label="Item actions"></box-button-group>`,
    setup: root => set(root, "box-button-group", {
      options: [
        { label: "Share", value: "share" },
        { label: "Download", value: "download" },
        { label: "Delete", value: "delete" },
      ],
      value: "share",
    }),
  },
  menu: {
    html: `<box-menu label="File actions"></box-menu>`,
    setup: root => set(root, "box-menu", {
      items: [
        { id: "open", label: "Open" },
        { id: "rename", label: "Rename" },
        { id: "move", label: "Move or copy", disabled: true },
      ],
    }),
  },
  "menu-item": { html: `<box-menu-item label="Rename"></box-menu-item>` },
  "segmented-control": {
    html: `<box-segmented-control label="Density"></box-segmented-control>`,
    setup: root => set(root, "box-segmented-control", {
      options: [
        { label: "Comfortable", value: "comfortable" },
        { label: "Compact", value: "compact" },
      ],
      value: "comfortable",
    }),
  },
  card: { html: `<box-card eyebrow="PDF · 2.4 MB" heading="Quarterly Plan.pdf">Updated 2 hours ago by Morgan Lee</box-card>` },
  "thumbnail-card": {
    html: `<box-thumbnail-card title="Quarterly Plan.pdf" subtitle="PDF · 2.4 MB" interactive style="width: 220px">\n  <div slot="thumbnail" style="width:100%;height:100%;display:grid;place-items:center;font-size:32px">📄</div>\n</box-thumbnail-card>`,
  },
  carousel: {
    html: `<box-carousel label="Featured"></box-carousel>`,
    setup: root => set(root, "box-carousel", {
      items: [
        { id: "one", title: "Launch checklist", description: "Everything before go-live." },
        { id: "two", title: "Brand refresh", description: "New tokens and iconography." },
        { id: "three", title: "Q3 planning", description: "Roadmap and staffing." },
      ],
    }),
  },
  "datalist-item": {
    html: `<box-datalist-item label="Quarterly Plan.pdf" meta="PDF · 2.1 MB" icon="P" value="123"></box-datalist-item>\n<box-datalist-item label="Marketing" meta="Folder · 18 items" icon="M" value="42" selected></box-datalist-item>`,
  },
  "draggable-list": {
    html: `<box-draggable-list label="Saved views"></box-draggable-list>`,
    setup: root => set(root, "box-draggable-list", {
      items: [
        { value: "recents", label: "Recents" },
        { value: "shared", label: "Shared with me" },
        { value: "starred", label: "Starred" },
        { value: "trash", label: "Trash" },
      ],
    }),
    note: "Focus a handle, then ArrowUp/ArrowDown (or drag) to reorder.",
  },
  "grid-view": {
    html: `<box-grid-view label="Files"></box-grid-view>`,
    setup: root => set(root, "box-grid-view", {
      items: [
        { value: "123", label: "Quarterly Plan.pdf", meta: "PDF · 2.1 MB", icon: "file-document" },
        { value: "124", label: "Brand Guidelines.pdf", meta: "PDF · 5.4 MB", icon: "file-document" },
        { value: "42", label: "Marketing", meta: "Folder · 18 items", icon: "folder" },
        { value: "125", label: "box.com/launch", meta: "Web link", icon: "link" },
      ],
      value: "123",
    }),
  },
  pagination: { html: `<box-pagination page="2" page-size="25" total-items="220"></box-pagination>` },
  table: {
    html: `<box-table label="Files" selection-mode="multiple"></box-table>`,
    setup: root => set(root, "box-table", {
      columns: [
        { key: "name", label: "Name", sortable: true },
        { key: "owner", label: "Owner" },
        { key: "modified", label: "Modified", align: "end" },
      ],
      rows: [
        { id: "123", cells: { name: "Quarterly Plan.pdf", owner: "Morgan Lee", modified: "Jul 10, 2026" } },
        { id: "124", cells: { name: "Brand Guidelines.pdf", owner: "Alex Kim", modified: "Jun 2, 2026" } },
        { id: "42", cells: { name: "Marketing", owner: "Morgan Lee", modified: "May 30, 2026" } },
      ],
    }),
    note: "Click to select; Ctrl/Cmd-click to toggle, Shift-click for a range. Arrow keys + Space navigate and select.",
  },
  tree: {
    html: `<box-tree label="Folders"></box-tree>`,
    setup: root => set(root, "box-tree", {
      items: [
        { label: "Marketing", value: "marketing", children: [
          { label: "Brand", value: "brand" },
          { label: "Events", value: "events" },
        ] },
        { label: "Finance", value: "finance" },
      ],
      value: "marketing",
    }),
  },
  "tree-grid": {
    html: `<box-tree-grid label="Folders"></box-tree-grid>`,
    setup: root => set(root, "box-tree-grid", {
      columns: [
        { key: "name", label: "Name" },
        { key: "owner", label: "Owner" },
      ],
      items: [
        { value: "marketing", label: "Marketing", cells: ["Morgan Lee"], children: [
          { value: "brand", label: "Brand", cells: ["Alex Kim"] },
        ] },
        { value: "finance", label: "Finance", cells: ["Sam Rivera"] },
      ],
    }),
    note: "Column/item shapes follow the component's `columns` and `items` properties.",
  },
  alert: { html: `<box-alert heading="Upload complete" message="24 files were added to Marketing." tone="success"></box-alert>` },
  badge: { html: `<box-badge label="Beta"></box-badge>\n<box-badge label="Error" tone="error"></box-badge>` },
  badgeable: {
    html: `<box-badgeable>\n  <box-avatar name="Morgan Lee" size="48"></box-avatar>\n  <box-badge slot="bottom-right" label="3" tone="brand"></box-badge>\n</box-badgeable>`,
  },
  chip: { html: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>\n<box-chip label="Legal" removable value="legal"></box-chip>` },
  "empty-state": { html: `<box-empty-state heading="No results" message="Try a different search or clear the filters."></box-empty-state>` },
  "error-mask": { html: `<box-error-mask heading="Couldn't load files" message="Something went wrong while loading this folder." action-label="Retry"></box-error-mask>` },
  "help-text": { html: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>` },
  nudge: { html: `<box-nudge heading="Try grid view" message="Preview files as thumbnails from the view switcher." action-label="Show me"></box-nudge>` },
  "progress-bar": { html: `<box-progress-bar label="Storage used" value="64"></box-progress-bar>` },
  "progress-ring": { html: `<box-progress-ring label="Sync" value="80"></box-progress-ring>` },
  "progress-steps": {
    html: `<box-progress-steps label="Migration"></box-progress-steps>`,
    setup: root => set(root, "box-progress-steps", {
      items: [
        { label: "Scan", value: "scan" },
        { label: "Copy", value: "copy", description: "In progress" },
        { label: "Verify", value: "verify" },
      ],
      value: "copy",
    }),
  },
  skeleton: { html: `<box-skeleton width="320px" height="18px"></box-skeleton>` },
  spinner: { html: `<box-spinner label="Loading"></box-spinner>` },
  toast: {
    html: `<div style="display:grid;gap:0.5rem;justify-items:start;max-inline-size:min(100%,24rem)">
  <box-toast open tone="info" message="Link copied — anyone in the company can view."></box-toast>
  <box-toast open tone="success" message="Upload complete."></box-toast>
  <box-toast open tone="warning" message="Connection is slow — retrying."></box-toast>
</div>`,
    variants: [
      {
        name: "Stacked",
        html: `<div style="display:grid;gap:0.5rem;justify-items:start;max-inline-size:min(100%,24rem)">
  <box-toast open tone="info" message="Link copied — anyone in the company can view."></box-toast>
  <box-toast open tone="success" message="Upload complete."></box-toast>
  <box-toast open tone="warning" message="Connection is slow — retrying."></box-toast>
</div>`,
        note: "Host stacks toasts in normal flow — the element is not position:fixed.",
      },
      {
        name: "Success",
        html: `<box-toast open message="Upload complete" tone="success"></box-toast>`,
      },
      {
        name: "Error",
        html: `<box-toast open message="Upload failed" tone="error"></box-toast>`,
      },
    ],
  },
  "drop-zone": { html: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>` },
  checkbox: { html: `<box-checkbox label="Enable shared links" checked></box-checkbox>` },
  "checkbox-group": {
    html: `<box-checkbox-group label="Permissions"></box-checkbox-group>`,
    setup: root => set(root, "box-checkbox-group", {
      options: [
        { label: "Can view", value: "view" },
        { label: "Can edit", value: "edit" },
        { label: "Can share", value: "share" },
      ],
      value: ["view", "edit"],
    }),
  },
  "color-picker": {
    html: `<box-color-picker label="Brand color" value="#0061d5"></box-color-picker>`,
    setup: root => set(root, "box-color-picker", {
      swatches: [
        { value: "#0061d5", label: "Box blue" },
        { value: "#26c281", label: "Success" },
        { value: "#f5b31b", label: "In progress" },
        { value: "#ed3757", label: "Error" },
      ],
    }),
  },
  combobox: {
    html: `<box-combobox label="File type"></box-combobox>`,
    setup: root => set(root, "box-combobox", {
      options: [
        { label: "PDF", value: "pdf" },
        { label: "Document", value: "doc" },
        { label: "Spreadsheet", value: "xls" },
      ],
    }),
  },
  calendar: {
    html: `<box-calendar value="2026-07-18" month="2026-07" today="2026-07-15"></box-calendar>`,
  },
  "date-field": { html: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>` },
  dropdown: {
    html: `<box-dropdown label="Sort by"></box-dropdown>`,
    setup: root => set(root, "box-dropdown", {
      items: [
        { id: "name", label: "Name" },
        { id: "modified", label: "Modified" },
        { id: "size", label: "Size" },
      ],
      value: "modified",
    }),
  },
  "dual-listbox": {
    html: `<box-dual-listbox label="Report fields"></box-dual-listbox>`,
    setup: root => set(root, "box-dual-listbox", {
      options: [
        { label: "File name", value: "name" },
        { label: "Owner", value: "owner" },
        { label: "Modified", value: "modified" },
        { label: "Size", value: "size" },
      ],
      value: ["name", "owner"],
    }),
  },
  "multi-select": {
    html: `<box-multi-select label="Collaborators"></box-multi-select>`,
    setup: root => set(root, "box-multi-select", {
      options: [
        { label: "Morgan Lee", value: "morgan" },
        { label: "Alex Kim", value: "alex" },
        { label: "Sam Rivera", value: "sam" },
      ],
      value: ["morgan", "alex"],
    }),
  },
  "number-input": { html: `<box-number-input label="Page size" value="25" min="1" max="100"></box-number-input>` },
  "radio-group": {
    html: `<box-radio-group label="Access level"></box-radio-group>`,
    setup: root => set(root, "box-radio-group", {
      options: [
        { label: "Company", value: "company" },
        { label: "Invited people only", value: "invited" },
      ],
      value: "company",
    }),
  },
  fieldset: {
    html: `<box-fieldset label="Shipping address" description="Where should we ship your order?">
  <box-text-field label="Street"></box-text-field>
  <box-text-field label="City"></box-text-field>
</box-fieldset>`,
  },
  "category-selector": {
    html: `<box-category-selector label="Filter by type"></box-category-selector>`,
    setup: root => set(root, "box-category-selector", {
      options: [
        { value: "all", label: "All" },
        { value: "docs", label: "Documents" },
        { value: "media", label: "Media" },
        { value: "links", label: "Links" },
      ],
      value: "all",
    }),
  },
  "pill-cloud": {
    html: `<box-pill-cloud label="File type"></box-pill-cloud>`,
    setup: root => set(root, "box-pill-cloud", {
      options: [
        { value: "pdf", label: "PDF" },
        { value: "doc", label: "Documents" },
        { value: "img", label: "Images" },
        { value: "video", label: "Video" },
        { value: "audio", label: "Audio" },
      ],
      value: ["pdf", "img"],
    }),
  },
  "pill-selector-dropdown": {
    html: `<box-pill-selector-dropdown label="Collaborators" placeholder="Add person"></box-pill-selector-dropdown>`,
    setup: root => set(root, "box-pill-selector-dropdown", {
      options: [
        { value: "morgan", label: "Morgan Lee" },
        { value: "alex", label: "Alex Kim" },
        { value: "sam", label: "Sam Patel" },
        { value: "jordan", label: "Jordan Rivera" },
      ],
      value: ["morgan"],
    }),
  },
  "range-slider": { html: `<box-range-slider label="Size range" min="0" max="100"></box-range-slider>` },
  rating: { html: `<box-rating label="Quality" value="4" max="5"></box-rating>` },
  "rich-text-input": { html: `<box-rich-text-input label="Announcement" value="<p>Welcome to the <strong>new</strong> workspace.</p>"></box-rich-text-input>` },
  "search-field": { html: `<box-search-field label="Search files" placeholder="Search files and folders"></box-search-field>` },
  select: {
    html: `<box-select label="Owner"></box-select>`,
    setup: root => set(root, "box-select", {
      options: [
        { label: "Morgan Lee", value: "morgan" },
        { label: "Alex Kim", value: "alex" },
      ],
      value: "morgan",
    }),
  },
  slider: { html: `<box-slider label="Density" value="40" min="0" max="100"></box-slider>` },
  "spin-button": { html: `<box-spin-button label="Quota (GB)" value="50" min="0" max="500"></box-spin-button>` },
  switch: { html: `<box-switch label="Email notifications" checked></box-switch>` },
  "tag-input": {
    html: `<box-tag-input label="Labels" placeholder="Add a label"></box-tag-input>`,
    setup: root => set(root, "box-tag-input", { tags: ["marketing", "q3", "launch"] }),
  },
  "text-area": { html: `<box-text-area label="Notes" placeholder="Add review notes"></box-text-area>` },
  "text-field": { html: `<box-text-field label="Name" value="Quarterly Plan"></box-text-field>` },
  "time-field": { html: `<box-time-field label="Launch time" value="09:30"></box-time-field>` },
  avatar: { html: `<box-avatar name="Morgan Lee"></box-avatar>` },
  persona: { html: `<box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona>` },
  "contact-datalist-item": {
    html: `<box-contact-datalist-item name="Morgan Lee" email="morgan@box.com" value="morgan" selected></box-contact-datalist-item>\n<box-contact-datalist-item name="Alex Kim" email="alex@box.com" value="alex"></box-contact-datalist-item>`,
  },
  "app-shell": {
    html: `<box-app-shell heading="Box Admin" nav-label="Workspace navigation" aside-label="File context">
  <span slot="eyebrow">Enterprise</span>
  <box-button slot="header-actions" label="Invite" tone="primary"></box-button>
  <box-nav-sidebar slot="nav" label="Workspace">
    <button type="button" aria-label="All Files">All Files</button>
    <button type="button" aria-label="Recents">Recents</button>
    <button type="button" aria-label="Trash">Trash</button>
  </box-nav-sidebar>
  <box-card eyebrow="PDF · 2.4 MB" heading="Quarterly Plan.pdf">Updated 2 hours ago by Morgan Lee</box-card>
  <box-item-details-panel slot="aside" heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner='{"name":"Morgan Lee","description":"Enterprise Admin"}' meta='[{"label":"Modified","value":"Jul 10, 2026"}]'></box-item-details-panel>
  <span slot="footer">2.4 GB of 10 GB used</span>
</box-app-shell>`,
  },
  divider: {
    html: `<div style="display:grid;gap:0.75rem;width:min(100%,22rem)">
  <div>
    <strong>Metadata</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Owner, shared status, and last activity.</p>
  </div>
  <box-divider label="Activity"></box-divider>
  <div>
    <strong>Recent comments</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Version history and discussion sit below the rule.</p>
  </div>
</div>`,
    variants: [
      {
        name: "In context",
        html: `<div style="display:grid;gap:0.75rem;width:min(100%,22rem)">
  <div>
    <strong>Metadata</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Owner, shared status, and last activity.</p>
  </div>
  <box-divider label="Activity"></box-divider>
  <div>
    <strong>Recent comments</strong>
    <p style="margin:0.35rem 0 0;color:#6f6f6f;font-size:0.9rem">Version history and discussion sit below the rule.</p>
  </div>
</div>`,
      },
      {
        name: "Labelled",
        html: `<box-divider label="Shared with your team"></box-divider>`,
      },
      {
        name: "Plain",
        html: `<div style="width:min(100%,22rem)"><box-divider></box-divider></div>`,
      },
    ],
  },
  "split-view": {
    html: `<box-split-view label="Master detail" ratio="0.4" resizable>
  <box-grid-view slot="primary" label="Files" value="123" items='[{"value":"123","label":"Quarterly Plan.pdf","meta":"PDF · 2.1 MB","icon":"file-document"},{"value":"124","label":"Brand Guidelines.pdf","meta":"PDF · 5.4 MB","icon":"file-document"},{"value":"42","label":"Marketing","meta":"Folder · 18 items","icon":"folder"}]'></box-grid-view>
  <box-item-details-panel heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner='{"name":"Morgan Lee","description":"Enterprise Admin"}' meta='[{"label":"Modified","value":"Jul 10, 2026"},{"label":"Status","value":"Shared"}]'></box-item-details-panel>
</box-split-view>`,
  },
  "nav-sidebar": {
    html: `<style>
  #demo-nav-sidebar [data-nav-label] { display: var(--boe-nav-label-display, inline); }
  #demo-nav-sidebar [data-nav-icon] { display: inline-grid; place-items: center; inline-size: 1.1rem; block-size: 1.1rem; }
  #demo-nav-sidebar [data-nav-icon] svg { inline-size: 100%; block-size: 100%; display: block; }
</style>
<box-nav-sidebar label="Workspace" id="demo-nav-sidebar">
  <box-sidebar-toggle-button slot="header" controls="demo-nav-sidebar" label="Collapse navigation"></box-sidebar-toggle-button>
  <button type="button" aria-label="All Files"><span data-nav-icon aria-hidden="true">${icon("folder")}</span><span data-nav-label>All Files</span></button>
  <button type="button" aria-label="Recents"><span data-nav-icon aria-hidden="true">${icon("clock1")}</span><span data-nav-label>Recents</span></button>
  <button type="button" aria-label="Synced"><span data-nav-icon aria-hidden="true">${icon("cloud")}</span><span data-nav-label>Synced</span></button>
  <button type="button" aria-label="Starred"><span data-nav-icon aria-hidden="true">${icon("star")}</span><span data-nav-label>Starred</span></button>
  <span slot="footer">2.4 GB of 10 GB used</span>
</box-nav-sidebar>`,
    setup: root => {
      const sidebar = root.querySelector("box-nav-sidebar") as (HTMLElement & { collapsed: boolean }) | null;
      const toggle = root.querySelector("box-sidebar-toggle-button");
      toggle?.addEventListener("toggle", event => {
        if (sidebar) {
          sidebar.collapsed = !(event as CustomEvent<{ expanded: boolean }>).detail.expanded;
        }
      });
    },
    note: "Use buttons (not href=\"#\") so SPA hash routing stays put. Wire `toggle` to `collapsed`.",
  },
  "sidebar-toggle-button": {
    html: `<div style="display:grid;gap:0.65rem;width:min(100%,16rem)">
  <box-sidebar-toggle-button label="Toggle navigation" controls="demo-sidebar-toggle"></box-sidebar-toggle-button>
  <box-nav-sidebar label="Workspace" id="demo-sidebar-toggle">
    <button type="button">Home</button>
    <button type="button">Files</button>
    <button type="button">Shared</button>
    <span slot="footer">2.4 GB of 10 GB used</span>
  </box-nav-sidebar>
</div>`,
    setup: root => {
      const sidebar = root.querySelector("box-nav-sidebar") as (HTMLElement & { collapsed: boolean }) | null;
      const toggle = root.querySelector("box-sidebar-toggle-button");
      toggle?.addEventListener("toggle", event => {
        if (sidebar) {
          sidebar.collapsed = !(event as CustomEvent<{ expanded: boolean }>).detail.expanded;
        }
      });
    },
    note: "Standalone toggle needs a host-wired sidebar — click to collapse the rail below.",
  },
  section: {
    html: `<box-section eyebrow="Workspace" heading="Members" description="People with access to this workspace.">
  <box-button slot="actions" label="Invite" tone="primary"></box-button>
  <box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona>
</box-section>`,
  },
  accordion: {
    html: `<box-accordion label="Details"></box-accordion>`,
    setup: root => set(root, "box-accordion", {
      items: [
        { label: "Properties", value: "props", content: "Owner, size, and classification." },
        { label: "Activity", value: "activity", content: "Recent comments and versions." },
      ],
      value: "props",
    }),
  },
  breadcrumb: {
    html: `<box-breadcrumb label="File path"></box-breadcrumb>`,
    setup: root => set(root, "box-breadcrumb", {
      items: [
        { label: "All Files", value: "0" },
        { label: "Marketing", value: "42" },
        { label: "Brand", value: "77" },
        { label: "2026", value: "88" },
        { label: "Quarterly Plan.pdf", value: "123" },
      ],
    }),
  },
  tabs: {
    html: `<box-tabs label="Views" layout="attached" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"},{"label":"Shared","value":"shared"}]' value="all">\n  <div slot="all" style="padding:12px 0">128 files across every folder.</div>\n  <div slot="recents" style="padding:12px 0">Files you opened this week.</div>\n  <div slot="shared" style="padding:12px 0">Shared with you by collaborators.</div>\n</box-tabs>`,
    variants: [
      {
        name: "Attached",
        html: `<box-tabs label="Views" layout="attached" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"},{"label":"Shared","value":"shared"}]' value="all"><div slot="all" style="padding:12px 0">128 files across every folder.</div><div slot="recents" style="padding:12px 0">Files you opened this week.</div><div slot="shared" style="padding:12px 0">Shared with you by collaborators.</div></box-tabs>`,
      },
      {
        name: "Separated",
        html: `<box-tabs label="Views" layout="separated" options='[{"label":"All files","value":"all"},{"label":"Recents","value":"recents"},{"label":"Shared","value":"shared"}]' value="all"><div slot="all" style="padding:12px 0">128 files across every folder.</div><div slot="recents" style="padding:12px 0">Files you opened this week.</div><div slot="shared" style="padding:12px 0">Shared with you by collaborators.</div></box-tabs>`,
      },
    ],
  },
  "context-menu": {
    html: `<box-context-menu>\n  <div style="display:grid;place-items:center;height:120px;border:1px dashed var(--boe-token-stroke-stroke,#e8e8e8);border-radius:12px;color:var(--boe-token-text-text-secondary,#6f6f6f)">Right-click here</div>\n</box-context-menu>`,
    setup: root => set(root, "box-context-menu", {
      items: [
        { id: "open", label: "Open" },
        { id: "rename", label: "Rename" },
        { id: "download", label: "Download" },
        { id: "delete", label: "Delete", separator: true },
      ],
    }),
    note: "Right-click (or Shift+F10) the area to open the menu at the pointer.",
  },
  dialog: { html: `<box-dialog heading="Delete file?" message="Quarterly Plan.pdf will be moved to trash." open></box-dialog>` },
  drawer: { html: `<box-drawer heading="Details" open></box-drawer>` },
  popover: { html: `<box-popover label="More info" placement="top" open>Shared links expire automatically.</box-popover>` },
  tooltip: { html: `<box-tooltip label="Copy link" open><box-button label="Share" tone="neutral"></box-button></box-tooltip>` },
  illustration: {
    html: `<box-illustration asset="empty-state-folder" heading="Nothing here yet" message="Upload a file to get started."></box-illustration>`,
  },

  // Patterns
  "content-explorer": {
    html: contentExplorerChromeHtml,
    setup: root => setupContentExplorerChrome(root, createMockTransport()),
    note: contentExplorerChromeNote,
    variants: [
      {
        name: "Folder host chrome",
        html: contentExplorerChromeHtml,
        setup: root => setupContentExplorerChrome(root, createMockTransport()),
        note: contentExplorerChromeNote,
      },
      {
        name: "Metadata query chrome",
        html: contentExplorerMetadataChromeHtml,
        setup: root => setupContentExplorerMetadataChrome(root),
        note: contentExplorerMetadataChromeNote,
      },
    ],
  },
  "explorer-breadcrumbs": { html: `<box-explorer-breadcrumbs></box-explorer-breadcrumbs>`, setup: explorerAdapterSetup("box-explorer-breadcrumbs"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-toolbar": { html: `<box-explorer-toolbar></box-explorer-toolbar>`, setup: explorerAdapterSetup("box-explorer-toolbar"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-list": { html: `<box-explorer-list></box-explorer-list>`, setup: explorerAdapterSetup("box-explorer-list"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-table": { html: `<box-explorer-table></box-explorer-table>`, setup: explorerAdapterSetup("box-explorer-table"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-items": { html: `<box-explorer-items></box-explorer-items>`, setup: explorerAdapterSetup("box-explorer-items"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-action-menu": {
    html: `<box-explorer-action-menu></box-explorer-action-menu>`,
    setup: explorerAdapterSetup("box-explorer-action-menu", { itemId: "123", selectItemId: "123" }),
    note: "Controller-bound item actions for Quarterly Plan.pdf (itemId + ContentExplorerController).",
  },
  "filter-bar": {
    html: `<box-filter-bar label="Filters" query="contract"></box-filter-bar>`,
    setup: root => set(root, "box-filter-bar", {
      filterOptions: [
        { label: "Modified", value: "modified" },
        { label: "Owner", value: "owner" },
        { label: "Type", value: "type" },
      ],
      filters: ["type"],
    }),
  },
  "search-results-header": {
    html: `<box-search-results-header label="Results" query="contract" result-count="128" scope="All files"></box-search-results-header>`,
    setup: root => set(root, "box-search-results-header", {
      filters: ["Type: PDF", "Owner: Morgan Lee"],
      actions: [{ id: "save-view", label: "Save view" }],
    }),
  },
  "saved-view-picker": {
    html: `<box-saved-view-picker label="Saved views"></box-saved-view-picker>`,
    setup: root => set(root, "box-saved-view-picker", {
      views: [
        { id: "recent-contracts", label: "Recent contracts" },
        { id: "my-uploads", label: "My uploads" },
      ],
      value: "recent-contracts",
    }),
  },
  "item-form": {
    html: `<box-item-form label="File properties"></box-item-form>`,
    setup: root => set(root, "box-item-form", {
      fields: [
        { id: "name", label: "Name", type: "string", value: "Quarterly Plan.pdf" },
        { id: "status", label: "Status", type: "string", value: "Final" },
      ],
    }),
  },
  "item-details-panel": {
    html: `<box-item-details-panel heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner='{"name":"Morgan Lee","description":"Enterprise Admin"}' status="Shared" message="Latest board-ready plan with updated forecasts."></box-item-details-panel>`,
    setup: root => set(root, "box-item-details-panel", {
      actions: [
        { id: "share", label: "Share" },
        { id: "download", label: "Download" },
      ],
      meta: [
        { label: "Modified", value: "Jul 10, 2026" },
      ],
    }),
  },
  "bulk-action-bar": {
    html: `<box-bulk-action-bar label="Selection" count="3" message="3 items selected"></box-bulk-action-bar>`,
    setup: root => set(root, "box-bulk-action-bar", {
      actions: [
        { id: "move", label: "Move" },
        { id: "share", label: "Share" },
        { id: "delete", label: "Delete" },
      ],
    }),
  },
  "preview-header": { html: `<box-preview-header heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" status="Shared"></box-preview-header>` },
  "metadata-filter-builder": { html: `<box-metadata-filter-builder label="Metadata filters"></box-metadata-filter-builder>` },
  "metadata-inspector": { html: `<box-metadata-inspector heading="Metadata"></box-metadata-inspector>` },
  "share-panel": {
    html: `<box-share-panel heading="Share Quarterly Plan.pdf" message="Anyone in the company with the link can view."></box-share-panel>`,
    setup: root => set(root, "box-share-panel", {
      sharedLink: { url: "https://box.com/s/example", access: "company", label: "Company link", status: "Active" },
      collaborators: [
        { name: "Morgan Lee", role: "Editor" },
        { name: "Alex Kim", role: "Viewer" },
      ],
      settings: [
        { label: "Downloads", value: "Allowed" },
        { label: "Expiration", value: "Jun 1, 2026" },
      ],
      actions: [{ id: "copy", label: "Copy link" }],
    }),
  },
  "permission-matrix": { html: `<box-permission-matrix label="Permissions"></box-permission-matrix>` },
  "collaborator-avatars": {
    html: `<box-collaborator-avatars label="Collaborators" max="4"></box-collaborator-avatars>`,
    setup: root => set(root, "box-collaborator-avatars", {
      collaborators: [
        { id: "1", name: "Morgan Lee" },
        { id: "2", name: "Alex Kim" },
        { id: "3", name: "Sam Patel" },
        { id: "4", name: "Jordan Rivera" },
        { id: "5", name: "Robin Cho" },
        { id: "6", name: "Casey Ng" },
      ],
    }),
  },
  "invite-collaborators-modal": {
    html: `<box-button label="Invite people" tone="primary"></box-button>\n<box-invite-collaborators-modal item-id="42"></box-invite-collaborators-modal>`,
    setup: root => {
      const modal = root.querySelector("box-invite-collaborators-modal") as
        | (HTMLElement & { transport: InviteCollaboratorsTransport; open: boolean })
        | null;
      if (modal) {
        // A mock transport that echoes the recipients back as invited.
        modal.transport = {
          async sendInvites(input) {
            return { invited: input.recipients };
          },
        };
      }
      root.querySelector("box-button")?.addEventListener("click", () => {
        if (modal) {
          modal.open = true;
        }
      });
    },
    note: "Click the button to open. Set a `transport` + `item-id`; the modal owns an InviteCollaboratorsController.",
  },
  "unified-share-modal": {
    html: `<box-button label="Share" tone="primary"></box-button>\n<box-unified-share-modal item-id="42" heading="Share Quarterly Plan.pdf"></box-unified-share-modal>`,
    setup: root => {
      const modal = root.querySelector("box-unified-share-modal") as
        | (HTMLElement & { dataSource: ShareDataSource; open: boolean })
        | null;
      // An in-memory ShareDataSource so the modal's link + people tabs are live.
      let state: ShareState = {
        itemId: "42",
        itemType: "file",
        sharedLink: {
          url: "https://app.box.com/s/quarterly-plan-2026",
          access: "company",
          canDownload: true,
          canPreview: true,
        },
        collaborators: [
          { id: "1", name: "Morgan Lee", type: "user", role: "co-owner", status: "active" },
          { id: "2", name: "Alex Kim", type: "user", role: "editor", status: "active" },
          { id: "3", name: "Finance Team", type: "group", role: "viewer" },
        ],
      };
      const dataSource: ShareDataSource = {
        async getShareState() {
          return state;
        },
        async updateSharedLink({ sharedLink }) {
          state = { ...state, sharedLink };
          return state;
        },
        async listCollaborators() {
          return state.collaborators;
        },
      };
      if (modal) {
        modal.dataSource = dataSource;
      }
      root.querySelector("box-button")?.addEventListener("click", () => {
        if (modal) {
          modal.open = true;
        }
      });
    },
    note: "Click the button to open. Set a `dataSource` + `item-id`; the modal owns a UnifiedShareController that loads the shared link and collaborators, and emits `invite` for the invite flow.",
  },
  presence: {
    html: `<box-presence label="Who's here" max="4"></box-presence>`,
    setup: root => {
      const rosters: PresenceUser[][] = [
        [{ id: "1", name: "Morgan Lee", activity: "editing" }],
        [
          { id: "1", name: "Morgan Lee", activity: "editing" },
          { id: "2", name: "Alex Kim", activity: "viewing" },
        ],
        [
          { id: "1", name: "Morgan Lee", activity: "editing" },
          { id: "2", name: "Alex Kim", activity: "viewing" },
          { id: "3", name: "Sam Patel", activity: "viewing" },
        ],
        [
          { id: "2", name: "Alex Kim", activity: "viewing" },
          { id: "3", name: "Sam Patel", activity: "editing" },
        ],
      ];
      // A mock realtime feed that cycles the roster so the live region updates.
      const transport: PresenceTransport = {
        subscribe(listener: (users: PresenceUser[]) => void) {
          let index = 0;
          listener(rosters[0]);
          const timer = setInterval(() => {
            index = (index + 1) % rosters.length;
            listener(rosters[index]);
          }, 2200);
          return () => clearInterval(timer);
        },
      };
      set(root, "box-presence", { transport });
    },
    note: "Set a `transport` and the element owns a PresenceController, connecting to the live feed.",
  },
  "access-stats": {
    html: `<box-access-stats label="Shared link activity"></box-access-stats>`,
    setup: root => set(root, "box-access-stats", {
      stats: [
        { label: "Views", value: 1280, icon: "👁" },
        { label: "Downloads", value: 96, icon: "⬇" },
        { label: "Comments", value: 7, icon: "💬" },
      ],
    }),
  },
  "annotation-toolbar": {
    html: `<box-annotation-toolbar label="Annotate" active-tool-id="comment" current-color="#f59e0b" tools='[{"id":"comment","label":"Comment"},{"id":"highlight","label":"Highlight"},{"id":"draw","label":"Draw"},{"id":"redact","label":"Redact","disabled":true}]' color-options='[{"id":"amber","label":"Amber","value":"#f59e0b"},{"id":"blue","label":"Blue","value":"#3b82f6"},{"id":"red","label":"Red","value":"#ed3757"}]' actions='[{"id":"undo","label":"Undo"},{"id":"save","label":"Save","tone":"primary"}]'></box-annotation-toolbar>`,
  },
  "annotation-inspector": { html: `<box-annotation-inspector heading="Annotation"></box-annotation-inspector>` },
  "annotation-thread": { html: `<box-annotation-thread heading="Discussion"></box-annotation-thread>` },
  "preview-element": {
    html: `<box-preview-element heading="Quarterly Plan.pdf" item-label="PDF · 2.4 MB" status="Ready" message="Rendered by the active preview provider." provider='{"id":"content-preview","label":"Box Content Preview","engine":"pdf.js","status":"ready","capabilities":["annotations","downloads"]}' adapter-state='{"ready":true,"pageLabel":"Page 2 of 34","zoomLabel":"100%","mode":"Review"}' actions='[{"id":"download","label":"Download"}]'>
  <box-annotation-toolbar slot="toolbar" label="Annotate" active-tool-id="comment" current-color="#f59e0b" tools='[{"id":"comment","label":"Comment"},{"id":"highlight","label":"Highlight"}]' color-options='[{"id":"amber","label":"Amber","value":"#f59e0b"},{"id":"blue","label":"Blue","value":"#3b82f6"}]'></box-annotation-toolbar>
  <div slot="stage" style="display:grid;place-items:center;min-block-size:12rem;padding:1rem;color:#6f6f6f;border:1px dashed #e8e8e8;border-radius:0.65rem;background:#fff">Page canvas · Q3 forecast table</div>
  <box-annotation-thread slot="sidebar" heading="Discussion" entries='[{"id":"a1","author":"Morgan Lee","body":"Tighten the hero spacing.","toolLabel":"Comment","status":"Open"}]'></box-annotation-thread>
</box-preview-element>`,
  },
  "file-request-builder": {
    html: `<box-file-request-builder heading="Collect vendor W-9s" message="Request tax forms from onboarding vendors."></box-file-request-builder>`,
    setup: root => set(root, "box-file-request-builder", {
      fields: [
        { id: "company", label: "Company name", required: true },
        { id: "w9", label: "W-9 upload", description: "PDF only", required: true },
      ],
      settings: [
        { id: "due", label: "Due date", description: "Jul 31, 2026" },
        { id: "notify", label: "Email notifications", description: "On upload" },
      ],
    }),
  },
  "task-assignment-panel": {
    html: `<box-task-assignment-panel heading="Contract review" status="In progress" priority="High" due-date="Jul 18, 2026" message="Legal review before countersign."></box-task-assignment-panel>`,
    setup: root => {
      set(root, "box-task-assignment-panel", {
        assignees: [
          { id: "morgan", name: "Morgan Lee", description: "Legal", status: "Active" },
          { id: "alex", name: "Alex Kim", description: "Procurement" },
        ],
        checklist: [
          { id: "terms", label: "Review terms", checked: true },
          { id: "redlines", label: "Resolve redlines" },
        ],
        actions: [
          { id: "approve", label: "Approve" },
          { id: "reassign", label: "Reassign" },
        ],
      });
      root.querySelector("box-task-assignment-panel")?.setAttribute("current-assignee-id", "morgan");
    },
  },
  "review-queue-item": {
    html: `<box-review-queue-item heading="MSA_Acme_v4.pdf" item-label="Contract" status="Awaiting review" priority="Medium" due-date="Jul 14, 2026" message="Second-pass legal review."></box-review-queue-item>`,
    setup: root => set(root, "box-review-queue-item", {
      assignee: { name: "Morgan Lee", role: "Legal" },
      metrics: [
        { label: "Pages", value: "34" },
        { label: "Comments", value: "6" },
      ],
      actions: [
        { id: "open", label: "Open" },
        { id: "approve", label: "Approve", tone: "primary" },
      ],
    }),
  },
  "governance-panel": {
    html: `<box-governance-panel heading="Governance" status="Compliant" message="Retention and classification policies applied."></box-governance-panel>`,
    setup: root => set(root, "box-governance-panel", {
      policies: [
        { label: "Retention", value: "7 years", description: "Finance default" },
        { label: "Classification", value: "Internal" },
      ],
      signals: [{ label: "Legal hold", tone: "warning" }],
      actions: [{ id: "audit", label: "View audit log" }],
    }),
  },
  "metric-card": {
    html: `<box-metric-card heading="Active shared links" value="1,284" eyebrow="Last 30 days" message="Up from 1,102 in the prior period." status="Healthy"></box-metric-card>`,
    setup: root => set(root, "box-metric-card", { trend: { label: "+16.5%", tone: "success" } }),
  },
  "chart-panel": {
    html: `<box-chart-panel heading="Usage" summary="89%" timeframe="Last 7 days" message="Weekly rollups across the enterprise." points='[{"id":"mon","label":"Mon","value":12},{"id":"tue","label":"Tue","value":18},{"id":"wed","label":"Wed","value":24,"tone":"accent"},{"id":"thu","label":"Thu","value":21},{"id":"fri","label":"Fri","value":28}]' legend='[{"label":"Usage","tone":"brand","value":"89%"}]' actions='[{"id":"open-report","label":"Open report","tone":"primary"}]'></box-chart-panel>`,
  },
  "bar-chart": {
    html: `<box-bar-chart heading="Uploads per week" timeframe="Last 5 weeks" summary="Steady growth across the quarter."></box-bar-chart>`,
    setup: root => set(root, "box-bar-chart", {
      points: [
        { id: "w1", label: "W1", value: 42 },
        { id: "w2", label: "W2", value: 51 },
        { id: "w3", label: "W3", value: 48 },
        { id: "w4", label: "W4", value: 64 },
        { id: "w5", label: "W5", value: 71 },
      ],
      legend: [{ label: "Uploads", tone: "brand" }],
    }),
  },
  "line-chart": {
    html: `<box-line-chart heading="Active users" timeframe="Last 5 weeks"></box-line-chart>`,
    setup: root => set(root, "box-line-chart", {
      points: [
        { id: "w1", label: "W1", value: 310 },
        { id: "w2", label: "W2", value: 355 },
        { id: "w3", label: "W3", value: 348 },
        { id: "w4", label: "W4", value: 402 },
        { id: "w5", label: "W5", value: 431 },
      ],
    }),
  },
  "donut-chart": {
    html: `<box-donut-chart heading="Storage by type"></box-donut-chart>`,
    setup: root => set(root, "box-donut-chart", {
      segments: [
        { id: "docs", label: "Documents", value: 46 },
        { id: "media", label: "Media", value: 32 },
        { id: "other", label: "Other", value: 22 },
      ],
    }),
  },
};
