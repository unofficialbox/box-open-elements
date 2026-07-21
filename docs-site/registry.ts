export interface CatalogEntry {
  id: string;
  tier: "components" | "patterns";
  category: string;
  tag: string;
}

const c = (category: string, ids: string[], tagPrefix = "box-"): CatalogEntry[] =>
  ids.map(id => ({ id, tier: "components" as const, category, tag: `${tagPrefix}${id}` }));

const p = (category: string, ids: string[], tagPrefix = "box-"): CatalogEntry[] =>
  ids.map(id => ({ id, tier: "patterns" as const, category, tag: `${tagPrefix}${id}` }));

export const catalog: CatalogEntry[] = [
  // Components
  ...c("Actions", ["button", "button-group", "icon-button", "link-button", "menu", "menu-item", "segmented-control"]),
  ...c("Collections", ["card", "carousel", "datalist-item", "draggable-list", "grid-view", "pagination", "table", "thumbnail-card", "tree", "tree-grid"]),
  ...c("Feedback", [
    "alert", "badge", "badgeable", "chip", "empty-state", "error-mask", "help-text", "nudge", "progress-bar", "progress-ring",
    "progress-steps", "skeleton", "spinner", "toast",
  ]),
  ...c("Files", ["drop-zone"]),
  ...c("Forms", [
    "calendar", "category-selector", "checkbox", "checkbox-group", "color-picker", "combobox", "date-field", "dropdown",
    "dual-listbox", "multi-select", "number-input", "radio-group", "range-slider", "rating",
    "fieldset", "pill-cloud", "pill-selector-dropdown", "rich-text-input", "search-field", "select", "slider", "spin-button", "switch",
    "tag-input", "text-area", "text-field", "time-field",
  ]),
  ...c("Identity", ["avatar", "contact-datalist-item", "persona"]),
  ...c("Layout", ["app-shell", "divider", "nav-sidebar", "section", "sidebar-toggle-button", "split-view"]),
  ...c("Navigation", ["accordion", "breadcrumb", "tabs"]),
  ...c("Overlays", ["context-menu", "dialog", "drawer", "popover", "tooltip"]),
  ...c("Visuals", ["illustration"]),

  // Patterns
  { id: "content-explorer", tier: "patterns", category: "Content Explorer", tag: "box-content-explorer" },
  ...p("Content Explorer", ["explorer-breadcrumbs", "explorer-toolbar", "explorer-list", "explorer-table", "explorer-items", "explorer-action-menu"], "box-"),
  ...p("Search", ["filter-bar", "search-results-header", "saved-view-picker"]),
  ...p("Item", ["item-form", "item-details-panel", "bulk-action-bar", "preview-header"]),
  ...p("Metadata", ["metadata-filter-builder", "metadata-inspector"]),
  ...p("Share", ["share-panel", "permission-matrix", "access-stats", "collaborator-avatars", "presence", "invite-collaborators-modal", "unified-share-modal"]),
  ...p("Preview", ["annotation-toolbar", "annotation-inspector", "annotation-thread", "preview-element"]),
  ...p("File Request", ["file-request-builder"]),
  ...p("Task", ["task-assignment-panel", "review-queue-item"]),
  ...p("Governance", ["governance-panel"]),
  ...p("Insights", ["metric-card", "chart-panel", "bar-chart", "line-chart", "donut-chart"]),
];

export const titleOf = (id: string): string =>
  id
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
