/**
 * Host-composed metadata-query browsing surface.
 *
 * Intentionally NOT a ContentExplorerController view mode — metadata query
 * stays in patterns/metadata; the host maps query hits onto explorer adapters
 * (table + toolbar) and a metadata inspector. See docs/patterns/content-explorer.md.
 */
import { ContentExplorerController } from "../src/patterns/content-explorer/controller.js";
import type {
  ExplorerItem,
  ExplorerTransport,
} from "../src/patterns/content-explorer/types.js";
import type {
  MetadataDataSource,
  MetadataInstance,
  MetadataQueryInput,
  MetadataTemplateDefinition,
} from "../src/patterns/metadata/contracts.js";

type MetadataHit = {
  item: ExplorerItem;
  instance: MetadataInstance;
};

const owner = { id: "u1", name: "Morgan Lee", type: "user" as const };

const template: MetadataTemplateDefinition = {
  key: "contractInfo",
  label: "Contract Info",
  scope: "enterprise",
  fields: [
    { key: "classification", label: "Classification", type: "enum", options: ["internal", "confidential"] },
    { key: "department", label: "Department", type: "string" },
    { key: "value", label: "Contract value", type: "float" },
  ],
};

const catalog: MetadataHit[] = [
  {
    item: {
      id: "201",
      name: "Vendor MSA.pdf",
      type: "file",
      size: 1_200_000,
      modifiedAt: "2026-07-08T14:00:00.000Z",
      extension: "pdf",
      owner,
      sharedLink: { isShared: true, access: "company" },
      preview: { canPreview: true, extension: "pdf" },
    },
    instance: {
      scope: "enterprise",
      templateKey: "contractInfo",
      values: { classification: "confidential", department: "Legal", value: 240000 },
    },
  },
  {
    item: {
      id: "202",
      name: "Quarterly Plan.pdf",
      type: "file",
      size: 2_400_000,
      modifiedAt: "2026-07-10T18:30:00.000Z",
      extension: "pdf",
      owner,
      sharedLink: { isShared: true, access: "company" },
      preview: { canPreview: true, extension: "pdf" },
    },
    instance: {
      scope: "enterprise",
      templateKey: "contractInfo",
      values: { classification: "internal", department: "Finance", value: 0 },
    },
  },
  {
    item: {
      id: "203",
      name: "Brand Guidelines.pdf",
      type: "file",
      size: 5_120_000,
      modifiedAt: "2026-07-01T09:15:00.000Z",
      extension: "pdf",
      owner,
      sharedLink: { isShared: false },
      preview: { canPreview: true, extension: "pdf" },
    },
    instance: {
      scope: "enterprise",
      templateKey: "contractInfo",
      values: { classification: "internal", department: "Marketing", value: 0 },
    },
  },
];

const matchesFilters = (hit: MetadataHit, filters: Record<string, unknown>): boolean => {
  for (const [key, raw] of Object.entries(filters)) {
    if (raw === undefined || raw === null || raw === "") continue;
    const expected = String(raw).toLowerCase();
    const actual = String(hit.instance.values[key] ?? "").toLowerCase();
    if (!actual.includes(expected) && actual !== expected) {
      return false;
    }
  }
  return true;
};

export const createMetadataDemoDataSource = (): MetadataDataSource<MetadataHit> => ({
  async listTemplates() {
    return [template];
  },
  async listInstances({ itemId }) {
    const hit = catalog.find(entry => entry.item.id === itemId);
    return hit ? [hit.instance] : [];
  },
  async updateInstance({ instance }) {
    return instance;
  },
  async query(input: MetadataQueryInput) {
    const entries = catalog.filter(
      hit => hit.instance.templateKey === input.templateKey && matchesFilters(hit, input.filters),
    );
    return {
      entries,
      limit: input.limit ?? 25,
      offset: input.offset ?? 0,
      totalCount: entries.length,
    };
  },
});

const createResultsTransport = (getItems: () => ExplorerItem[]): ExplorerTransport => ({
  async loadFolderItems() {
    const items = getItems();
    return {
      folderId: "metadata-results",
      folder: { id: "metadata-results", name: "Metadata results", type: "folder" },
      breadcrumbs: [{ id: "metadata-results", name: "Metadata results", type: "folder" }],
      items,
      pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: items.length },
    };
  },
});

export const contentExplorerMetadataChromeHtml = `<div class="explorer-metadata-host" style="display:grid;gap:0.85rem">
  <box-metadata-filter-builder label="Metadata filters"></box-metadata-filter-builder>
  <p data-metadata-status aria-live="polite" style="margin:0;font-size:0.85rem;color:var(--boe-token-text-text-secondary,#6f6f6f)">Metadata query: <strong>3</strong> matches (host-owned; not an explorer view mode)</p>
  <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(16rem,20rem);gap:0.85rem;align-items:start">
    <div style="display:grid;gap:0.65rem;min-width:0">
      <box-explorer-toolbar></box-explorer-toolbar>
      <box-explorer-table></box-explorer-table>
    </div>
    <box-metadata-inspector heading="Metadata" eyebrow="Selected item" message="Pick a row to inspect template fields."></box-metadata-inspector>
  </div>
</div>`;

export const contentExplorerMetadataChromeNote =
  "Host composition: metadata-filter-builder drives a MetadataDataSource.query; results map onto explorer-toolbar + explorer-table via a ContentExplorerController. Metadata-inspector shows the selected hit. Not a built-in explorer view mode — see docs/patterns/content-explorer.md.";

const rulesToFilters = (rules: Array<{ field: string; value: string }>): Record<string, unknown> => {
  const filters: Record<string, unknown> = {};
  for (const rule of rules) {
    if (rule.field && rule.value) filters[rule.field] = rule.value;
  }
  return filters;
};

const inspectorSectionsFor = (hit: MetadataHit | undefined) => {
  if (!hit) return [];
  return [
    {
      title: template.label,
      fields: template.fields.map(field => ({
        label: field.label,
        value: String(hit.instance.values[field.key] ?? "—"),
      })),
    },
  ];
};

/**
 * Wire metadata-filter-builder + explorer adapters + metadata-inspector.
 * Returns cleanup that disconnects the controller and listeners.
 */
export const setupContentExplorerMetadataChrome = (
  root: HTMLElement,
  dataSource: MetadataDataSource<MetadataHit> = createMetadataDemoDataSource(),
): (() => void) | undefined => {
  const builder = root.querySelector("box-metadata-filter-builder") as
    | (HTMLElement & {
        fields: Array<{ id: string; label: string }>;
        rules: Array<{ field: string; operator: string; value: string }>;
      })
    | null;
  const toolbar = root.querySelector("box-explorer-toolbar") as
    | (HTMLElement & { controller?: ContentExplorerController })
    | null;
  const table = root.querySelector("box-explorer-table") as
    | (HTMLElement & { controller?: ContentExplorerController })
    | null;
  const inspector = root.querySelector("box-metadata-inspector") as
    | (HTMLElement & {
        sections: unknown[];
        heading: string;
        message: string;
      })
    | null;
  const statusStrong = root.querySelector<HTMLElement>("[data-metadata-status] strong");
  if (!builder || !toolbar || !table || !inspector) {
    return undefined;
  }

  let currentHits: MetadataHit[] = [];
  const getItems = (): ExplorerItem[] => currentHits.map(hit => hit.item);

  const controller = new ContentExplorerController({
    rootFolderId: "metadata-results",
    token: "docs-token",
    transport: createResultsTransport(getItems),
    itemActions: [
      { id: "share", label: "Share" },
      { id: "download", label: "Download", itemTypes: ["file"] },
    ],
  });
  toolbar.controller = controller;
  table.controller = controller;

  builder.fields = template.fields.map(field => ({ id: field.key, label: field.label }));
  builder.rules = [{ field: "classification", operator: "is", value: "internal" }];

  const applyQuery = async (): Promise<void> => {
    const page = await dataSource.query({
      templateKey: template.key,
      scope: template.scope,
      filters: rulesToFilters(builder.rules),
    });
    currentHits = page.entries;
    if (statusStrong) statusStrong.textContent = String(page.totalCount ?? page.entries.length);
    if (controller.getState().connected) {
      await controller.refresh();
    } else {
      await controller.connect();
    }
    const selectedId = controller.getState().selectedItemIds[0];
    const selected = currentHits.find(hit => hit.item.id === selectedId) ?? currentHits[0];
    if (selected && !selectedId) {
      controller.select([selected.item.id]);
    }
    const hit = currentHits.find(entry => entry.item.id === controller.getState().selectedItemIds[0]);
    inspector.heading = hit?.item.name ?? "Metadata";
    inspector.message = hit
      ? `${template.label} · ${template.scope}`
      : "Pick a row to inspect template fields.";
    inspector.sections = inspectorSectionsFor(hit);
  };

  const onRulesChanged = (): void => {
    void applyQuery();
  };
  const onSelectionChanged = (event: Event): void => {
    const ids = (event as CustomEvent<{ selectedItemIds?: string[] }>).detail?.selectedItemIds ?? [];
    const hit = currentHits.find(entry => entry.item.id === ids[0]);
    inspector.heading = hit?.item.name ?? "Metadata";
    inspector.message = hit
      ? `${template.label} · ${template.scope}`
      : "Pick a row to inspect template fields.";
    inspector.sections = inspectorSectionsFor(hit);
  };

  builder.addEventListener("value-changed", onRulesChanged);
  builder.addEventListener("rule-added", onRulesChanged);
  builder.addEventListener("rule-removed", onRulesChanged);
  table.addEventListener("selection-changed", onSelectionChanged);
  // Controller emits through adapter elements as DOM events in some paths;
  // also subscribe directly for reliability.
  const unsubscribe = controller.subscribe("selectionChanged", ({ selectedItemIds }) => {
    const hit = currentHits.find(entry => entry.item.id === selectedItemIds[0]);
    inspector.heading = hit?.item.name ?? "Metadata";
    inspector.message = hit
      ? `${template.label} · ${template.scope}`
      : "Pick a row to inspect template fields.";
    inspector.sections = inspectorSectionsFor(hit);
  });

  void applyQuery();

  return () => {
    builder.removeEventListener("value-changed", onRulesChanged);
    builder.removeEventListener("rule-added", onRulesChanged);
    builder.removeEventListener("rule-removed", onRulesChanged);
    table.removeEventListener("selection-changed", onSelectionChanged);
    unsubscribe();
    void controller.disconnect();
  };
};
