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
import {
  REFERENCE_TIME,
  clmAuditEvents,
  clmCommands,
  clmNotifications,
  clmClauseAfter,
  clmClauseBefore,
  clmIntakeSteps,
  clmIntakeSummaryFields,
  clmIntakeValues,
  clmLineage,
  clmProvenanceChain,
  clmSignatories,
  clmDeclinedSignatories,
  clmRunSteps,
  clmFailedRunSteps,
  clmStages,
  clmTeam,
  clmTimelineEvents,
  clmVersionHistory,
  createAgentChatDemoTransport,
  createWorkQueueDemoTransport,
} from "./clm-demo-data.js";
import type { ContentPicker } from "../src/patterns/content-picker/content-picker.js";
import type { ContentUploader } from "../src/patterns/content-uploader/content-uploader.js";
import type { UploadTransport } from "../src/patterns/content-uploader/types.js";
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

/**
 * Deterministic uploader demo: one file finishes, one stays in flight at 62%,
 * one fails — so the queue shows every row state without timers.
 */
export const createUploaderDemoTransport = (): UploadTransport => ({
  uploadFile({ fileName, onProgress }) {
    if (fileName === "Board Deck.pdf") {
      onProgress?.(0.62);
      return new Promise(() => {});
    }
    if (fileName === "Launch Video.mp4") {
      return Promise.reject(new Error("Storage quota exceeded"));
    }
    onProgress?.(1);
    return Promise.resolve({ fileId: `demo-${fileName}` });
  },
});

export const uploaderDemoFiles = [
  { name: "Quarterly Plan.pdf", size: 2_400_000 },
  { name: "Board Deck.pdf", size: 5_100_000 },
  { name: "Launch Video.mp4", size: 8_300_000 },
];

/**
 * Adds `createFolder`, which is what turns a folder drop from refused to
 * uploaded.
 *
 * Idempotent by name within a parent, as the contract asks: a retried upload
 * asks for the same folder again, and a transport that minted a fresh id each
 * time would scatter the retried files into a second folder of the same name.
 */
export const createUploaderFolderTransport = (): UploadTransport => {
  const folderIds = new Map<string, string>();
  return {
    uploadFile: ({ fileName }) => Promise.resolve({ fileId: `demo-${fileName}` }),
    createFolder: ({ name, parentFolderId }) => {
      const key = `${parentFolderId}/${name}`;
      const existing = folderIds.get(key);
      if (existing) {
        return Promise.resolve({ folderId: existing });
      }
      const folderId = `demo-folder-${folderIds.size + 1}-${name}`;
      folderIds.set(key, folderId);
      return Promise.resolve({ folderId });
    },
  };
};

export const uploaderDemoEntries = [
  { file: { name: "Statement of Work.pdf", size: 1_200_000 }, path: "" },
  { file: { name: "Q1.pdf", size: 840_000 }, path: "Reports/2026" },
  { file: { name: "Q2.pdf", size: 910_000 }, path: "Reports/2026" },
  { file: { name: "Signed MSA.pdf", size: 2_100_000 }, path: "Reports/Contracts" },
];

/** Retry until the element's async session is up, then run the interaction. */
const whenSessionReady = (ready: () => boolean, run: () => void, attempts = 40): void => {
  if (ready()) {
    run();
    return;
  }
  if (attempts > 0) {
    setTimeout(() => whenSessionReady(ready, run, attempts - 1), 25);
  }
};

const explorerAdapterSetup =
  (selector: string, options?: { selectItemId?: string; itemId?: string }): SetupFn =>
  root =>
    setupExplorerAdapter(root, selector, {
      selectItemId: options?.selectItemId ?? "123",
      itemId: options?.itemId,
    });

/** Shared by every notification-inbox variant; also plays the host, since
 * the element emits intents rather than mutating its own list. */
const notificationInboxSetup = (root: HTMLElement): void => {
  set(root, "box-notification-inbox", {
    notifications: clmNotifications,
    typeLabels: { "sla-breach": "SLA breaches", approval: "Approvals", mention: "Mentions" },
  });
  const inbox = root.querySelector("box-notification-inbox") as
    | (HTMLElement & { notifications: typeof clmNotifications })
    | null;
  if (!inbox) return;
  inbox.addEventListener("mark-read-requested", event => {
    const { item } = (event as CustomEvent<{ item: { id: string } }>).detail;
    inbox.notifications = inbox.notifications.map(entry =>
      entry.id === item.id ? { ...entry, read: true } : entry,
    );
  });
  inbox.addEventListener("mark-all-read-requested", () => {
    inbox.notifications = inbox.notifications.map(entry => ({ ...entry, read: true }));
  });
  inbox.addEventListener("dismiss-requested", event => {
    const { item } = (event as CustomEvent<{ item: { id: string } }>).detail;
    inbox.notifications = inbox.notifications.filter(entry => entry.id !== item.id);
  });
};

/** Shared by the wizard-summary variants; fields carry a `format`, so property-set. */
const wizardSummarySetup = (root: HTMLElement): void => {
  set(root, "box-wizard-summary", {
    steps: clmIntakeSteps,
    fields: clmIntakeSummaryFields,
    values: clmIntakeValues,
  });
};

/** Shared by every shortcuts-overlay variant — the same catalogue the palette gets. */
const shortcutsOverlaySetup = (root: HTMLElement): void => {
  set(root, "box-shortcuts-overlay", { commands: clmCommands });
};

/** Shared by every path variant; only the current stage differs. */
const pathSetup =
  (current: string) =>
  (root: HTMLElement): void => {
    set(root, "box-path", { stages: clmStages, current });
  };

/** Shared by every audit-log variant so they all render the same trail. */
const auditLogSetup = (root: HTMLElement): void => {
  set(root, "box-audit-log", { events: clmAuditEvents, referenceTime: REFERENCE_TIME });
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
  toolbar: {
    html: `<box-toolbar label="Document actions"><button type="button">Share</button><button type="button">Download</button><button type="button">Rename</button></box-toolbar>`,
  },
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
  skeleton: {
    html: `<box-skeleton width="320px" height="18px"></box-skeleton>`,
    note: "Reserves space while content loads. `box` (the default) is one rectangle sized by `width`/`height`; `line` is a stack of `lines` bars; `grid` is a column layout after Adobe Spectrum's responsive grid — twelve columns by default, gutters stepping 16 → 24 → 32 → 40 → 48px across Spectrum's breakpoints. Every region is clamped to the `columns` and `rows` declared, so a bad number from the host makes the placeholder slightly wrong rather than blowing the layout out.",
    variants: [
      {
        name: "Box",
        html: `<box-skeleton width="240px" height="120px"></box-skeleton>`,
        note: "The default: one rectangle, sized directly.",
      },
      {
        name: "Lines",
        html: `<box-skeleton variant="line" lines="4"></box-skeleton>`,
        note: "Four text bars. The last stops at 62% so the stack reads as a paragraph rather than a table. Bars are added and removed in place when `lines` changes, so the shimmer does not restart.",
      },
      {
        name: "Grid",
        html: `<box-skeleton variant="grid" columns="3" rows="3" items='[{"span":3},{"span":1,"rowSpan":2},{"span":2}]'></box-skeleton>`,
        note: "Three columns: a full-width band, then a single column standing two rows tall beside a two-column region. The tall region is two rows plus the gutter between them, and cannot exceed the three rows declared.",
      },
      {
        name: "Grid with an offset",
        html: `<box-skeleton variant="grid" columns="4" items='[{"span":2,"offset":2}]'></box-skeleton>`,
        note: "Spectrum's offset: two empty columns, then a two-column region. Rendered as a hidden spacer, so it composes with auto-placement instead of fighting it.",
      },
      {
        name: "Uniform grid",
        html: `<box-skeleton variant="grid" columns="3" rows="2"></box-skeleton>`,
        note: "With no `items`, `rows` and `columns` alone describe a uniform grid — here six single cells.",
      },
    ],
  },
  spinner: { html: `<box-spinner label="Loading"></box-spinner>` },
  toast: {
    note: "A status glyph, an optional bold `heading` over the `message`, and an icon-only close control. The glyph differs in shape as well as colour — a round tick against a warning triangle — so the tone survives for a reader who cannot separate green from amber, and it is repeated as a visually hidden word for screen readers. Fill, border, shadow and text colour deliberately track box-ui-elements' `.notification` and are pinned by the colour conformance manifest; the structure is where the refinement lives.",
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
      {
        name: "Heading and message",
        html: `<box-toast open heading="Upload failed" message="3 of 12 files could not be read." tone="error"></box-toast>`,
        note: "An optional bold `heading` above the message. Without one the message carries the heading's weight, so the shipped single-line shape is unchanged.",
      },
      {
        name: "Borderless",
        html: `<div style="display:grid;gap:0.5rem;justify-items:start;max-inline-size:min(100%,24rem)">
  <box-toast open borderless tone="success" heading="Contract executed" message="All parties have signed."></box-toast>
  <box-toast open borderless tone="error" heading="Upload failed" message="3 of 12 files could not be read."></box-toast>
</div>`,
        note: "`borderless` drops the outline for a softer, fill-only toast. The border colour goes transparent rather than its width going to zero, so a borderless toast is exactly the size of a bordered one — measured at 330.5×72 either way — and a mixed stack does not jump.",
      },
      {
        name: "Sticky",
        html: `<box-toast open mode="sticky" heading="Approval overdue" message="Waiting on Morgan Lee since Tuesday." tone="warning"></box-toast>`,
        note: "`mode=\"sticky\"` stays until the reader closes it and overrides any `duration`. It keeps the close control — a toast the reader cannot get rid of is a trap.",
      },
    ],
  },
  grid: {
    html: `<box-grid style="--demo:1"><article data-span="8" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">Main (8)</article><aside data-span="4" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">Sidebar (4)</aside></box-grid>`,
    note: "Adobe Spectrum's responsive grid: twelve columns, gutters stepping 16 → 24 → 32 → 40 → 48px across the breakpoints. Children declare their own placement with `data-span`, `data-offset` and `data-row-span`, applied as generated CSS rules so the author's markup is never written to. `box-skeleton`'s grid variant reads the same `--boe-grid-gutter` and column model, so a placeholder matches the layout it stands in for.",
    variants: [
      {
        name: "Offset",
        html: `<box-grid><div data-span="6" data-offset="3" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">Centred (6, offset 3)</div></box-grid>`,
        note: "Three empty columns, then a six-column region.",
      },
      {
        name: "Spanning rows",
        html: `<box-grid row-height="60px"><div data-span="4" data-row-span="2" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">Tall (4 × 2)</div><div data-span="8" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">A (8)</div><div data-span="8" style="background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:8px;padding:12px">B (8)</div></box-grid>`,
        note: "The tall region measures 144px in Chromium — two 60px rows plus the 24px gutter between them.",
      },
    ],
  },
  "drop-zone": {
    html: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>`,
    note: "`files-selected` carries both `entries` — each file with the directory it came from, so a dropped folder can be recreated — and a flat `files` list. A drop that turns out to be empty emits nothing. Browsing is a real `<button>` rather than a label wearing `role=\"button\"`, so keyboard activation comes free. Dropped folders are read whichever way the zone is configured; `directories` adds a *second* control, backed by its own `webkitdirectory` input, so files and folders are both reachable rather than either/or.",
    variants: [
      {
        name: "Compact",
        html: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>`,
        note: "The default: a small inline target that sits inside a form or panel.",
      },
      {
        name: "Hero",
        html: `<box-drop-zone variant="hero" label="Drag and drop files and folders" directories></box-drop-zone>`,
        note: "`variant=\"hero\"` is the tall centred empty state the content uploader uses — art goes in the `illustration` slot, and with `directories` set both browse controls appear.",
      },
    ],
  },
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
  "content-picker": {
    html: `<box-content-picker root-folder-id="0" token="demo-token" max-selectable="2" extensions="pdf" choose-label="Attach"></box-content-picker>`,
    setup: root => {
      const picker = root.querySelector("box-content-picker") as ContentPicker | null;
      if (!picker) {
        return;
      }
      picker.transport = createMockTransport();
      whenSessionReady(
        () => (picker.explorerState?.items.length ?? 0) > 0,
        () => picker.togglePick("123"),
      );
    },
    note: "Cross-folder pick roster over the explorer headless blocks — only PDFs are pickable here; folders stay navigable. Choose emits `chosen` with the roster.",
  },
  "content-uploader": {
    html: `<box-content-uploader folder-id="0" token="demo-token" drop-label="Upload to All Files"></box-content-uploader>`,
    setup: root => {
      const uploader = root.querySelector("box-content-uploader") as ContentUploader | null;
      if (!uploader) {
        return;
      }
      uploader.transport = createUploaderDemoTransport();
      whenSessionReady(
        () => uploader.uploaderController !== null,
        () => {
          uploader.addFiles(uploaderDemoFiles);
        },
      );
    },
    note: "Queue over the `UploadTransport` contract: one finished upload, one in flight at 62%, one failed with retry. Rows rebuild on status changes; progress patches in place. Multi-file selection, drag-and-drop and folder drops all land here; `file-limit` caps the queue at 100 by default. The empty state carries the design system's `upload-cloud` illustration and real browse buttons, and the action bar — Close, Cancel, Upload — is always present with its controls disabled rather than appearing once files land.",
    variants: [
      {
        name: "Mixed queue",
        html: `<box-content-uploader folder-id="0" token="demo-token" drop-label="Upload to All Files"></box-content-uploader>`,
        setup: root => {
          const uploader = root.querySelector("box-content-uploader") as ContentUploader | null;
          if (!uploader) {
            return;
          }
          uploader.transport = createUploaderDemoTransport();
          whenSessionReady(
            () => uploader.uploaderController !== null,
            () => {
              uploader.addFiles(uploaderDemoFiles);
            },
          );
        },
        note: "One finished upload, one in flight at 62%, one failed with retry — the three states a queue actually shows at once.",
      },
      {
        name: "Dropped folder",
        html: `<box-content-uploader folder-id="0" token="demo-token" drop-label="Upload to All Files" directories></box-content-uploader>`,
        setup: root => {
          const uploader = root.querySelector("box-content-uploader") as ContentUploader | null;
          if (!uploader) {
            return;
          }
          uploader.transport = createUploaderFolderTransport();
          whenSessionReady(
            () => uploader.uploaderController !== null,
            () => {
              uploader.addEntries(uploaderDemoEntries);
            },
          );
        },
        note: "A dropped folder arrives as entries carrying the directory each file came from, and the tree is recreated in the destination through `createFolder` — *Reports*, then *2026* and *Contracts* inside it, each created once however many files want it. A transport without `createFolder` **refuses** the drop (`folder-unsupported`) rather than flattening a hundred files into the root, which has no undo. The `directories` attribute also turns click-to-browse into a folder picker, which the platform makes either/or.",
      },
    ],
  },
  "content-sidebar": {
    html: `<box-content-sidebar heading="Quarterly Plan.pdf" collapsible>
  <box-item-details-panel slot="details" heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" status="Shared" message="Latest board-ready plan with updated forecasts."></box-item-details-panel>
  <box-annotation-thread slot="activity" heading="Activity"></box-annotation-thread>
  <box-metadata-inspector slot="metadata" heading="Metadata"></box-metadata-inspector>
</box-content-sidebar>`,
    setup: root => {
      set(root, '[slot="details"]', {
        actions: [
          { id: "share", label: "Share" },
          { id: "download", label: "Download" },
        ],
        meta: [
          { label: "Owner", value: "Morgan Lee" },
          { label: "Modified", value: "Jul 10, 2026" },
        ],
      });
      set(root, '[slot="activity"]', {
        entries: [
          { id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing before export.", toolLabel: "Comment", status: "Open" },
          { id: "a2", author: "Avery Chen", body: "Updated the draft — resolved.", toolLabel: "Highlight", status: "Resolved" },
        ],
      });
    },
    note: "Tabs resolve from which named slots have content (`details` / `activity` / `metadata` / `versions`); an explicit `tabs` attribute overrides.",
  },
  "form-wizard": {
    html: `<box-form-wizard heading="Contract intake" submit-label="Submit request">
  <div slot="parties">
    <box-text-field label="Counterparty" value="Acme Corp"></box-text-field>
    <box-text-field label="Contract owner" value="Morgan Lee"></box-text-field>
  </div>
  <div slot="terms">
    <box-text-field label="Contract value" value="$250,000"></box-text-field>
    <box-date-field label="Start date"></box-date-field>
  </div>
  <div slot="review">
    <p>Review the request, then submit for legal triage.</p>
  </div>
</box-form-wizard>`,
    setup: root => {
      set(root, "box-form-wizard", { steps: clmIntakeSteps });
    },
    note: "A step's id doubles as the slot name feeding its panel. `FormWizardController` gates Next behind per-step validators; Save draft skips validation; `submitted` fires with the value store.",
  },
  "wizard-summary": {
    html: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
    setup: wizardSummarySetup,
    note: "The wizard's review step. Sections follow **step order**, so the summary reads back in the order the wizard asked — the field list behind this demo is deliberately declared out of order to prove it. *Auto-renew* shows as **No** rather than a blank, because a negative answer is an answer; *Internal notes* was never filled in, so it shows the placeholder instead of an empty line. Edit emits `edit-requested` with the step id rather than navigating: the host owns the wizard. Each Edit button is named for its step, so a screen reader announces \"Edit Key terms\", not a fifth anonymous \"Edit\".",
    variants: [
      {
        name: "Collected answers",
        html: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
        setup: wizardSummarySetup,
        note: "Contract value carries a `format` function — which is why the fields are set as a property here, since a function cannot survive a JSON attribute.",
      },
      {
        name: "Nothing collected yet",
        html: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
        setup: root => {
          set(root, "box-wizard-summary", {
            steps: clmIntakeSteps,
            fields: clmIntakeSummaryFields,
            values: {},
          });
        },
        note: "Every row still appears, each showing the placeholder. A review card that hid unanswered questions would be hiding exactly what the reader needs to notice.",
      },
    ],
  },
  timeline: {
    html: `<box-timeline heading="Contract activity" composable has-more></box-timeline>`,
    setup: root => {
      set(root, "box-timeline", { events: clmTimelineEvents });
    },
    note: "Append-only activity spine with tone markers, evidence chips (`evidence-selected`), a `load-more` paging contract, and an optional composer emitting `entry-submitted`.",
  },
  "diff-viewer": {
    html: `<box-diff-viewer heading="Clause 4.2 — template vs executed" before-label="Template 2026" after-label="MSA_Acme"></box-diff-viewer>`,
    setup: root => {
      set(root, "box-diff-viewer", { beforeText: clmClauseBefore, afterText: clmClauseAfter });
    },
    note: "Pure line+word diff engine under a split/inline shell — synchronized scrolling by construction, word-level `del`/`ins`, stats chip, and prev/next change navigation emitting `change-focused`.",
  },
  "compare-view": {
    html: `<box-compare-view
  heading="Clause 4 — template vs executed"
  left-label="Template 2026"
  right-label="MSA_Acme v4"
  style="block-size: 22rem"
>
  <div slot="left">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twelve (12)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed the fees paid in
       the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of California, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
  </div>
  <div slot="right">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twenty-four (24)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed two times (2x) the
       fees paid in the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality and indemnification
       obligations.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of New York, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
    <h4>4.6 Assignment</h4>
    <p>Neither party may assign without the other's prior written consent,
       not to be unreasonably withheld.</p>
  </div>
</box-compare-view>`,
    note: "Scroll either pane and the other follows. The right document is **longer** than the left, which is why the default is proportional: mapping by fraction of the scrollable range keeps the two ends aligned, where matching pixel offsets would run the shorter one out early. Switch `sync-mode` to `absolute` for two renderings of the *same* document. The toolbar button disengages the lock — and re-engaging realigns straight away rather than waiting for the next scroll, so the panes never claim to be locked while sitting out of step.",
    variants: [
      {
        name: "Proportional (default)",
        html: `<box-compare-view
  heading="Clause 4 — template vs executed"
  left-label="Template 2026"
  right-label="MSA_Acme v4"
  style="block-size: 22rem"
>
  <div slot="left">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twelve (12)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed the fees paid in
       the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of California, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
  </div>
  <div slot="right">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twenty-four (24)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed two times (2x) the
       fees paid in the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality and indemnification
       obligations.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of New York, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
    <h4>4.6 Assignment</h4>
    <p>Neither party may assign without the other's prior written consent,
       not to be unreasonably withheld.</p>
  </div>
</box-compare-view>`,
        note: "Different-length documents. Drag either pane to the bottom and both land at the end together.",
      },
      {
        name: "Lock disengaged",
        html: `<box-compare-view
  heading="Clause 4 — template vs executed"
  left-label="Template 2026"
  right-label="MSA_Acme v4"
  sync="off"
  style="block-size: 22rem"
>
  <div slot="left">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twelve (12)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed the fees paid in
       the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of California, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
  </div>
  <div slot="right">
    <h4>4.1 Term</h4>
    <p>Commences on the Effective Date and continues for twenty-four (24)
       months, renewing automatically for successive twelve (12) month
       terms.</p>
    <h4>4.2 Limitation of Liability</h4>
    <p>Neither party's aggregate liability shall exceed two times (2x) the
       fees paid in the twelve (12) months preceding the claim.</p>
    <p>Excluded: breaches of confidentiality and indemnification
       obligations.</p>
    <h4>4.3 Indemnification</h4>
    <p>Each party indemnifies the other against third-party claims arising
       from its own negligence or wilful misconduct.</p>
    <h4>4.4 Governing Law</h4>
    <p>Governed by the laws of the State of New York, without regard to
       conflict-of-laws principles.</p>
    <h4>4.5 Notices</h4>
    <p>Notices must be in writing, delivered to the addresses on the cover
       page.</p>
    <h4>4.6 Assignment</h4>
    <p>Neither party may assign without the other's prior written consent,
       not to be unreasonably withheld.</p>
  </div>
</box-compare-view>`,
        note: "Panes scroll independently. Press *Scroll unlocked* to re-engage — the right pane jumps into alignment immediately.",
      },
    ],
  },
  "work-queue": {
    html: `<box-work-queue heading="My work" token="demo-token" assignee-id="morgan" reference-time="2026-08-13T12:00:00.000Z"></box-work-queue>`,
    setup: root => {
      set(root, "box-work-queue", { transport: createWorkQueueDemoTransport() });
    },
    note: "Rows group by pure due buckets (Overdue → Due today → Due this week → Later) against `reference-time`. Claim/Complete/Escalate run through the transport; Reassign emits `reassign-requested` intent for the host's confirm flow.",
  },
  "workload-board": {
    html: `<box-workload-board heading="Team workload" token="demo-token" wip-limit="2" reference-time="2026-08-13T12:00:00.000Z"></box-workload-board>`,
    setup: root => {
      set(root, "box-workload-board", {
        transport: createWorkQueueDemoTransport(),
        team: clmTeam,
      });
    },
    note: "Supervisor swimlanes by assignee (roster-ordered, visible spare capacity, overdue counts, `wip-limit` flagging) or by status via `lane-by=\"status\"` — the pipeline/kanban projection. Share one session with a queue via `queueController`.",
  },
  "version-list": {
    html: `<box-version-list heading="Version history" can-restore></box-version-list>`,
    setup: root => {
      set(root, "box-version-list", { versions: clmVersionHistory });
    },
    note: "The accessible core of the versions surface: topological newest-first rows, status tones, two-toggle compare pairing (`compare-requested` with the older side as `baseId` — the diff viewer's input), and gated Restore/Promote intent events.",
  },
  "version-graph": {
    html: `<box-version-graph heading="Version graph"></box-version-graph>`,
    setup: root => {
      set(root, "box-version-graph", { versions: clmVersionHistory });
    },
    note: "Git-network rendering of the same model — branch and merge lanes from the pure layout engine, one HTML button per node (roving arrow-key focus). Modified click pairs two nodes into `compare-requested`. Pair with `box-version-list` as the accessible fallback.",
  },
  "lineage-graph": {
    html: `<box-lineage-graph heading="Clause 4.2 lineage"></box-lineage-graph>`,
    setup: root => {
      set(root, "box-lineage-graph", { nodes: clmLineage });
    },
    note: "Provenance DAG over the shared graph engine: clause → templates → executed contracts, edges tone-coloured by deviation severity. Every edge is also a per-row chip emitting `edge-selected` with the parent/child pair — feed it straight into `box-diff-viewer`.",
  },
  "provenance-strip": {
    html: `<box-provenance-strip></box-provenance-strip>`,
    setup: root => {
      set(root, "box-provenance-strip", { nodes: clmProvenanceChain });
    },
    note: "The high-frequency lineage sibling for record headers: linear ancestry oldest → newest, newest marked current, `node-selected` on activation.",
  },
  "signature-ceremony": {
    html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4"></box-signature-ceremony>`,
    setup: root => {
      set(root, "box-signature-ceremony", { signatories: clmSignatories });
    },
    note: "Sequential by default: **exactly one** party is awaiting signature, and everyone behind them reads *Not yet their turn* rather than looking actionable. Switch `mode` to `parallel` and every unsigned party opens at once. Every state is stated in words as well as colour, and `resolveCeremony` is pure — a host can drive its reminder emails from the same function that renders this card, so the two cannot disagree about whose turn it is.",
    variants: [
      {
        name: "Sequential, mid-ceremony",
        html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4"></box-signature-ceremony>`,
        setup: root => {
          set(root, "box-signature-ceremony", { signatories: clmSignatories });
        },
        note: "One signed, one awaiting, two waiting. The counterparty cannot be invited before General Counsel has signed.",
      },
      {
        name: "Parallel",
        html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4" mode="parallel"></box-signature-ceremony>`,
        setup: root => {
          set(root, "box-signature-ceremony", { signatories: clmSignatories });
        },
        note: "The same roster sent to everyone at once: all three unsigned parties are awaiting.",
      },
      {
        name: "Declined",
        html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4"></box-signature-ceremony>`,
        setup: root => {
          set(root, "box-signature-ceremony", { signatories: clmDeclinedSignatories });
        },
        note: "The rule the component exists for. The counterparty refused, so the **witness behind them is not invited to sign** — a declined document is dead until the host revives it, and a signature collected against it would be worse than useless. Note this holds in parallel mode too, where everyone otherwise could act.",
      },
    ],
  },
  "run-trace": {
    html: `<box-run-trace heading="Generate documents — MSA_Acme v4"></box-run-trace>`,
    setup: root => {
      set(root, "box-run-trace", { steps: clmRunSteps });
    },
    note: "A machine execution trace, forward-chronological — deliberately not `box-timeline`, which is the newest-first *human* activity feed. `resolveRunSteps` is pure: an explicit status wins, a failure shadows everything queued behind it as *Skipped* (the same rule the signature ceremony applies after a decline), and timestamps derive running/succeeded/pending. The summary chip is a polite status region, so a run driven by attribute updates announces its own progress. Expand a step for its description, its child tasks with live `box-progress-bar` rows, and a `detail-<id>` slot for anything richer.",
    variants: [
      {
        name: "Running, with child tasks",
        html: `<box-run-trace heading="Generate documents — MSA_Acme v4"></box-run-trace>`,
        setup: root => {
          set(root, "box-run-trace", { steps: clmRunSteps });
        },
        note: "One step in flight; expand *Render documents* for its per-template children reporting live progress.",
      },
      {
        name: "Failed",
        html: `<box-run-trace heading="Generate documents — MSA_Acme v4"></box-run-trace>`,
        setup: root => {
          set(root, "box-run-trace", { steps: clmFailedRunSteps });
        },
        note: "The rule the engine enforces: after *Policy checks* fails, routing is **Skipped**, not queued — a dead run must not show work as still coming. The summary names the failed step.",
      },
    ],
  },
  "agent-chat": {
    html: `<box-agent-chat
  heading="Contract assistant"
  agent-name="Box AI"
  placeholder="Ask about MSA_Acme_v4…"
  token="demo-token"
></box-agent-chat>`,
    setup: root => {
      set(root, "box-agent-chat", { transport: createAgentChatDemoTransport() });
      // Ask the opening question so the preview shows a live stream rather
      // than an empty thread; the composer stays usable throughout.
      const chat = root.querySelector("box-agent-chat") as
        | (HTMLElement & { send?: (body: string) => Promise<void> })
        | null;
      setTimeout(() => void chat?.send?.("Why does clause 4.2 deviate from the template?"), 400);
    },
    note: "Type a follow-up while the reply streams — the composer lives outside the patched thread region, so it never loses what you're typing. The reply lands with **citation chips** (deep links into the lineage and diff surfaces) and a **human-in-the-loop action card**: Approve/Reject render only because this transport implements `resolveAction`, while Modify is surfaced as intent for your own editor.",
  },
  "audit-log": {
    html: `<box-audit-log heading="Audit log" group-by="day" exportable></box-audit-log>`,
    setup: auditLogSetup,
    note: "The same `TimelineEvent` records the flat feed renders, aggregated. Switch Day/Actor/Action to regroup, narrow with the facets, or click a monospace correlation id to drill down to one workflow run. Export CSV emits exactly what the filters left on screen. Day keys and labels are both UTC, so a row can never appear outside the day section holding it.",
    // Every variant carries its own setup: the docs-site only keeps live
    // setups when the *example* supplies the variants, so a page with
    // workshop variants and a single example would render an empty log.
    variants: [
      {
        name: "Grouped by day",
        html: `<box-audit-log heading="Audit log" group-by="day" exportable></box-audit-log>`,
        setup: auditLogSetup,
        note: "Newest day first with counts and actor tallies. Collapsing a section is a state flip rather than a rebuild, so scroll position and focus survive.",
      },
      {
        name: "Grouped by actor",
        html: `<box-audit-log heading="Audit log" group-by="actor" exportable></box-audit-log>`,
        setup: auditLogSetup,
        note: "Sections by descending event count, ties broken by label so order never depends on input order; unattributed events land in a trailing section.",
      },
      {
        name: "Drilled down to one workflow run",
        html: `<box-audit-log heading="Audit log" group-by="day" facet-correlation-id="wf-9042" exportable></box-audit-log>`,
        setup: auditLogSetup,
        note: "The correlation drill-down with its clear affordance. Export CSV now emits only these rows — an export never widens past what the reader filtered to.",
      },
    ],
  },
  "command-palette": {
    html: `<box-command-palette
  hotkey="mod+k"
  placeholder="Type a command or search…"
  open
></box-command-palette>`,
    setup: root => {
      set(root, "box-command-palette", { commands: clmCommands, recentIds: ["compare-versions"] });
    },
    note: "Type to filter — matching runs are highlighted, and `cv` finds *Compare versions* by initials. Focus stays in the input while ↑↓ walk the results, because the active option is named through `aria-activedescendant` rather than focused; that is what lets you keep typing. ⏎ runs it, esc closes. **Press ⌘K / Ctrl+K to reopen** — the palette is a fixed overlay, so it deliberately does not reopen itself and leave you unable to reach the page. *Archive contract* is disabled: it still ranks and stays findable, but never runs.",
  },
  "shortcuts-overlay": {
    html: `<box-shortcuts-overlay heading="Keyboard shortcuts" open></box-shortcuts-overlay>`,
    setup: shortcutsOverlaySetup,
    note: "Fed the **same** `commands` array as the palette above, and lists only the entries that declare a `shortcut` — so a shortcut cannot end up documented but unreachable, or reachable but undocumented. Each key is its own `kbd`, while the whole combination is the accessible name, so a screen reader hears \"⌘+⇧+E\" rather than \"⌘ plus ⇧ plus E\". **Press `?` to reopen** — it is a fixed overlay, so it does not re-arm itself. `?` is also deliberately dead while you are typing in a field.",
    // Each variant carries the setup: the docs-site keeps live setups only
    // when the *example* supplies the variants, so a page with workshop
    // variants and a single example renders an empty panel.
    variants: [
      {
        name: "Documented shortcuts",
        html: `<box-shortcuts-overlay heading="Keyboard shortcuts" open></box-shortcuts-overlay>`,
        setup: shortcutsOverlaySetup,
        note: "Seven of the eleven commands declare a shortcut, so seven rows appear. Grouping follows the palette's rule, with the ungrouped section trailing.",
      },
      {
        name: "Nothing documented yet",
        html: `<box-shortcuts-overlay heading="Keyboard shortcuts" open></box-shortcuts-overlay>`,
        setup: root => {
          set(root, "box-shortcuts-overlay", {
            commands: clmCommands.filter(command => !command.shortcut),
          });
        },
        note: "A catalogue with no shortcuts says so rather than rendering an empty sheet with a heading over nothing.",
      },
    ],
  },
  "path": {
    html: `<box-path label="Contract lifecycle" current="in-review"></box-path>`,
    setup: pathSetup("in-review"),
    note: "Read-only: this states where a *record* sits, which is not something a header edits. Distinct from `box-progress-steps`, which is a vertical rail for a task the reader is working through. It renders as an ordered list with the current stage marked `aria-current=\"step\"`, a visually hidden state word on every stage and a ✓ on completed ones, so sequence, position and state all survive without the chevron geometry — which is decoration, and collapses on narrow viewports. Two shapes: `chevron` (default) and `base`, the marker rail.",
    variants: [
      {
        name: "Mid-lifecycle",
        html: `<box-path label="Contract lifecycle" current="in-review"></box-path>`,
        setup: pathSetup("in-review"),
        note: "One behind, two ahead. Labels only — a chevron is too narrow to carry a description without wrapping, so the detail belongs to the base rail.",
      },
      {
        name: "Base rail",
        html: `<box-path variant="base" label="Contract lifecycle" current="in-review"></box-path>`,
        setup: pathSetup("in-review"),
        note: "A marker per stage on a connector line, label beneath. Every marker occupies the same box whatever its state, so the connector meets all of them on one line even where the current stage carries a description.",
      },
      {
        name: "Failed at the current stage",
        html: `<box-path variant="base" has-error label="Contract lifecycle" current="in-review"></box-path>`,
        setup: pathSetup("in-review"),
        note: "`has-error` fails the stage the record stopped on. The incoming connector stays brand-coloured — the record did travel that far — and the stage keeps `aria-current` while gaining `aria-invalid`.",
      },
      {
        name: "Executed",
        html: `<box-path label="Contract lifecycle" current="executed"></box-path>`,
        setup: pathSetup("executed"),
        note: "The terminal stage. Everything before it is complete.",
      },
      {
        name: "Unknown stage",
        html: `<box-path label="Contract lifecycle" current="withdrawn"></box-path>`,
        setup: pathSetup("withdrawn"),
        note: "A `current` id that is not in the list leaves every stage upcoming. Better than silently marking the whole path done because the host sent a stale value.",
      },
    ],
  },
  "due-badge": {
    html: `<box-due-badge due-at="2026-08-10T17:00:00.000Z"></box-due-badge>`,
    setup: root => {
      set(root, "box-due-badge", { referenceTime: REFERENCE_TIME });
    },
    note: "Answers *how late is this?*, so aging is stated in days rather than as a bare date — a reader should not have to subtract today from a timestamp to learn a review is three days late. Day distances are measured between UTC day boundaries, so \"tomorrow\" is 1 whether it is 23 hours away or 25. `reference-time` pins the clock here; omit it in production and it uses now.",
    variants: [
      {
        name: "Every bucket",
        html: `<box-due-badge id="due-overdue" due-at="2026-08-10T17:00:00.000Z"></box-due-badge>
<box-due-badge id="due-today" due-at="2026-08-13T17:00:00.000Z"></box-due-badge>
<box-due-badge id="due-tomorrow" due-at="2026-08-14T09:00:00.000Z"></box-due-badge>
<box-due-badge id="due-week" due-at="2026-08-18T09:00:00.000Z"></box-due-badge>
<box-due-badge id="due-later" due-at="2026-09-04T09:00:00.000Z"></box-due-badge>
<box-due-badge id="due-none"></box-due-badge>`,
        setup: root => {
          for (const badge of root.querySelectorAll("box-due-badge")) {
            (badge as HTMLElement & { referenceTime: string }).referenceTime = REFERENCE_TIME;
          }
        },
        note: "Overdue, today, tomorrow, this week, later, and no due date — all against the same pinned reference time. Only overdue and today carry status colour; the rest stay neutral so the urgent ones are the ones that shout.",
      },
      {
        name: "Compact",
        html: `<box-due-badge due-at="2026-08-10T17:00:00.000Z" compact></box-due-badge>
<box-due-badge due-at="2026-08-18T09:00:00.000Z" compact></box-due-badge>`,
        setup: root => {
          for (const badge of root.querySelectorAll("box-due-badge")) {
            (badge as HTMLElement & { referenceTime: string }).referenceTime = REFERENCE_TIME;
          }
        },
        note: "For dense table cells, where the row already says what the date is about. The full phrasing stays available to assistive tech.",
      },
    ],
  },
  "notification-bell": {
    html: `<box-notification-bell label="Notifications"></box-notification-bell>`,
    setup: root => {
      set(root, "box-notification-bell", { notifications: clmNotifications });
    },
    note: "The count is the accessible name — \"Notifications, 3 unread\" — not just a red badge, because colour alone tells a screen-reader user nothing. Past `max` the badge abbreviates to `9+` while the label keeps the true number.",
  },
  "notification-inbox": {
    html: `<box-notification-inbox heading="Notifications"></box-notification-inbox>`,
    setup: notificationInboxSetup,
    note: "Sections lead with the most unread, so what needs attention rises. Mark read and Dismiss are **intents** — the element never mutates its own list; this demo plays the host and writes back, which is why the actions take effect here.",
    // Each variant carries the setup: the docs-site keeps live setups only
    // when the *example* supplies the variants, so a page with workshop
    // variants and a single example renders an empty panel.
    variants: [
      {
        name: "Grouped triage queue",
        html: `<box-notification-inbox heading="Notifications"></box-notification-inbox>`,
        setup: notificationInboxSetup,
        note: "Approvals lead because they hold the most unread. Inside a section, unread rows come before read ones, then newest first.",
      },
      {
        name: "Unread only",
        html: `<box-notification-inbox heading="Notifications" filter="unread"></box-notification-inbox>`,
        setup: notificationInboxSetup,
        note: "Sections emptied by the filter disappear rather than rendering as zero-count headings. Mark everything read to watch the panel empty out.",
      },
    ],
  },
  "activity-density": {
    html: `<box-activity-density heading="Activity density" weeks="8"></box-activity-density>`,
    setup: root => {
      set(root, "box-activity-density", { events: clmAuditEvents, referenceTime: REFERENCE_TIME });
    },
    note: "Throughput at a glance. Days with activity are buttons in a roving-tabindex grid — arrows move by day and by week, Home/End jump to the window's ends — and each carries its own count and date as its accessible name, since colour alone carries no meaning. Selecting one emits `day-selected` with that day's events.",
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
  "indicator": {
    html: `<div style="display:grid;gap:0.4rem"><box-indicator tone="success" label="Signed"></box-indicator><box-indicator tone="warning" label="Awaiting counter-signature"></box-indicator><box-indicator tone="error" label="Rejected"></box-indicator><box-indicator tone="pending" label="Not started"></box-indicator></div>`,
  },
  "code-block": {
    html: `<box-code-block language="bash" code="bun add @unofficialbox/box-open-elements"></box-code-block>`,
  },
  "tile-group": {
    html: `<box-tile-group name="retention" legend="Retention policy" value="standard" options='[{"id":"standard","label":"Standard","description":"Delete 7 years after the contract ends."},{"id":"extended","label":"Extended","description":"Retain indefinitely; legal hold applies."}]'></box-tile-group>`,
  },
  "formatted-date": {
    html: `<box-formatted-date value="2026-08-25T14:30:00Z" date-style="medium" time-style="short" time-zone="UTC" locale="en-GB"></box-formatted-date>`,
  },
  "relative-time": {
    html: `<box-relative-time value="2026-08-21T12:00:00Z" reference-time="2026-08-25T12:00:00Z" locale="en"></box-relative-time>`,
  },
  "formatted-duration": {
    html: `<div style="display:grid;gap:0.3rem"><box-formatted-duration value="5400" locale="en-US"></box-formatted-duration><box-formatted-duration value="97928" max-units="3" format-style="long" locale="en-US"></box-formatted-duration><box-formatted-duration value="P1DT2H" format-style="narrow" locale="en-US"></box-formatted-duration></div>`,
  },
  "formatted-number": {
    html: `<div style="display:grid;gap:0.3rem"><box-formatted-number value="1234567.5" locale="en-US"></box-formatted-number><box-formatted-number value="1234.5" format-style="currency" currency="USD" locale="en-US"></box-formatted-number><box-formatted-number value="2.5" format-style="unit" unit="megabyte" unit-display="long" locale="en-US"></box-formatted-number></div>`,
  },
  "formatted-file-size": {
    html: `<box-formatted-file-size value="2517630" locale="en-US"></box-formatted-file-size>`,
  },
  "comment-thread": {
    html: `<box-comment-thread composable heading="Comments" message="Discussion on Master Services Agreement.pdf — not tied to any page." entries='[{"id":"c1","author":"Morgan Lee","body":"Finance signed off on the payment terms.","createdAt":"Yesterday, 4:12 PM","badge":"Finance","status":"Resolved"},{"id":"c2","author":"Avery Chen","body":"Still waiting on the security questionnaire before we counter-sign.","createdAt":"Today, 9:40 AM","badge":"Legal","status":"Open"}]' actions='[{"id":"resolve","label":"Resolve thread","tone":"primary"},{"id":"follow","label":"Follow"}]'></box-comment-thread>`,
  },
  "annotation-thread": {
    html: `<box-annotation-thread composable heading="Discussion" anchor='{"page":4,"quote":"Either party may terminate for convenience upon thirty (30) days written notice."}' entries='[{"id":"a1","author":"Morgan Lee","body":"Thirty days is short for this contract value — push for ninety.","createdAt":"Today, 11:02 AM","toolLabel":"Highlight","status":"Open"}]'></box-annotation-thread>`,
  },
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
