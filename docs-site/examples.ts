/**
 * Curated live examples per catalog entry. `html` is the canonical usage-first
 * snippet (shown verbatim on the Code tab); `setup` binds rich properties that
 * cannot be expressed as simple attributes. Entries without an example fall
 * back to a bare element with a `label` attribute.
 */
import { ContentExplorerController, type ExplorerTransport } from "box-open-elements";

type SetupFn = (root: HTMLElement) => void;

export interface ComponentExample {
  html: string;
  setup?: SetupFn;
  note?: string;
}

export const createMockTransport = (): ExplorerTransport => ({
  async loadFolderItems({ folderId }) {
    const root = folderId === "0";
    return {
      folderId,
      folder: { id: folderId, name: root ? "All Files" : "Marketing", type: "folder" },
      breadcrumbs: root
        ? [{ id: "0", name: "All Files", type: "folder" }]
        : [
            { id: "0", name: "All Files", type: "folder" },
            { id: "42", name: "Marketing", type: "folder" },
          ],
      items: [
        { id: "42", name: "Marketing", type: "folder" },
        { id: "77", name: "Legal", type: "folder" },
        { id: "123", name: "Quarterly Plan.pdf", type: "file" },
        { id: "124", name: "Brand Guidelines.pdf", type: "file" },
        { id: "125", name: "box.com/launch", type: "web_link" },
      ],
      pagination: { hasMoreItems: true, limit: 25, offset: 0, totalCount: 120 },
    };
  },
});

const explorerAdapterSetup = (selector: string): SetupFn => root => {
  const controller = new ContentExplorerController({
    rootFolderId: "0",
    token: "docs-token",
    transport: createMockTransport(),
    itemActions: [
      { id: "share", label: "Share" },
      { id: "download", label: "Download", itemTypes: ["file"] },
    ],
  });
  const element = root.querySelector(selector) as (HTMLElement & { controller: unknown }) | null;
  if (element) {
    element.controller = controller;
  }
  void controller.connect().then(() => controller.toggleSelection("123"));
};

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
  card: { html: `<box-card eyebrow="PDF · 2.4 MB" title="Quarterly Plan.pdf">Updated 2 hours ago by Morgan Lee</box-card>` },
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
  "grid-view": {
    html: `<box-grid-view label="Files"></box-grid-view>`,
    setup: root => set(root, "box-grid-view", {
      items: [
        { value: "123", label: "Quarterly Plan.pdf", meta: "PDF · 2.1 MB", icon: "P" },
        { value: "124", label: "Brand Guidelines.pdf", meta: "PDF · 5.4 MB", icon: "P" },
        { value: "42", label: "Marketing", meta: "Folder · 18 items", icon: "M" },
        { value: "125", label: "box.com/launch", meta: "Web link", icon: "L" },
      ],
      value: "123",
    }),
  },
  pagination: { html: `<box-pagination page="2" page-size="25" total-items="220"></box-pagination>` },
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
        { id: "marketing", cells: { name: "Marketing", owner: "Morgan Lee" }, children: [
          { id: "brand", cells: { name: "Brand", owner: "Alex Kim" } },
        ] },
        { id: "finance", cells: { name: "Finance", owner: "Sam Rivera" } },
      ],
    }),
    note: "Column/item shapes follow the component's `columns` and `items` properties.",
  },
  alert: { html: `<box-alert title="Upload complete" message="24 files were added to Marketing." tone="success"></box-alert>` },
  badge: { html: `<box-badge label="Beta"></box-badge>\n<box-badge label="Error" tone="error"></box-badge>` },
  chip: { html: `<box-chip label="Marketing" tone="brand" removable value="marketing"></box-chip>\n<box-chip label="Legal" removable value="legal"></box-chip>` },
  "empty-state": { html: `<box-empty-state title="No results" message="Try a different search or clear the filters."></box-empty-state>` },
  "help-text": { html: `<box-help-text label="Shared links" message="Shared links expire after 30 days."></box-help-text>` },
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
  toast: { html: `<box-toast title="Link copied" message="Anyone in the company can view." open></box-toast>` },
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
  calendar: { html: `<box-calendar value="2026-07-18" month="2026-07"></box-calendar>` },
  "date-field": { html: `<box-date-field label="Due date" value="2026-07-18"></box-date-field>` },
  dropdown: {
    html: `<box-dropdown label="Sort by"></box-dropdown>`,
    setup: root => set(root, "box-dropdown", {
      options: [
        { label: "Name", value: "name" },
        { label: "Modified", value: "modified" },
        { label: "Size", value: "size" },
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
  "app-shell": { html: `<box-app-shell title="Box Admin"></box-app-shell>` },
  divider: { html: `<box-divider label="Shared with your team"></box-divider>` },
  "split-view": { html: `<box-split-view label="Master detail"></box-split-view>` },
  "nav-sidebar": {
    html: `<box-nav-sidebar label="Workspace" id="demo-nav-sidebar">
  <box-sidebar-toggle-button slot="header" controls="demo-nav-sidebar" label="Collapse navigation"></box-sidebar-toggle-button>
  <a href="#">All Files</a>
  <a href="#">Recents</a>
  <a href="#">Synced</a>
  <a href="#">Trash</a>
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
    note: "Wire the toggle button's `toggle` event to the sidebar's `collapsed` property.",
  },
  "sidebar-toggle-button": { html: `<box-sidebar-toggle-button label="Toggle navigation"></box-sidebar-toggle-button>` },
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
  tabs: {
    html: `<box-tabs label="Views"></box-tabs>`,
    setup: root => set(root, "box-tabs", {
      options: [
        { label: "All files", value: "all" },
        { label: "Recents", value: "recents" },
        { label: "Shared", value: "shared" },
      ],
      value: "all",
    }),
  },
  dialog: { html: `<box-dialog title="Delete file?" message="Quarterly Plan.pdf will be moved to trash." open></box-dialog>` },
  drawer: { html: `<box-drawer title="Details" open></box-drawer>` },
  popover: { html: `<box-popover label="More info" open>Shared links expire automatically.</box-popover>` },
  tooltip: { html: `<box-tooltip label="Copy link" open><box-button label="Share" tone="neutral"></box-button></box-tooltip>` },
  illustration: { html: `<box-illustration asset="empty-state-folder" label="Empty folder"></box-illustration>` },

  // Patterns
  "content-explorer": {
    html: `<box-content-explorer root-folder-id="0" token="…" page-size="25"></box-content-explorer>`,
    setup: root => set(root, "box-content-explorer", { transport: createMockTransport() }),
    note: "Wired to a mock transport in this preview; inject your own ExplorerTransport or data source.",
  },
  "explorer-breadcrumbs": { html: `<box-explorer-breadcrumbs></box-explorer-breadcrumbs>`, setup: explorerAdapterSetup("box-explorer-breadcrumbs"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-toolbar": { html: `<box-explorer-toolbar></box-explorer-toolbar>`, setup: explorerAdapterSetup("box-explorer-toolbar"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-list": { html: `<box-explorer-list></box-explorer-list>`, setup: explorerAdapterSetup("box-explorer-list"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-table": { html: `<box-explorer-table></box-explorer-table>`, setup: explorerAdapterSetup("box-explorer-table"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-items": { html: `<box-explorer-items></box-explorer-items>`, setup: explorerAdapterSetup("box-explorer-items"), note: "Driven by a shared ContentExplorerController with a mock transport." },
  "explorer-action-menu": {
    html: `<box-explorer-action-menu></box-explorer-action-menu>`,
    setup: root => set(root, "box-explorer-action-menu", {
      actions: [
        { id: "share", label: "Share" },
        { id: "download", label: "Download" },
      ],
    }),
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
    html: `<box-item-form title="File properties"></box-item-form>`,
    setup: root => set(root, "box-item-form", {
      fields: [
        { id: "name", label: "Name", type: "string", value: "Quarterly Plan.pdf" },
        { id: "status", label: "Status", type: "string", value: "Final" },
      ],
    }),
  },
  "item-details-panel": {
    html: `<box-item-details-panel title="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner="Morgan Lee" status="Shared" message="Latest board-ready plan with updated forecasts."></box-item-details-panel>`,
    setup: root => set(root, "box-item-details-panel", {
      actions: [
        { id: "share", label: "Share" },
        { id: "download", label: "Download" },
      ],
      meta: [
        { label: "Owner", value: "Morgan Lee" },
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
  "preview-header": { html: `<box-preview-header title="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" status="Shared"></box-preview-header>` },
  "metadata-filter-builder": { html: `<box-metadata-filter-builder title="Metadata filters"></box-metadata-filter-builder>` },
  "metadata-inspector": { html: `<box-metadata-inspector title="Metadata"></box-metadata-inspector>` },
  "share-panel": {
    html: `<box-share-panel title="Share Quarterly Plan.pdf" message="Anyone in the company with the link can view."></box-share-panel>`,
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
  "permission-matrix": { html: `<box-permission-matrix title="Permissions"></box-permission-matrix>` },
  "annotation-toolbar": {
    html: `<box-annotation-toolbar label="Annotate"></box-annotation-toolbar>`,
    setup: root => set(root, "box-annotation-toolbar", {
      tools: [
        { id: "comment", label: "Comment" },
        { id: "highlight", label: "Highlight" },
        { id: "draw", label: "Draw" },
        { id: "redact", label: "Redact", disabled: true },
      ],
    }),
  },
  "annotation-inspector": { html: `<box-annotation-inspector title="Annotation"></box-annotation-inspector>` },
  "annotation-thread": { html: `<box-annotation-thread title="Discussion"></box-annotation-thread>` },
  "preview-element": {
    html: `<box-preview-element title="Quarterly Plan.pdf" item-label="PDF · 2.4 MB" status="Ready" message="Rendered by the active preview provider."></box-preview-element>`,
    setup: root => set(root, "box-preview-element", {
      provider: { id: "content-preview", label: "Box Content Preview", engine: "pdf.js", status: "ready" },
      adapterState: { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" },
    }),
  },
  "file-request-builder": {
    html: `<box-file-request-builder title="Collect vendor W-9s" message="Request tax forms from onboarding vendors."></box-file-request-builder>`,
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
    html: `<box-task-assignment-panel title="Contract review" status="In progress" priority="High" due-date="Jul 18, 2026" message="Legal review before countersign."></box-task-assignment-panel>`,
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
    html: `<box-review-queue-item title="MSA_Acme_v4.pdf" item-label="Contract" status="Awaiting review" priority="Medium" due-date="Jul 14, 2026" message="Second-pass legal review."></box-review-queue-item>`,
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
    html: `<box-governance-panel title="Governance" status="Compliant" message="Retention and classification policies applied."></box-governance-panel>`,
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
    html: `<box-metric-card title="Active shared links" value="1,284" eyebrow="Last 30 days" message="Up from 1,102 in the prior period." status="Healthy"></box-metric-card>`,
    setup: root => set(root, "box-metric-card", { trend: { label: "+16.5%", tone: "success" } }),
  },
  "chart-panel": { html: `<box-chart-panel title="Usage" message="Weekly rollups across the enterprise."></box-chart-panel>` },
  "bar-chart": {
    html: `<box-bar-chart title="Uploads per week" timeframe="Last 5 weeks" summary="Steady growth across the quarter."></box-bar-chart>`,
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
    html: `<box-line-chart title="Active users" timeframe="Last 5 weeks"></box-line-chart>`,
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
    html: `<box-donut-chart title="Storage by type"></box-donut-chart>`,
    setup: root => set(root, "box-donut-chart", {
      segments: [
        { id: "docs", label: "Documents", value: 46 },
        { id: "media", label: "Media", value: 32 },
        { id: "other", label: "Other", value: 22 },
      ],
    }),
  },
};
