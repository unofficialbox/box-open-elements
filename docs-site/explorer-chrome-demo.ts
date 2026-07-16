/**
 * Host chrome composition for the content-explorer docs/gallery demo.
 * Imports host-bindings via a relative path so Vitest can exercise this module
 * without loading the full package barrel (which would tank coverage floors).
 *
 * Presentation (list/table) is host-owned: adapters share one
 * ContentExplorerController; filter-bar view changes toggle which surface is shown.
 */
import {
  bindFilterBarToExplorer,
  bindSavedViewPickerToExplorer,
} from "../src/patterns/content-explorer/host-bindings.js";
import type { ExplorerTransport } from "../src/patterns/content-explorer/types.js";
import { createExplorerDemoController } from "./explorer-adapter-demo.js";

export const contentExplorerChromeHtml = `<div class="explorer-host" style="display:grid;gap:0.55rem">
  <box-saved-view-picker label="Saved views"></box-saved-view-picker>
  <box-filter-bar label="Filters"></box-filter-bar>
  <p data-host-presentation aria-live="polite" style="margin:0;font-size:0.85rem;color:var(--boe-token-text-text-secondary,#6f6f6f)">Host presentation: <strong>list</strong></p>
  <box-explorer-breadcrumbs></box-explorer-breadcrumbs>
  <box-explorer-list item-gesture="split"></box-explorer-list>
  <box-explorer-table item-gesture="split" hidden></box-explorer-table>
</div>`;

export const contentExplorerChromeNote =
  "Host composition: saved-view-picker + filter-bar bound to a ContentExplorerController; list/table adapters swap via filter-bar view (onViewChange). Mock transport; inject your own ExplorerTransport in apps.";

export const explorerChromePresets = [
  { id: "plans", label: "Plans", description: "Names containing Plan", query: "Plan", resultCount: 1 },
  { id: "pdfs", label: "PDFs", description: "Names containing pdf", query: "pdf", resultCount: 2 },
  { id: "all-files", label: "All files", description: "Clear search", query: "", resultCount: 5 },
] as const;

const setProps = (root: HTMLElement, selector: string, props: Record<string, unknown>): void => {
  const element = root.querySelector(selector) as (HTMLElement & Record<string, unknown>) | null;
  if (!element) return;
  for (const [key, value] of Object.entries(props)) {
    element[key] = value;
  }
};

type PresentationMode = "list" | "table";

const applyPresentation = (
  mode: PresentationMode,
  list: HTMLElement | null,
  table: HTMLElement | null,
  label: HTMLElement | null,
): void => {
  if (list) list.hidden = mode !== "list";
  if (table) table.hidden = mode !== "table";
  if (label) label.textContent = mode;
};

/**
 * Wire saved-view-picker + filter-bar + explorer adapters inside `root`.
 * Returns an unsubscribe that removes host listeners and disconnects the controller.
 */
export const setupContentExplorerChrome = (
  root: HTMLElement,
  transport: ExplorerTransport,
): (() => void) | undefined => {
  setProps(root, "box-saved-view-picker", {
    views: explorerChromePresets.map(({ id, label, description, resultCount }) => ({
      id,
      label,
      description,
      resultCount,
    })),
    value: "",
  });
  setProps(root, "box-filter-bar", {
    filterOptions: [
      { label: "Modified", value: "modified" },
      { label: "Owner", value: "owner" },
      { label: "Type", value: "type" },
    ],
    sortOptions: [
      { label: "Name", value: "name" },
      { label: "Modified", value: "modified" },
    ],
    viewOptions: [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
    ],
    viewValue: "list",
  });

  const filterBar = root.querySelector("box-filter-bar");
  const picker = root.querySelector("box-saved-view-picker");
  const breadcrumbs = root.querySelector("box-explorer-breadcrumbs") as
    | (HTMLElement & { controller?: unknown })
    | null;
  const list = root.querySelector("box-explorer-list") as
    | (HTMLElement & { controller?: unknown })
    | null;
  const table = root.querySelector("box-explorer-table") as
    | (HTMLElement & { controller?: unknown })
    | null;
  const presentationValue =
    root.querySelector<HTMLElement>("[data-host-presentation] strong") ?? null;

  if (!filterBar || !picker || !breadcrumbs || !list || !table) {
    return undefined;
  }

  const controller = createExplorerDemoController(transport);
  breadcrumbs.controller = controller;
  list.controller = controller;
  table.controller = controller;
  applyPresentation("list", list, table, presentationValue);

  const unbindFilter = bindFilterBarToExplorer(filterBar, controller, {
    onViewChange: view => {
      const mode: PresentationMode = view === "table" ? "table" : "list";
      applyPresentation(mode, list, table, presentationValue);
    },
  });
  const unbindViews = bindSavedViewPickerToExplorer(picker, controller, {
    resolvePreset: id => explorerChromePresets.find(preset => preset.id === id),
  });

  void controller.connect();

  return () => {
    unbindFilter();
    unbindViews();
    void controller.disconnect();
  };
};
