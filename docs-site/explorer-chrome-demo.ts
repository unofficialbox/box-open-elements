/**
 * Host chrome composition for the content-explorer docs/gallery demo.
 * Imports host-bindings via a relative path so Vitest can exercise this module
 * without loading the full package barrel (which would tank coverage floors).
 */
import {
  bindFilterBarToExplorer,
  bindSavedViewPickerToExplorer,
} from "../src/patterns/content-explorer/host-bindings.js";
import type { ExplorerTransport } from "../src/patterns/content-explorer/types.js";

export const contentExplorerChromeHtml = `<div class="explorer-host" style="display:grid;gap:0.85rem">
  <box-saved-view-picker label="Saved views"></box-saved-view-picker>
  <box-filter-bar label="Filters"></box-filter-bar>
  <p data-host-presentation aria-live="polite" style="margin:0;font-size:0.85rem;color:var(--boe-token-text-text-secondary,#6f6f6f)">Host presentation: <strong>list</strong> (explorer shell stays list; host owns list/table swap)</p>
  <box-content-explorer root-folder-id="0" token="…" page-size="25"></box-content-explorer>
</div>`;

export const contentExplorerChromeNote =
  "Host composition: saved-view-picker + filter-bar bound to explorer search via bindFilterBarToExplorer / bindSavedViewPickerToExplorer. Mock transport; inject your own ExplorerTransport in apps.";

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

/**
 * Wire saved-view-picker + filter-bar + content-explorer inside `root`.
 * Returns an unsubscribe that removes host listeners.
 */
export const setupContentExplorerChrome = (
  root: HTMLElement,
  transport: ExplorerTransport,
): (() => void) | undefined => {
  setProps(root, "box-content-explorer", { transport });
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

  const explorer = root.querySelector("box-content-explorer") as
    | (HTMLElement & { search: (q: string) => Promise<void>; clearSearch: () => Promise<void> })
    | null;
  const filterBar = root.querySelector("box-filter-bar");
  const picker = root.querySelector("box-saved-view-picker");
  const presentation = root.querySelector<HTMLElement>("[data-host-presentation]");
  if (!explorer || !filterBar || !picker) {
    return undefined;
  }

  const presentationValue = presentation?.querySelector("strong") ?? null;
  const unbindFilter = bindFilterBarToExplorer(filterBar, explorer, {
    onViewChange: view => {
      if (presentationValue) {
        presentationValue.textContent = view || "list";
      }
    },
  });
  const unbindViews = bindSavedViewPickerToExplorer(picker, explorer, {
    resolvePreset: id => explorerChromePresets.find(preset => preset.id === id),
  });

  return () => {
    unbindFilter();
    unbindViews();
  };
};
