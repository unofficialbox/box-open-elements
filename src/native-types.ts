/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: bun run types:generate
 * Native custom-element properties and CustomEvent details from component source.
 * Type-only: importing this entry never registers or renders an element.
 */
import type { BoxElementTagName } from "./element-maps.js";

/** Writable class properties declared by each element, excluding DOM members. */
export interface BoxElementPropertyKeys {
  "box-access-stats": "label" | "stats";
  "box-accordion": "borderless" | "items" | "label" | "multiple" | "plainPanels" | "value" | "values";
  "box-activity-density": "events" | "heading" | "referenceTime" | "weeks";
  "box-agent-chat": "agentName" | "chatController" | "heading" | "placeholder" | "token" | "transport";
  "box-agent-workspace": "panes" | "workspaceController";
  "box-alert": "description" | "heading" | "message" | "open" | "tone";
  "box-annotation-inspector": "actions" | "annotation" | "composable" | "heading" | "message";
  "box-annotation-thread": "anchor" | "entries";
  "box-annotation-toolbar": "actions" | "activeToolId" | "colorOptions" | "currentColor" | "label" | "tools";
  "box-app-shell": "asideLabel" | "heading" | "navLabel";
  "box-audit-log": "events" | "exportable" | "facets" | "groupBy" | "heading" | "headingHeight" | "referenceTime" | "rowHeight" | "virtualize";
  "box-avatar": "alt" | "badge" | "initials" | "name" | "size" | "src" | "tone";
  "box-badge": "hideWhenZero" | "label" | "max" | "tone";
  "box-badgeable": never;
  "box-bar-chart": "actions" | "heading" | "legend" | "message" | "points" | "summary" | "timeframe";
  "box-breadcrumb": "items" | "label" | "maxItems";
  "box-bulk-action-bar": "actions" | "clearLabel" | "count" | "items" | "label" | "message";
  "box-button": "accessibleLabel" | "disabled" | "isLoading" | "label" | "size" | "tone" | "type";
  "box-button-group": "label" | "layout" | "options" | "value";
  "box-calendar": "disabled" | "end" | "max" | "min" | "mode" | "month" | "start" | "today" | "value";
  "box-call-console": "callController" | "heading" | "isFailed" | "serviceLabels";
  "box-card": "eyebrow" | "heading";
  "box-carousel": "items" | "label" | "value";
  "box-category-selector": "label" | "maxLinks" | "options" | "value";
  "box-chart-panel": "actions" | "heading" | "legend" | "message" | "points" | "summary" | "timeframe";
  "box-check-list": "rows";
  "box-checkbox": "checked" | "description" | "disabled" | "indeterminate" | "label" | "value";
  "box-checkbox-group": "disabled" | "label" | "options" | "value";
  "box-chip": "disabled" | "label" | "removable" | "selectable" | "selected" | "size" | "tone" | "value";
  "box-code-block": "code" | "copyLabel" | "label" | "language";
  "box-code-editor": "bracketColors" | "completionSource" | "completions" | "currentLineStyle" | "fillHeight" | "hideHelp" | "hideProblems" | "highlights" | "label" | "language" | "passKeys" | "problems" | "readonly" | "selection" | "value" | "wrap";
  "box-collaborator-avatars": "collaborators" | "label" | "max";
  "box-color-picker": "disabled" | "label" | "swatches" | "value";
  "box-combobox": "disabled" | "label" | "options" | "placeholder" | "placement" | "value";
  "box-command-palette": "commands" | "hideDisabled" | "hotkey" | "open" | "placeholder" | "recentIds";
  "box-comment-thread": "actions" | "composable" | "composerLabel" | "entries" | "heading" | "message" | "placeholder" | "selectedEntryId";
  "box-compare-view": "heading" | "leftLabel" | "rightLabel" | "sync" | "syncMode";
  "box-contact-datalist-item": "disabled" | "email" | "external" | "name" | "selected" | "src" | "subtitle" | "value";
  "box-content-explorer": "itemActions" | "itemGesture" | "language" | "pageSize" | "rootFolderId" | "searchQuery" | "selectionMode" | "templates" | "token" | "transport";
  "box-content-picker": "cancelLabel" | "chooseLabel" | "extensions" | "language" | "maxSelectable" | "pageSize" | "rootFolderId" | "selectableTypes" | "token" | "transport";
  "box-content-sidebar": "activeTab" | "collapsed" | "collapsible" | "heading" | "tabs";
  "box-content-uploader": "autoStart" | "closable" | "concurrency" | "directories" | "dropLabel" | "dropMessage" | "extensions" | "fileLimit" | "folderId" | "language" | "maxFileSize" | "token" | "transport";
  "box-context-menu": "disabled" | "items";
  "box-datalist-item": "active" | "disabled" | "icon" | "label" | "meta" | "selected" | "value";
  "box-date-field": "clearable" | "disabled" | "label" | "max" | "min" | "value";
  "box-dialog": "confirmBusy" | "confirmBusyLabel" | "confirmDisabled" | "confirmLabel" | "description" | "heading" | "open" | "size";
  "box-diff-viewer": "afterLabel" | "afterText" | "beforeLabel" | "beforeText" | "heading" | "mode";
  "box-divider": "label" | "orientation";
  "box-document-list": "items";
  "box-donut-chart": "actions" | "heading" | "message" | "segments" | "summary" | "timeframe";
  "box-draggable-list": "items" | "label";
  "box-drawer": "busy" | "description" | "heading" | "hideCloseButton" | "open" | "position" | "size";
  "box-drop-zone": "accept" | "browseLabel" | "description" | "directories" | "folderLabel" | "label" | "message" | "variant";
  "box-dropdown": "disabled" | "items" | "label" | "placement" | "value";
  "box-dual-listbox": "disabled" | "label" | "options" | "value";
  "box-due-badge": "compact" | "dueAt" | "label" | "referenceTime";
  "box-empty-state": "actionLabel" | "description" | "heading" | "message";
  "box-error-mask": "actionLabel" | "description" | "heading" | "message";
  "box-explorer-action-menu": "controller" | "itemId";
  "box-explorer-breadcrumbs": "controller";
  "box-explorer-items": never;
  "box-explorer-list": "controller" | "itemGesture";
  "box-explorer-table": "controller" | "itemGesture";
  "box-explorer-toolbar": "controller";
  "box-fact-list": "rows";
  "box-fieldset": "description" | "disabled" | "label";
  "box-file-request-builder": "fields" | "heading" | "message" | "settings" | "value";
  "box-filter-bar": "filterOptions" | "filters" | "label" | "query" | "sortOptions" | "sortValue" | "viewOptions" | "viewValue";
  "box-flow-builder": "catalog" | "endLabel" | "headingLevel" | "model" | "nodes" | "renderInspector" | "selected" | "startLabel";
  "box-flow-card": "catalog" | "figure" | "invalid" | "model" | "node" | "selected";
  "box-flow-spine": "catalog" | "endLabel" | "figures" | "headingLevel" | "invalid" | "model" | "nodes" | "selected" | "startLabel";
  "box-form-wizard": "draftLabel" | "heading" | "initialValues" | "stepStatuses" | "steps" | "stepsLayout" | "submitLabel" | "validators";
  "box-formatted-date": "dateStyle" | "timeStyle" | "timeZone" | "value";
  "box-formatted-duration": "formatStyle" | "maxUnits" | "value";
  "box-formatted-file-size": "units" | "value";
  "box-formatted-number": "currency" | "formatStyle" | "unit" | "unitDisplay" | "value";
  "box-governance-panel": "actions" | "heading" | "message" | "policies" | "signals" | "status";
  "box-grid": "columns" | "rowHeight";
  "box-grid-view": "items" | "label" | "value";
  "box-guide-tooltip": "heading" | "htmlFor" | "open" | "placement" | "step" | "total";
  "box-help-text": "description" | "label" | "message" | "tone";
  "box-icon-button": "disabled" | "icon" | "label" | "tone";
  "box-illustration": "asset" | "caption" | "heading" | "message" | "shape";
  "box-indicator": "label" | "tone";
  "box-insert-point": "detail";
  "box-invite-collaborators-modal": "heading" | "itemId" | "open" | "roles" | "submitLabel" | "transport";
  "box-item-details-panel": "actions" | "eyebrow" | "heading" | "message" | "meta" | "owner" | "status";
  "box-item-form": "disabled" | "fields" | "label" | "mode" | "submitLabel" | "value";
  "box-kind-picker": "catalog" | "searchable" | "variant";
  "box-line-chart": "actions" | "heading" | "legend" | "message" | "points" | "summary" | "timeframe";
  "box-lineage-graph": "arrows" | "heading" | "nodes";
  "box-link-button": "href" | "label" | "rel" | "target" | "tone";
  "box-menu": "disabled" | "items" | "label";
  "box-menu-item": "disabled" | "label" | "selected" | "value";
  "box-metadata-filter-builder": "fields" | "label" | "rules";
  "box-metadata-inspector": "eyebrow" | "heading" | "message" | "sections";
  "box-metric-card": "action" | "eyebrow" | "heading" | "message" | "status" | "trend" | "value";
  "box-mode-indicator": "detail" | "interactive" | "mode" | "namePrefix";
  "box-multi-select": "label" | "options" | "value";
  "box-nav-sidebar": "collapsed" | "label";
  "box-notification-bell": "expanded" | "label" | "max" | "notifications" | "unreadCount";
  "box-notification-inbox": "filter" | "heading" | "notifications" | "typeLabels";
  "box-nudge": "actionLabel" | "heading" | "message" | "open";
  "box-number-input": "disabled" | "label" | "max" | "min" | "placeholder" | "step" | "value";
  "box-pagination": "page" | "pageSize" | "totalItems";
  "box-path": "current" | "hasError" | "label" | "stages" | "variant";
  "box-permission-matrix": "label" | "options" | "subjects" | "value";
  "box-persona": "description" | "initials" | "name" | "size" | "src" | "status" | "subtitle" | "tone";
  "box-pill-cloud": "label" | "options" | "value";
  "box-pill-selector-dropdown": "allowCustom" | "label" | "options" | "pattern" | "placeholder" | "value";
  "box-popover": "disabled" | "label" | "open" | "placement";
  "box-presence": "label" | "max" | "transport" | "users";
  "box-preview-element": "actions" | "adapterState" | "heading" | "itemLabel" | "message" | "provider" | "providerAdapter" | "providerLabel" | "status";
  "box-preview-header": "actions" | "breadcrumbs" | "heading" | "message" | "status";
  "box-process-modeler": "catalog" | "connections" | "detail" | "disableConnections" | "document" | "embedMode" | "fields" | "headingLevel" | "history" | "lastRun" | "layout" | "locked" | "model" | "outline" | "processSummary" | "processTitle" | "renderInspector" | "selectedPath" | "showLastRun" | "snapToGrid" | "variables";
  "box-progress-bar": "hideLabel" | "label" | "max" | "value";
  "box-progress-ring": "label" | "max" | "size" | "value";
  "box-progress-steps": "compact" | "items" | "label" | "value";
  "box-provenance-strip": "nodes";
  "box-radio-group": "disabled" | "label" | "options" | "value";
  "box-range-slider": "disabled" | "end" | "label" | "max" | "min" | "start" | "step";
  "box-rating": "disabled" | "label" | "max" | "value";
  "box-relative-time": "numeric" | "referenceTime" | "value";
  "box-resource-row": "active" | "disabled" | "label" | "meta" | "selected" | "status" | "value";
  "box-result-blocks": "blocks" | "labels" | "selectableDocuments";
  "box-review-queue-item": "actions" | "assignee" | "dueDate" | "heading" | "itemLabel" | "message" | "metrics" | "priority" | "status";
  "box-rich-text-input": "disabled" | "label" | "placeholder" | "value";
  "box-run-summary": "open" | "turn";
  "box-run-trace": "heading" | "steps";
  "box-saved-view-picker": "label" | "value" | "views";
  "box-search-field": "disabled" | "label" | "loading" | "placeholder" | "value";
  "box-search-results-header": "actions" | "filters" | "label" | "query" | "resultCount" | "scope" | "sortLabel" | "viewLabel";
  "box-section": "description" | "eyebrow" | "heading";
  "box-segmented-control": "disabled" | "label" | "layout" | "options" | "value";
  "box-select": "disabled" | "emptyText" | "label" | "loading" | "multiple" | "options" | "value" | "values";
  "box-share-panel": "actions" | "collaborators" | "heading" | "message" | "settings" | "sharedLink";
  "box-shortcuts-overlay": "commands" | "heading" | "hotkey" | "open";
  "box-sidebar-toggle-button": "controls" | "direction" | "disabled" | "expanded" | "label";
  "box-signature-ceremony": "heading" | "mode" | "signatories";
  "box-skeleton": "columns" | "height" | "items" | "lines" | "rowHeight" | "rows" | "variant" | "width";
  "box-slider": "disabled" | "label" | "max" | "min" | "step" | "value";
  "box-spin-button": "disabled" | "label" | "max" | "min" | "step" | "value";
  "box-spinner": "label" | "size";
  "box-split-view": "collapse" | "detailOpen" | "label" | "ratio" | "resizable";
  "box-status-icon": "kind" | "label";
  "box-switch": "checked" | "description" | "disabled" | "label" | "value";
  "box-table": "columns" | "emptyText" | "errorText" | "label" | "loading" | "rowHeight" | "rows" | "selectedIds" | "selectionMode" | "virtualize";
  "box-tabs": "label" | "layout" | "options" | "value";
  "box-tag-input": "disabled" | "label" | "max" | "placeholder" | "tags" | "value";
  "box-task-assignment-panel": "actions" | "assignees" | "checklist" | "currentAssigneeId" | "dueDate" | "heading" | "message" | "priority" | "status";
  "box-text-area": "disabled" | "label" | "placeholder" | "rows" | "value";
  "box-text-field": "autocomplete" | "disabled" | "label" | "loading" | "placeholder" | "reveal" | "revealLabel" | "type" | "valid" | "value";
  "box-thumbnail-card": "cardTitle" | "interactive" | "subtitle";
  "box-tile-group": "legend" | "multiple" | "name" | "options" | "value";
  "box-time-field": "disabled" | "label" | "max" | "min" | "step" | "value";
  "box-timeline": "composable" | "events" | "hasMore" | "heading";
  "box-toast": "borderless" | "duration" | "heading" | "message" | "mode" | "open" | "tone";
  "box-toolbar": "label" | "orientation";
  "box-tooltip": "label" | "open" | "placement" | "theme" | "triggerLabel";
  "box-tree": "items" | "label" | "value";
  "box-tree-grid": "columns" | "items" | "label" | "value";
  "box-unified-share-modal": "dataSource" | "heading" | "itemId" | "itemType" | "open";
  "box-verdict-banner": "announce" | "heading" | "headingLevel" | "reasons" | "size" | "tone";
  "box-version-graph": "arrows" | "heading" | "versions";
  "box-version-list": "canPromote" | "canRestore" | "heading" | "versions";
  "box-wizard-summary": "editLabel" | "emptyText" | "fields" | "heading" | "steps" | "values";
  "box-work-queue": "assigneeId" | "heading" | "queueController" | "referenceTime" | "token" | "transport";
  "box-workload-board": "heading" | "laneBy" | "queueController" | "referenceTime" | "team" | "token" | "transport" | "wipLimit";
}

/** Events dispatched by each element, with inferred native detail payloads. */
export interface BoxElementEventMap {
  "box-access-stats": {};
  "box-accordion": {
    "value-changed": CustomEvent<{ value: string; }>;
    "values-changed": CustomEvent<{ values: string[]; }>;
  };
  "box-activity-density": {
    "day-selected": CustomEvent<{ date: string; count: number; events: import("./patterns/timeline/types.js").TimelineEvent[]; }>;
  };
  "box-agent-chat": {
    "citation-selected": CustomEvent<{ citation: import("./patterns/agent-chat/types.js").AgentCitation; messageId: string; }>;
    "proposal-modify-requested": CustomEvent<{ proposalId: string; messageId: string; }>;
  };
  "box-agent-workspace": {
    "chats-change": CustomEvent<{ ids: string[]; activeId: string | null; }>;
    "conversation-selected": CustomEvent<{ id: string; }>;
    "pane-change": CustomEvent<{ pane: "details" | "chats"; open: boolean; mobile: boolean; }>;
  };
  "box-alert": {
    "dismiss": CustomEvent<unknown>;
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-annotation-inspector": {
    "action": CustomEvent<{ action: string; annotationId: string | null; }>;
    "reply-selected": CustomEvent<{ index: number; annotationId: string | null; author: string; body: string; createdAt?: string | undefined; id?: string | undefined; initials?: string | undefined; }>;
    "reply-submitted": CustomEvent<{ annotationId: string | null; body: string; }>;
  };
  "box-annotation-thread": {};
  "box-annotation-toolbar": {
    "action": CustomEvent<{ action: string; }>;
    "color-selected": CustomEvent<{ id: string; label: string; value: string; }>;
    "tool-selected": CustomEvent<{ disabled?: boolean | undefined; icon?: string | undefined; id: string; label: string; }>;
  };
  "box-app-shell": {};
  "box-audit-log": {
    "correlation-selected": CustomEvent<{ correlationId: string; events: import("./patterns/timeline/types.js").TimelineEvent[]; }>;
    "event-selected": CustomEvent<{ event: import("./patterns/timeline/types.js").TimelineEvent; }>;
    "evidence-selected": CustomEvent<{ event: import("./patterns/timeline/types.js").TimelineEvent | undefined; evidence: import("./patterns/timeline/types.js").TimelineEvidence; }>;
    "export-requested": CustomEvent<{ format: string; csv: string; events: import("./patterns/timeline/types.js").TimelineEvent[]; }>;
    "facets-changed": CustomEvent<{ facets: import("./patterns/audit/types.js").AuditFacets; }>;
    "group-by-changed": CustomEvent<{ groupBy: import("./patterns/audit/types.js").AuditGroupBy; }>;
    "group-toggled": CustomEvent<{ key: string; expanded: boolean; }>;
  };
  "box-avatar": {};
  "box-badge": {};
  "box-badgeable": {};
  "box-bar-chart": {
    "action": CustomEvent<{ action: string; }>;
    "point-selected": CustomEvent<{ id: string; label: string; tone?: string | undefined; value: number; }>;
  };
  "box-breadcrumb": {
    "navigate": CustomEvent<{ value: string; href: string | undefined; }>;
  };
  "box-bulk-action-bar": {
    "action": CustomEvent<{ action: string; count: number; items: ({ description?: string | undefined; id?: string | undefined; label: string; })[]; }>;
    "clear": CustomEvent<{ count: number; items: ({ description?: string | undefined; id?: string | undefined; label: string; })[]; }>;
  };
  "box-button": {};
  "box-button-group": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-calendar": {
    "month-changed": CustomEvent<{ month: string; }>;
    "range-changed": CustomEvent<{ end: string; start: string; }>;
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-call-console": {
    "call-selected": CustomEvent<{ id: string; }>;
    "calls-cleared": CustomEvent<unknown>;
    "filters-changed": CustomEvent<{ service: string; errorsOnly: boolean; query: string; }>;
  };
  "box-card": {};
  "box-carousel": {
    "value-changed": CustomEvent<{ value: number; }>;
  };
  "box-category-selector": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-chart-panel": {
    "action": CustomEvent<{ action: string; }>;
    "point-selected": CustomEvent<{ id: string; label: string; tone?: string | undefined; value: number; }>;
  };
  "box-check-list": {};
  "box-checkbox": {
    "checked-changed": CustomEvent<{ checked: boolean; }>;
  };
  "box-checkbox-group": {
    "value-changed": CustomEvent<{ value: string[]; }>;
  };
  "box-chip": {
    "remove": CustomEvent<{ value: string; }>;
    "select": CustomEvent<{ value: string; selected: boolean; }>;
  };
  "box-code-block": {
    "code-copied": CustomEvent<{ copied: boolean; }>;
  };
  "box-code-editor": {
    "selection-changed": CustomEvent<{ anchor: number; head: number; }>;
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-collaborator-avatars": {
    "overflow": CustomEvent<{ count: number; }>;
    "select": CustomEvent<{ id: string | undefined; name: string; }>;
  };
  "box-color-picker": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-combobox": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-command-palette": {
    "command-selected": CustomEvent<{ command: import("./components/overlays/command-types.js").CommandDescriptor; }>;
    "dismissed": CustomEvent<unknown>;
  };
  "box-comment-thread": {
    "action": CustomEvent<{ action: string; selectedEntryId: string | null; }>;
    "entry-selected": CustomEvent<{ author: string; badge?: string | undefined; body: string; createdAt?: string | undefined; id: string; initials?: string | undefined; status?: string | undefined; }>;
    "entry-submitted": CustomEvent<{ body: string; inReplyToId: string | null; }>;
  };
  "box-compare-view": {
    "sync-toggled": CustomEvent<{ sync: boolean; }>;
  };
  "box-contact-datalist-item": {
    "select": CustomEvent<{ value: string; }>;
  };
  "box-content-explorer": {};
  "box-content-picker": {
    "item-activated": CustomEvent<{ item: import("./patterns/content-explorer/types.js").ExplorerItem; }>;
  };
  "box-content-sidebar": {
    "collapsed-changed": CustomEvent<{ collapsed: boolean; }>;
    "tab-changed": CustomEvent<{ tabId: string; }>;
  };
  "box-content-uploader": {
    "close": CustomEvent<unknown>;
  };
  "box-context-menu": {
    "item-selected": CustomEvent<import("./components/overlays/context-menu.js").ContextMenuItem>;
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-datalist-item": {
    "select": CustomEvent<{ value: string; }>;
  };
  "box-date-field": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-dialog": {
    "cancel": CustomEvent<unknown>;
    "confirm": CustomEvent<unknown>;
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-diff-viewer": {
    "change-focused": CustomEvent<{ index: number; total: number; }>;
  };
  "box-divider": {};
  "box-document-list": {};
  "box-donut-chart": {
    "action": CustomEvent<{ action: string; }>;
    "segment-selected": CustomEvent<{ id: string; label: string; tone?: string | undefined; value: number; }>;
  };
  "box-draggable-list": {
    "reorder": CustomEvent<{ value: string; from: number; to: number; items: ({ value: string; label: string; })[]; }>;
  };
  "box-drawer": {
    "dismiss": CustomEvent<import("./components/overlays/drawer.js").DrawerDismissDetail>;
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-drop-zone": {
    "files-selected": CustomEvent<{ entries: import("./foundations/files/directory-entries.js").UploadEntry[]; files: File[]; skipped: string[]; }>;
  };
  "box-dropdown": {
    "value-changed": CustomEvent<{ value: string; item: ({ id: string; label: string; }); }>;
  };
  "box-dual-listbox": {
    "value-changed": CustomEvent<{ value: string[]; }>;
  };
  "box-due-badge": {};
  "box-empty-state": {
    "action": CustomEvent<{ action: string; label: string; }>;
  };
  "box-error-mask": {
    "retry": CustomEvent<{ label: string; }>;
  };
  "box-explorer-action-menu": {
    "items-changed": CustomEvent<{ items: import("./patterns/content-explorer/types.js").ExplorerItem[]; }>;
  };
  "box-explorer-breadcrumbs": {};
  "box-explorer-items": {};
  "box-explorer-list": {};
  "box-explorer-table": {};
  "box-explorer-toolbar": {};
  "box-fact-list": {};
  "box-fieldset": {};
  "box-file-request-builder": {
    "action": CustomEvent<{ action: string; value: { [x: string]: string | boolean; }; }>;
    "value-changed": CustomEvent<{ value: { [x: string]: string | boolean; }; }>;
  };
  "box-filter-bar": {
    "search": CustomEvent<{ value: ({ filters: string[]; query: string; sort: string; view: string; }); }>;
    "value-changed": CustomEvent<{ value: ({ filters: string[]; query: string; sort: string; view: string; }); }>;
  };
  "box-flow-builder": {
    "flow-changed": CustomEvent<{ nodes: unknown[]; node: unknown; reason: string; }>;
    "narrow-changed": CustomEvent<{ narrow: boolean; }>;
    "selection-changed": CustomEvent<{ node: unknown | null; }>;
  };
  "box-flow-card": {};
  "box-flow-spine": {};
  "box-form-wizard": {};
  "box-formatted-date": {};
  "box-formatted-duration": {};
  "box-formatted-file-size": {};
  "box-formatted-number": {};
  "box-governance-panel": {
    "action": CustomEvent<{ action: string; }>;
    "policy-selected": CustomEvent<{ description?: string | undefined; label: string; tone?: string | undefined; value: string; }>;
  };
  "box-grid": {};
  "box-grid-view": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-guide-tooltip": {
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-help-text": {};
  "box-icon-button": {};
  "box-illustration": {};
  "box-indicator": {};
  "box-insert-point": {};
  "box-invite-collaborators-modal": {
    "submitted": CustomEvent<{ result: import("./patterns/share/invite-collaborators-contracts.js").InviteResult | null; }>;
  };
  "box-item-details-panel": {
    "action": CustomEvent<{ action: string; }>;
  };
  "box-item-form": {
    "cancel": CustomEvent<{ value: { [x: string]: string | boolean; }; }>;
    "submit": CustomEvent<{ value: { [x: string]: string | boolean; }; }>;
    "value-changed": CustomEvent<{ value: { [x: string]: string | boolean; }; }>;
  };
  "box-kind-picker": {};
  "box-line-chart": {
    "action": CustomEvent<{ action: string; }>;
    "point-selected": CustomEvent<{ id: string; label: string; tone?: string | undefined; value: number; }>;
  };
  "box-lineage-graph": {
    "edge-selected": CustomEvent<{ note?: string | undefined; parent: import("./patterns/lineage/types.js").LineageNode; child: import("./patterns/lineage/types.js").LineageNode; deviation: import("./patterns/lineage/types.js").LineageDeviation; }>;
    "node-selected": CustomEvent<{ node: import("./patterns/lineage/types.js").LineageNode; }>;
  };
  "box-link-button": {};
  "box-menu": {
    "item-selected": CustomEvent<{ disabled?: boolean | undefined; id: string; label: string; separator?: boolean | undefined; header?: boolean | undefined; href?: string | undefined; checked?: boolean | undefined; }>;
  };
  "box-menu-item": {
    "selected": CustomEvent<{ value: string; label: string; }>;
  };
  "box-metadata-filter-builder": {
    "rule-added": CustomEvent<{ count: number; }>;
    "rule-removed": CustomEvent<{ index: number; rule: ({ field: string; operator: string; value: string; }); }>;
    "value-changed": CustomEvent<{ value: ({ field: string; operator: string; value: string; })[]; }>;
  };
  "box-metadata-inspector": {
    "field-selected": CustomEvent<{ label: string; section: string; value: string; }>;
  };
  "box-metric-card": {
    "action": CustomEvent<{ id: string; label: string; tone?: string | undefined; }>;
  };
  "box-mode-indicator": {
    "activate": CustomEvent<unknown>;
  };
  "box-multi-select": {
    "value-changed": CustomEvent<{ value: string[]; }>;
  };
  "box-nav-sidebar": {};
  "box-notification-bell": {
    "toggle": CustomEvent<{ expanded: boolean; unreadCount: number; }>;
  };
  "box-notification-inbox": {};
  "box-nudge": {
    "action": CustomEvent<{ label: string; }>;
    "dismiss": CustomEvent<unknown>;
  };
  "box-number-input": {
    "value-changed": CustomEvent<{ value: number; }>;
  };
  "box-pagination": {
    "page-changed": CustomEvent<{ page: number; }>;
  };
  "box-path": {};
  "box-permission-matrix": {
    "subject-role-changed": CustomEvent<{ subjectId: string; value: string; }>;
    "value-changed": CustomEvent<{ value: { [x: string]: string; }; }>;
  };
  "box-persona": {};
  "box-pill-cloud": {
    "value-changed": CustomEvent<{ value: string[]; }>;
  };
  "box-pill-selector-dropdown": {
    "invalid-entry": CustomEvent<{ value: string; }>;
    "value-changed": CustomEvent<{ value: string[]; }>;
  };
  "box-popover": {
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-presence": {};
  "box-preview-element": {
    "action": CustomEvent<{ action: string; adapterState: import("./patterns/preview/provider-adapter.js").PreviewAdapterState | null; provider: import("./patterns/preview/provider-adapter.js").PreviewProvider | null; providerId: string | null; }>;
    "action-error": CustomEvent<{ action: string; message: string; }>;
    "command": CustomEvent<{ command: import("./patterns/preview/provider-adapter.js").PreviewCommand; providerId: string | null; }>;
  };
  "box-preview-header": {
    "action": CustomEvent<{ action: string; }>;
    "breadcrumb-selected": CustomEvent<{ id: string; }>;
  };
  "box-process-modeler": {};
  "box-progress-bar": {};
  "box-progress-ring": {};
  "box-progress-steps": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-provenance-strip": {
    "node-selected": CustomEvent<{ node: import("./patterns/lineage/types.js").LineageNode; }>;
  };
  "box-radio-group": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-range-slider": {
    "value-changed": CustomEvent<{ start: number; end: number; }>;
  };
  "box-rating": {
    "value-changed": CustomEvent<{ value: number; }>;
  };
  "box-relative-time": {};
  "box-resource-row": {
    "select": CustomEvent<{ value: string; }>;
  };
  "box-result-blocks": {
    "document-selected": CustomEvent<{ id: string | undefined; }>;
  };
  "box-review-queue-item": {
    "action": CustomEvent<{ action: string; title: string; itemLabel: string; }>;
    "selected": CustomEvent<{ title: string; itemLabel: string; }>;
  };
  "box-rich-text-input": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-run-summary": {};
  "box-run-trace": {
    "step-toggled": CustomEvent<{ stepId: string; expanded: boolean; }>;
  };
  "box-saved-view-picker": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-search-field": {
    "clear": CustomEvent<{ value: string; }>;
    "search": CustomEvent<{ value: string; }>;
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-search-results-header": {
    "action": CustomEvent<{ action: string; }>;
    "filter-removed": CustomEvent<{ filter: string; }>;
  };
  "box-section": {};
  "box-segmented-control": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-select": {
    "value-changed": CustomEvent<import("./components/forms/select.js").SelectValueChangedDetail>;
  };
  "box-share-panel": {
    "action": CustomEvent<{ action: string; }>;
    "collaborator-selected": CustomEvent<{ description?: string | undefined; id?: string | undefined; initials?: string | undefined; name: string; role: string; }>;
  };
  "box-shortcuts-overlay": {
    "dismissed": CustomEvent<unknown>;
  };
  "box-sidebar-toggle-button": {
    "toggle": CustomEvent<{ expanded: boolean; }>;
  };
  "box-signature-ceremony": {};
  "box-skeleton": {};
  "box-slider": {
    "value-changed": CustomEvent<{ value: number; }>;
  };
  "box-spin-button": {
    "value-changed": CustomEvent<{ value: number; }>;
  };
  "box-spinner": {};
  "box-split-view": {
    "detail-dismissed": CustomEvent<import("./components/layout/split-view.js").SplitViewDetailDismissedDetail>;
    "ratio-changed": CustomEvent<{ ratio: number; }>;
  };
  "box-status-icon": {};
  "box-switch": {
    "checked-changed": CustomEvent<{ checked: boolean; }>;
  };
  "box-table": {
    "row-toggled": CustomEvent<import("./components/collections/table.js").TableRowToggledDetail>;
    "selection-changed": CustomEvent<import("./components/collections/table.js").TableSelectionChangedDetail>;
    "sort": CustomEvent<import("./components/collections/table.js").TableSortDetail>;
  };
  "box-tabs": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-tag-input": {};
  "box-task-assignment-panel": {
    "action": CustomEvent<{ action: string; assigneeId: string; checklist: ({ checked?: boolean | undefined; description?: string | undefined; id: string; label: string; })[]; }>;
    "assignee-changed": CustomEvent<{ assigneeId: string; }>;
    "checklist-changed": CustomEvent<{ itemId: string; checked: boolean; checklist: ({ checked?: boolean | undefined; description?: string | undefined; id: string; label: string; })[]; }>;
  };
  "box-text-area": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-text-field": {
    "value-changed": CustomEvent<import("./components/forms/text-field.js").TextFieldValueChangedDetail>;
  };
  "box-thumbnail-card": {
    "activate": CustomEvent<{ title: string; }>;
  };
  "box-tile-group": {
    "tile-change": CustomEvent<{ selected: string[]; }>;
  };
  "box-time-field": {
    "parse-error": CustomEvent<{ value: string; }>;
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-timeline": {
    "entry-submitted": CustomEvent<import("./patterns/timeline/types.js").TimelineEntrySubmittedDetail>;
    "evidence-selected": CustomEvent<{ event: import("./patterns/timeline/types.js").TimelineEvent | undefined; evidence: import("./patterns/timeline/types.js").TimelineEvidence; }>;
    "load-more": CustomEvent<unknown>;
  };
  "box-toast": {
    "dismiss": CustomEvent<{ source: "close-button" | "timeout"; }>;
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-toolbar": {};
  "box-tooltip": {
    "open-changed": CustomEvent<{ open: boolean; }>;
  };
  "box-tree": {
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-tree-grid": {
    "expand-changed": CustomEvent<{ value: string; expanded: boolean; }>;
    "value-changed": CustomEvent<{ value: string; }>;
  };
  "box-unified-share-modal": {
    "close": CustomEvent<unknown>;
    "invite": CustomEvent<{ itemId: string; itemType: "file" | "folder"; access: string; }>;
    "linkcopied": CustomEvent<{ url: string; }>;
  };
  "box-verdict-banner": {};
  "box-version-graph": {
    "compare-requested": CustomEvent<{ baseId: string; targetId: string; }>;
    "version-selected": CustomEvent<{ version: import("./patterns/versions/types.js").VersionNode; }>;
  };
  "box-version-list": {
    "compare-requested": CustomEvent<{ baseId: string; targetId: string; }>;
    "version-selected": CustomEvent<{ version: import("./patterns/versions/types.js").VersionNode; }>;
  };
  "box-wizard-summary": {
    "edit-requested": CustomEvent<{ stepId: string; }>;
  };
  "box-work-queue": {
    "item-selected": CustomEvent<{ item: import("./patterns/work-queue/types.js").WorkItem; }>;
    "reassign-requested": CustomEvent<{ item: import("./patterns/work-queue/types.js").WorkItem; }>;
  };
  "box-workload-board": {
    "item-selected": CustomEvent<{ item: import("./patterns/work-queue/types.js").WorkItem; }>;
    "reassign-requested": CustomEvent<{ item: import("./patterns/work-queue/types.js").WorkItem; }>;
  };
}

export type BoxElementProperties<Tag extends BoxElementTagName> = Partial<Pick<
  HTMLElementTagNameMap[Tag],
  Extract<BoxElementPropertyKeys[Tag], keyof HTMLElementTagNameMap[Tag]>
>>;

export type BoxElementEventHandlerProps<Tag extends BoxElementTagName> = {
  [Name in keyof BoxElementEventMap[Tag] & string as `on${Name}`]?: (
    event: BoxElementEventMap[Tag][Name] & { currentTarget: HTMLElementTagNameMap[Tag] },
  ) => void;
};

declare module "./components/navigation/accordion.js" {
  interface Accordion {
    addEventListener<K extends keyof BoxElementEventMap["box-accordion"] & string>(
      type: K,
      listener: (this: Accordion, event: BoxElementEventMap["box-accordion"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Accordion, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-accordion"] & string>(
      type: K,
      listener: (this: Accordion, event: BoxElementEventMap["box-accordion"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Accordion, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/audit/activity-density.js" {
  interface ActivityDensityStrip {
    addEventListener<K extends keyof BoxElementEventMap["box-activity-density"] & string>(
      type: K,
      listener: (this: ActivityDensityStrip, event: BoxElementEventMap["box-activity-density"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ActivityDensityStrip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-activity-density"] & string>(
      type: K,
      listener: (this: ActivityDensityStrip, event: BoxElementEventMap["box-activity-density"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ActivityDensityStrip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/agent-chat/agent-chat.js" {
  interface AgentChat {
    addEventListener<K extends keyof BoxElementEventMap["box-agent-chat"] & string>(
      type: K,
      listener: (this: AgentChat, event: BoxElementEventMap["box-agent-chat"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AgentChat, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-agent-chat"] & string>(
      type: K,
      listener: (this: AgentChat, event: BoxElementEventMap["box-agent-chat"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AgentChat, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/agent-workspace/agent-workspace.js" {
  interface AgentWorkspace {
    addEventListener<K extends keyof BoxElementEventMap["box-agent-workspace"] & string>(
      type: K,
      listener: (this: AgentWorkspace, event: BoxElementEventMap["box-agent-workspace"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AgentWorkspace, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-agent-workspace"] & string>(
      type: K,
      listener: (this: AgentWorkspace, event: BoxElementEventMap["box-agent-workspace"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AgentWorkspace, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/alert.js" {
  interface Alert {
    addEventListener<K extends keyof BoxElementEventMap["box-alert"] & string>(
      type: K,
      listener: (this: Alert, event: BoxElementEventMap["box-alert"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Alert, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-alert"] & string>(
      type: K,
      listener: (this: Alert, event: BoxElementEventMap["box-alert"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Alert, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/preview/annotation-inspector.js" {
  interface AnnotationInspector {
    addEventListener<K extends keyof BoxElementEventMap["box-annotation-inspector"] & string>(
      type: K,
      listener: (this: AnnotationInspector, event: BoxElementEventMap["box-annotation-inspector"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AnnotationInspector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-annotation-inspector"] & string>(
      type: K,
      listener: (this: AnnotationInspector, event: BoxElementEventMap["box-annotation-inspector"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AnnotationInspector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/preview/annotation-toolbar.js" {
  interface AnnotationToolbar {
    addEventListener<K extends keyof BoxElementEventMap["box-annotation-toolbar"] & string>(
      type: K,
      listener: (this: AnnotationToolbar, event: BoxElementEventMap["box-annotation-toolbar"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AnnotationToolbar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-annotation-toolbar"] & string>(
      type: K,
      listener: (this: AnnotationToolbar, event: BoxElementEventMap["box-annotation-toolbar"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AnnotationToolbar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/audit/audit-log.js" {
  interface AuditLog {
    addEventListener<K extends keyof BoxElementEventMap["box-audit-log"] & string>(
      type: K,
      listener: (this: AuditLog, event: BoxElementEventMap["box-audit-log"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AuditLog, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-audit-log"] & string>(
      type: K,
      listener: (this: AuditLog, event: BoxElementEventMap["box-audit-log"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: AuditLog, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/insights/bar-chart.js" {
  interface BarChart {
    addEventListener<K extends keyof BoxElementEventMap["box-bar-chart"] & string>(
      type: K,
      listener: (this: BarChart, event: BoxElementEventMap["box-bar-chart"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: BarChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-bar-chart"] & string>(
      type: K,
      listener: (this: BarChart, event: BoxElementEventMap["box-bar-chart"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: BarChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/navigation/breadcrumb.js" {
  interface Breadcrumb {
    addEventListener<K extends keyof BoxElementEventMap["box-breadcrumb"] & string>(
      type: K,
      listener: (this: Breadcrumb, event: BoxElementEventMap["box-breadcrumb"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Breadcrumb, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-breadcrumb"] & string>(
      type: K,
      listener: (this: Breadcrumb, event: BoxElementEventMap["box-breadcrumb"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Breadcrumb, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/item/bulk-action-bar.js" {
  interface BulkActionBar {
    addEventListener<K extends keyof BoxElementEventMap["box-bulk-action-bar"] & string>(
      type: K,
      listener: (this: BulkActionBar, event: BoxElementEventMap["box-bulk-action-bar"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: BulkActionBar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-bulk-action-bar"] & string>(
      type: K,
      listener: (this: BulkActionBar, event: BoxElementEventMap["box-bulk-action-bar"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: BulkActionBar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/actions/button-group.js" {
  interface ButtonGroup {
    addEventListener<K extends keyof BoxElementEventMap["box-button-group"] & string>(
      type: K,
      listener: (this: ButtonGroup, event: BoxElementEventMap["box-button-group"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ButtonGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-button-group"] & string>(
      type: K,
      listener: (this: ButtonGroup, event: BoxElementEventMap["box-button-group"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ButtonGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/calendar.js" {
  interface Calendar {
    addEventListener<K extends keyof BoxElementEventMap["box-calendar"] & string>(
      type: K,
      listener: (this: Calendar, event: BoxElementEventMap["box-calendar"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Calendar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-calendar"] & string>(
      type: K,
      listener: (this: Calendar, event: BoxElementEventMap["box-calendar"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Calendar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/call-console/call-console.js" {
  interface CallConsole {
    addEventListener<K extends keyof BoxElementEventMap["box-call-console"] & string>(
      type: K,
      listener: (this: CallConsole, event: BoxElementEventMap["box-call-console"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CallConsole, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-call-console"] & string>(
      type: K,
      listener: (this: CallConsole, event: BoxElementEventMap["box-call-console"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CallConsole, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/carousel.js" {
  interface Carousel {
    addEventListener<K extends keyof BoxElementEventMap["box-carousel"] & string>(
      type: K,
      listener: (this: Carousel, event: BoxElementEventMap["box-carousel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Carousel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-carousel"] & string>(
      type: K,
      listener: (this: Carousel, event: BoxElementEventMap["box-carousel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Carousel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/category-selector.js" {
  interface CategorySelector {
    addEventListener<K extends keyof BoxElementEventMap["box-category-selector"] & string>(
      type: K,
      listener: (this: CategorySelector, event: BoxElementEventMap["box-category-selector"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CategorySelector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-category-selector"] & string>(
      type: K,
      listener: (this: CategorySelector, event: BoxElementEventMap["box-category-selector"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CategorySelector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/insights/chart-panel.js" {
  interface ChartPanel {
    addEventListener<K extends keyof BoxElementEventMap["box-chart-panel"] & string>(
      type: K,
      listener: (this: ChartPanel, event: BoxElementEventMap["box-chart-panel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ChartPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-chart-panel"] & string>(
      type: K,
      listener: (this: ChartPanel, event: BoxElementEventMap["box-chart-panel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ChartPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/checkbox.js" {
  interface Checkbox {
    addEventListener<K extends keyof BoxElementEventMap["box-checkbox"] & string>(
      type: K,
      listener: (this: Checkbox, event: BoxElementEventMap["box-checkbox"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Checkbox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-checkbox"] & string>(
      type: K,
      listener: (this: Checkbox, event: BoxElementEventMap["box-checkbox"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Checkbox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/checkbox-group.js" {
  interface CheckboxGroup {
    addEventListener<K extends keyof BoxElementEventMap["box-checkbox-group"] & string>(
      type: K,
      listener: (this: CheckboxGroup, event: BoxElementEventMap["box-checkbox-group"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CheckboxGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-checkbox-group"] & string>(
      type: K,
      listener: (this: CheckboxGroup, event: BoxElementEventMap["box-checkbox-group"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CheckboxGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/chip.js" {
  interface Chip {
    addEventListener<K extends keyof BoxElementEventMap["box-chip"] & string>(
      type: K,
      listener: (this: Chip, event: BoxElementEventMap["box-chip"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Chip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-chip"] & string>(
      type: K,
      listener: (this: Chip, event: BoxElementEventMap["box-chip"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Chip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/output/code-block.js" {
  interface CodeBlock {
    addEventListener<K extends keyof BoxElementEventMap["box-code-block"] & string>(
      type: K,
      listener: (this: CodeBlock, event: BoxElementEventMap["box-code-block"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CodeBlock, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-code-block"] & string>(
      type: K,
      listener: (this: CodeBlock, event: BoxElementEventMap["box-code-block"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CodeBlock, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/code-editor.js" {
  interface CodeEditor {
    addEventListener<K extends keyof BoxElementEventMap["box-code-editor"] & string>(
      type: K,
      listener: (this: CodeEditor, event: BoxElementEventMap["box-code-editor"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CodeEditor, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-code-editor"] & string>(
      type: K,
      listener: (this: CodeEditor, event: BoxElementEventMap["box-code-editor"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CodeEditor, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/share/collaborator-avatars.js" {
  interface CollaboratorAvatars {
    addEventListener<K extends keyof BoxElementEventMap["box-collaborator-avatars"] & string>(
      type: K,
      listener: (this: CollaboratorAvatars, event: BoxElementEventMap["box-collaborator-avatars"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CollaboratorAvatars, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-collaborator-avatars"] & string>(
      type: K,
      listener: (this: CollaboratorAvatars, event: BoxElementEventMap["box-collaborator-avatars"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CollaboratorAvatars, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/color-picker.js" {
  interface ColorPicker {
    addEventListener<K extends keyof BoxElementEventMap["box-color-picker"] & string>(
      type: K,
      listener: (this: ColorPicker, event: BoxElementEventMap["box-color-picker"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ColorPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-color-picker"] & string>(
      type: K,
      listener: (this: ColorPicker, event: BoxElementEventMap["box-color-picker"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ColorPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/combobox.js" {
  interface Combobox {
    addEventListener<K extends keyof BoxElementEventMap["box-combobox"] & string>(
      type: K,
      listener: (this: Combobox, event: BoxElementEventMap["box-combobox"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Combobox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-combobox"] & string>(
      type: K,
      listener: (this: Combobox, event: BoxElementEventMap["box-combobox"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Combobox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/command-palette.js" {
  interface CommandPalette {
    addEventListener<K extends keyof BoxElementEventMap["box-command-palette"] & string>(
      type: K,
      listener: (this: CommandPalette, event: BoxElementEventMap["box-command-palette"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CommandPalette, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-command-palette"] & string>(
      type: K,
      listener: (this: CommandPalette, event: BoxElementEventMap["box-command-palette"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CommandPalette, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/comments/comment-thread.js" {
  interface CommentThread {
    addEventListener<K extends keyof BoxElementEventMap["box-comment-thread"] & string>(
      type: K,
      listener: (this: CommentThread, event: BoxElementEventMap["box-comment-thread"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CommentThread, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-comment-thread"] & string>(
      type: K,
      listener: (this: CommentThread, event: BoxElementEventMap["box-comment-thread"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CommentThread, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/diff/compare-view.js" {
  interface CompareView {
    addEventListener<K extends keyof BoxElementEventMap["box-compare-view"] & string>(
      type: K,
      listener: (this: CompareView, event: BoxElementEventMap["box-compare-view"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CompareView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-compare-view"] & string>(
      type: K,
      listener: (this: CompareView, event: BoxElementEventMap["box-compare-view"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: CompareView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/identity/contact-datalist-item.js" {
  interface ContactDatalistItem {
    addEventListener<K extends keyof BoxElementEventMap["box-contact-datalist-item"] & string>(
      type: K,
      listener: (this: ContactDatalistItem, event: BoxElementEventMap["box-contact-datalist-item"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContactDatalistItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-contact-datalist-item"] & string>(
      type: K,
      listener: (this: ContactDatalistItem, event: BoxElementEventMap["box-contact-datalist-item"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContactDatalistItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/content-picker/content-picker.js" {
  interface ContentPicker {
    addEventListener<K extends keyof BoxElementEventMap["box-content-picker"] & string>(
      type: K,
      listener: (this: ContentPicker, event: BoxElementEventMap["box-content-picker"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-content-picker"] & string>(
      type: K,
      listener: (this: ContentPicker, event: BoxElementEventMap["box-content-picker"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/content-sidebar/content-sidebar.js" {
  interface ContentSidebar {
    addEventListener<K extends keyof BoxElementEventMap["box-content-sidebar"] & string>(
      type: K,
      listener: (this: ContentSidebar, event: BoxElementEventMap["box-content-sidebar"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentSidebar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-content-sidebar"] & string>(
      type: K,
      listener: (this: ContentSidebar, event: BoxElementEventMap["box-content-sidebar"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentSidebar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/content-uploader/content-uploader.js" {
  interface ContentUploader {
    addEventListener<K extends keyof BoxElementEventMap["box-content-uploader"] & string>(
      type: K,
      listener: (this: ContentUploader, event: BoxElementEventMap["box-content-uploader"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentUploader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-content-uploader"] & string>(
      type: K,
      listener: (this: ContentUploader, event: BoxElementEventMap["box-content-uploader"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContentUploader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/context-menu.js" {
  interface ContextMenu {
    addEventListener<K extends keyof BoxElementEventMap["box-context-menu"] & string>(
      type: K,
      listener: (this: ContextMenu, event: BoxElementEventMap["box-context-menu"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContextMenu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-context-menu"] & string>(
      type: K,
      listener: (this: ContextMenu, event: BoxElementEventMap["box-context-menu"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ContextMenu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/datalist-item.js" {
  interface DatalistItem {
    addEventListener<K extends keyof BoxElementEventMap["box-datalist-item"] & string>(
      type: K,
      listener: (this: DatalistItem, event: BoxElementEventMap["box-datalist-item"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DatalistItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-datalist-item"] & string>(
      type: K,
      listener: (this: DatalistItem, event: BoxElementEventMap["box-datalist-item"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DatalistItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/date-field.js" {
  interface DateField {
    addEventListener<K extends keyof BoxElementEventMap["box-date-field"] & string>(
      type: K,
      listener: (this: DateField, event: BoxElementEventMap["box-date-field"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DateField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-date-field"] & string>(
      type: K,
      listener: (this: DateField, event: BoxElementEventMap["box-date-field"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DateField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/dialog.js" {
  interface Dialog {
    addEventListener<K extends keyof BoxElementEventMap["box-dialog"] & string>(
      type: K,
      listener: (this: Dialog, event: BoxElementEventMap["box-dialog"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Dialog, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-dialog"] & string>(
      type: K,
      listener: (this: Dialog, event: BoxElementEventMap["box-dialog"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Dialog, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/diff/diff-viewer.js" {
  interface DiffViewer {
    addEventListener<K extends keyof BoxElementEventMap["box-diff-viewer"] & string>(
      type: K,
      listener: (this: DiffViewer, event: BoxElementEventMap["box-diff-viewer"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DiffViewer, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-diff-viewer"] & string>(
      type: K,
      listener: (this: DiffViewer, event: BoxElementEventMap["box-diff-viewer"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DiffViewer, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/insights/donut-chart.js" {
  interface DonutChart {
    addEventListener<K extends keyof BoxElementEventMap["box-donut-chart"] & string>(
      type: K,
      listener: (this: DonutChart, event: BoxElementEventMap["box-donut-chart"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DonutChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-donut-chart"] & string>(
      type: K,
      listener: (this: DonutChart, event: BoxElementEventMap["box-donut-chart"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DonutChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/draggable-list.js" {
  interface DraggableList {
    addEventListener<K extends keyof BoxElementEventMap["box-draggable-list"] & string>(
      type: K,
      listener: (this: DraggableList, event: BoxElementEventMap["box-draggable-list"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DraggableList, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-draggable-list"] & string>(
      type: K,
      listener: (this: DraggableList, event: BoxElementEventMap["box-draggable-list"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DraggableList, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/drawer.js" {
  interface Drawer {
    addEventListener<K extends keyof BoxElementEventMap["box-drawer"] & string>(
      type: K,
      listener: (this: Drawer, event: BoxElementEventMap["box-drawer"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Drawer, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-drawer"] & string>(
      type: K,
      listener: (this: Drawer, event: BoxElementEventMap["box-drawer"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Drawer, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/files/drop-zone.js" {
  interface DropZone {
    addEventListener<K extends keyof BoxElementEventMap["box-drop-zone"] & string>(
      type: K,
      listener: (this: DropZone, event: BoxElementEventMap["box-drop-zone"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DropZone, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-drop-zone"] & string>(
      type: K,
      listener: (this: DropZone, event: BoxElementEventMap["box-drop-zone"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DropZone, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/dropdown.js" {
  interface Dropdown {
    addEventListener<K extends keyof BoxElementEventMap["box-dropdown"] & string>(
      type: K,
      listener: (this: Dropdown, event: BoxElementEventMap["box-dropdown"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Dropdown, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-dropdown"] & string>(
      type: K,
      listener: (this: Dropdown, event: BoxElementEventMap["box-dropdown"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Dropdown, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/dual-listbox.js" {
  interface DualListbox {
    addEventListener<K extends keyof BoxElementEventMap["box-dual-listbox"] & string>(
      type: K,
      listener: (this: DualListbox, event: BoxElementEventMap["box-dual-listbox"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DualListbox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-dual-listbox"] & string>(
      type: K,
      listener: (this: DualListbox, event: BoxElementEventMap["box-dual-listbox"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: DualListbox, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/empty-state.js" {
  interface EmptyState {
    addEventListener<K extends keyof BoxElementEventMap["box-empty-state"] & string>(
      type: K,
      listener: (this: EmptyState, event: BoxElementEventMap["box-empty-state"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: EmptyState, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-empty-state"] & string>(
      type: K,
      listener: (this: EmptyState, event: BoxElementEventMap["box-empty-state"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: EmptyState, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/error-mask.js" {
  interface ErrorMask {
    addEventListener<K extends keyof BoxElementEventMap["box-error-mask"] & string>(
      type: K,
      listener: (this: ErrorMask, event: BoxElementEventMap["box-error-mask"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ErrorMask, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-error-mask"] & string>(
      type: K,
      listener: (this: ErrorMask, event: BoxElementEventMap["box-error-mask"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ErrorMask, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/content-explorer/adapters/action-menu.js" {
  interface ExplorerActionMenu {
    addEventListener<K extends keyof BoxElementEventMap["box-explorer-action-menu"] & string>(
      type: K,
      listener: (this: ExplorerActionMenu, event: BoxElementEventMap["box-explorer-action-menu"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ExplorerActionMenu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-explorer-action-menu"] & string>(
      type: K,
      listener: (this: ExplorerActionMenu, event: BoxElementEventMap["box-explorer-action-menu"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ExplorerActionMenu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/file-request/file-request-builder.js" {
  interface FileRequestBuilder {
    addEventListener<K extends keyof BoxElementEventMap["box-file-request-builder"] & string>(
      type: K,
      listener: (this: FileRequestBuilder, event: BoxElementEventMap["box-file-request-builder"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FileRequestBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-file-request-builder"] & string>(
      type: K,
      listener: (this: FileRequestBuilder, event: BoxElementEventMap["box-file-request-builder"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FileRequestBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/search/filter-bar.js" {
  interface FilterBar {
    addEventListener<K extends keyof BoxElementEventMap["box-filter-bar"] & string>(
      type: K,
      listener: (this: FilterBar, event: BoxElementEventMap["box-filter-bar"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FilterBar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-filter-bar"] & string>(
      type: K,
      listener: (this: FilterBar, event: BoxElementEventMap["box-filter-bar"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FilterBar, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/flow-builder/flow-builder.js" {
  interface FlowBuilder {
    addEventListener<K extends keyof BoxElementEventMap["box-flow-builder"] & string>(
      type: K,
      listener: (this: FlowBuilder, event: BoxElementEventMap["box-flow-builder"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FlowBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-flow-builder"] & string>(
      type: K,
      listener: (this: FlowBuilder, event: BoxElementEventMap["box-flow-builder"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: FlowBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/governance/governance-panel.js" {
  interface GovernancePanel {
    addEventListener<K extends keyof BoxElementEventMap["box-governance-panel"] & string>(
      type: K,
      listener: (this: GovernancePanel, event: BoxElementEventMap["box-governance-panel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GovernancePanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-governance-panel"] & string>(
      type: K,
      listener: (this: GovernancePanel, event: BoxElementEventMap["box-governance-panel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GovernancePanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/grid-view.js" {
  interface GridView {
    addEventListener<K extends keyof BoxElementEventMap["box-grid-view"] & string>(
      type: K,
      listener: (this: GridView, event: BoxElementEventMap["box-grid-view"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GridView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-grid-view"] & string>(
      type: K,
      listener: (this: GridView, event: BoxElementEventMap["box-grid-view"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GridView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/guide-tooltip.js" {
  interface GuideTooltip {
    addEventListener<K extends keyof BoxElementEventMap["box-guide-tooltip"] & string>(
      type: K,
      listener: (this: GuideTooltip, event: BoxElementEventMap["box-guide-tooltip"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GuideTooltip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-guide-tooltip"] & string>(
      type: K,
      listener: (this: GuideTooltip, event: BoxElementEventMap["box-guide-tooltip"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: GuideTooltip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/share/invite-collaborators-modal.js" {
  interface InviteCollaboratorsModal {
    addEventListener<K extends keyof BoxElementEventMap["box-invite-collaborators-modal"] & string>(
      type: K,
      listener: (this: InviteCollaboratorsModal, event: BoxElementEventMap["box-invite-collaborators-modal"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: InviteCollaboratorsModal, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-invite-collaborators-modal"] & string>(
      type: K,
      listener: (this: InviteCollaboratorsModal, event: BoxElementEventMap["box-invite-collaborators-modal"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: InviteCollaboratorsModal, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/item/item-details-panel.js" {
  interface ItemDetailsPanel {
    addEventListener<K extends keyof BoxElementEventMap["box-item-details-panel"] & string>(
      type: K,
      listener: (this: ItemDetailsPanel, event: BoxElementEventMap["box-item-details-panel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ItemDetailsPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-item-details-panel"] & string>(
      type: K,
      listener: (this: ItemDetailsPanel, event: BoxElementEventMap["box-item-details-panel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ItemDetailsPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/item/item-form.js" {
  interface ItemForm {
    addEventListener<K extends keyof BoxElementEventMap["box-item-form"] & string>(
      type: K,
      listener: (this: ItemForm, event: BoxElementEventMap["box-item-form"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ItemForm, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-item-form"] & string>(
      type: K,
      listener: (this: ItemForm, event: BoxElementEventMap["box-item-form"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ItemForm, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/insights/line-chart.js" {
  interface LineChart {
    addEventListener<K extends keyof BoxElementEventMap["box-line-chart"] & string>(
      type: K,
      listener: (this: LineChart, event: BoxElementEventMap["box-line-chart"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: LineChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-line-chart"] & string>(
      type: K,
      listener: (this: LineChart, event: BoxElementEventMap["box-line-chart"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: LineChart, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/lineage/lineage-graph.js" {
  interface LineageGraph {
    addEventListener<K extends keyof BoxElementEventMap["box-lineage-graph"] & string>(
      type: K,
      listener: (this: LineageGraph, event: BoxElementEventMap["box-lineage-graph"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: LineageGraph, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-lineage-graph"] & string>(
      type: K,
      listener: (this: LineageGraph, event: BoxElementEventMap["box-lineage-graph"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: LineageGraph, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/actions/menu.js" {
  interface Menu {
    addEventListener<K extends keyof BoxElementEventMap["box-menu"] & string>(
      type: K,
      listener: (this: Menu, event: BoxElementEventMap["box-menu"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Menu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-menu"] & string>(
      type: K,
      listener: (this: Menu, event: BoxElementEventMap["box-menu"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Menu, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/actions/menu-item.js" {
  interface MenuItem {
    addEventListener<K extends keyof BoxElementEventMap["box-menu-item"] & string>(
      type: K,
      listener: (this: MenuItem, event: BoxElementEventMap["box-menu-item"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MenuItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-menu-item"] & string>(
      type: K,
      listener: (this: MenuItem, event: BoxElementEventMap["box-menu-item"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MenuItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/metadata/metadata-filter-builder.js" {
  interface MetadataFilterBuilder {
    addEventListener<K extends keyof BoxElementEventMap["box-metadata-filter-builder"] & string>(
      type: K,
      listener: (this: MetadataFilterBuilder, event: BoxElementEventMap["box-metadata-filter-builder"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetadataFilterBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-metadata-filter-builder"] & string>(
      type: K,
      listener: (this: MetadataFilterBuilder, event: BoxElementEventMap["box-metadata-filter-builder"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetadataFilterBuilder, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/metadata/metadata-inspector.js" {
  interface MetadataInspector {
    addEventListener<K extends keyof BoxElementEventMap["box-metadata-inspector"] & string>(
      type: K,
      listener: (this: MetadataInspector, event: BoxElementEventMap["box-metadata-inspector"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetadataInspector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-metadata-inspector"] & string>(
      type: K,
      listener: (this: MetadataInspector, event: BoxElementEventMap["box-metadata-inspector"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetadataInspector, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/insights/metric-card.js" {
  interface MetricCard {
    addEventListener<K extends keyof BoxElementEventMap["box-metric-card"] & string>(
      type: K,
      listener: (this: MetricCard, event: BoxElementEventMap["box-metric-card"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetricCard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-metric-card"] & string>(
      type: K,
      listener: (this: MetricCard, event: BoxElementEventMap["box-metric-card"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MetricCard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/mode-indicator.js" {
  interface ModeIndicator {
    addEventListener<K extends keyof BoxElementEventMap["box-mode-indicator"] & string>(
      type: K,
      listener: (this: ModeIndicator, event: BoxElementEventMap["box-mode-indicator"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ModeIndicator, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-mode-indicator"] & string>(
      type: K,
      listener: (this: ModeIndicator, event: BoxElementEventMap["box-mode-indicator"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ModeIndicator, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/multi-select.js" {
  interface MultiSelect {
    addEventListener<K extends keyof BoxElementEventMap["box-multi-select"] & string>(
      type: K,
      listener: (this: MultiSelect, event: BoxElementEventMap["box-multi-select"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MultiSelect, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-multi-select"] & string>(
      type: K,
      listener: (this: MultiSelect, event: BoxElementEventMap["box-multi-select"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: MultiSelect, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/notifications/notification-bell.js" {
  interface NotificationBell {
    addEventListener<K extends keyof BoxElementEventMap["box-notification-bell"] & string>(
      type: K,
      listener: (this: NotificationBell, event: BoxElementEventMap["box-notification-bell"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: NotificationBell, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-notification-bell"] & string>(
      type: K,
      listener: (this: NotificationBell, event: BoxElementEventMap["box-notification-bell"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: NotificationBell, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/nudge.js" {
  interface Nudge {
    addEventListener<K extends keyof BoxElementEventMap["box-nudge"] & string>(
      type: K,
      listener: (this: Nudge, event: BoxElementEventMap["box-nudge"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Nudge, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-nudge"] & string>(
      type: K,
      listener: (this: Nudge, event: BoxElementEventMap["box-nudge"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Nudge, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/number-input.js" {
  interface NumberInput {
    addEventListener<K extends keyof BoxElementEventMap["box-number-input"] & string>(
      type: K,
      listener: (this: NumberInput, event: BoxElementEventMap["box-number-input"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: NumberInput, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-number-input"] & string>(
      type: K,
      listener: (this: NumberInput, event: BoxElementEventMap["box-number-input"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: NumberInput, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/pagination.js" {
  interface Pagination {
    addEventListener<K extends keyof BoxElementEventMap["box-pagination"] & string>(
      type: K,
      listener: (this: Pagination, event: BoxElementEventMap["box-pagination"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Pagination, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-pagination"] & string>(
      type: K,
      listener: (this: Pagination, event: BoxElementEventMap["box-pagination"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Pagination, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/share/permission-matrix.js" {
  interface PermissionMatrix {
    addEventListener<K extends keyof BoxElementEventMap["box-permission-matrix"] & string>(
      type: K,
      listener: (this: PermissionMatrix, event: BoxElementEventMap["box-permission-matrix"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PermissionMatrix, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-permission-matrix"] & string>(
      type: K,
      listener: (this: PermissionMatrix, event: BoxElementEventMap["box-permission-matrix"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PermissionMatrix, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/pill-cloud.js" {
  interface PillCloud {
    addEventListener<K extends keyof BoxElementEventMap["box-pill-cloud"] & string>(
      type: K,
      listener: (this: PillCloud, event: BoxElementEventMap["box-pill-cloud"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PillCloud, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-pill-cloud"] & string>(
      type: K,
      listener: (this: PillCloud, event: BoxElementEventMap["box-pill-cloud"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PillCloud, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/pill-selector-dropdown.js" {
  interface PillSelectorDropdown {
    addEventListener<K extends keyof BoxElementEventMap["box-pill-selector-dropdown"] & string>(
      type: K,
      listener: (this: PillSelectorDropdown, event: BoxElementEventMap["box-pill-selector-dropdown"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PillSelectorDropdown, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-pill-selector-dropdown"] & string>(
      type: K,
      listener: (this: PillSelectorDropdown, event: BoxElementEventMap["box-pill-selector-dropdown"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PillSelectorDropdown, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/popover.js" {
  interface Popover {
    addEventListener<K extends keyof BoxElementEventMap["box-popover"] & string>(
      type: K,
      listener: (this: Popover, event: BoxElementEventMap["box-popover"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Popover, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-popover"] & string>(
      type: K,
      listener: (this: Popover, event: BoxElementEventMap["box-popover"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Popover, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/preview/preview-element.js" {
  interface Preview {
    addEventListener<K extends keyof BoxElementEventMap["box-preview-element"] & string>(
      type: K,
      listener: (this: Preview, event: BoxElementEventMap["box-preview-element"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Preview, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-preview-element"] & string>(
      type: K,
      listener: (this: Preview, event: BoxElementEventMap["box-preview-element"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Preview, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/item/preview-header.js" {
  interface PreviewHeader {
    addEventListener<K extends keyof BoxElementEventMap["box-preview-header"] & string>(
      type: K,
      listener: (this: PreviewHeader, event: BoxElementEventMap["box-preview-header"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PreviewHeader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-preview-header"] & string>(
      type: K,
      listener: (this: PreviewHeader, event: BoxElementEventMap["box-preview-header"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: PreviewHeader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/progress-steps.js" {
  interface ProgressSteps {
    addEventListener<K extends keyof BoxElementEventMap["box-progress-steps"] & string>(
      type: K,
      listener: (this: ProgressSteps, event: BoxElementEventMap["box-progress-steps"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ProgressSteps, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-progress-steps"] & string>(
      type: K,
      listener: (this: ProgressSteps, event: BoxElementEventMap["box-progress-steps"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ProgressSteps, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/lineage/provenance-strip.js" {
  interface ProvenanceStrip {
    addEventListener<K extends keyof BoxElementEventMap["box-provenance-strip"] & string>(
      type: K,
      listener: (this: ProvenanceStrip, event: BoxElementEventMap["box-provenance-strip"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ProvenanceStrip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-provenance-strip"] & string>(
      type: K,
      listener: (this: ProvenanceStrip, event: BoxElementEventMap["box-provenance-strip"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ProvenanceStrip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/radio-group.js" {
  interface RadioGroup {
    addEventListener<K extends keyof BoxElementEventMap["box-radio-group"] & string>(
      type: K,
      listener: (this: RadioGroup, event: BoxElementEventMap["box-radio-group"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RadioGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-radio-group"] & string>(
      type: K,
      listener: (this: RadioGroup, event: BoxElementEventMap["box-radio-group"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RadioGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/range-slider.js" {
  interface RangeSlider {
    addEventListener<K extends keyof BoxElementEventMap["box-range-slider"] & string>(
      type: K,
      listener: (this: RangeSlider, event: BoxElementEventMap["box-range-slider"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RangeSlider, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-range-slider"] & string>(
      type: K,
      listener: (this: RangeSlider, event: BoxElementEventMap["box-range-slider"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RangeSlider, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/rating.js" {
  interface Rating {
    addEventListener<K extends keyof BoxElementEventMap["box-rating"] & string>(
      type: K,
      listener: (this: Rating, event: BoxElementEventMap["box-rating"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Rating, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-rating"] & string>(
      type: K,
      listener: (this: Rating, event: BoxElementEventMap["box-rating"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Rating, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/resource-row.js" {
  interface ResourceRow {
    addEventListener<K extends keyof BoxElementEventMap["box-resource-row"] & string>(
      type: K,
      listener: (this: ResourceRow, event: BoxElementEventMap["box-resource-row"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ResourceRow, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-resource-row"] & string>(
      type: K,
      listener: (this: ResourceRow, event: BoxElementEventMap["box-resource-row"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ResourceRow, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/result-blocks.js" {
  interface ResultBlocks {
    addEventListener<K extends keyof BoxElementEventMap["box-result-blocks"] & string>(
      type: K,
      listener: (this: ResultBlocks, event: BoxElementEventMap["box-result-blocks"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ResultBlocks, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-result-blocks"] & string>(
      type: K,
      listener: (this: ResultBlocks, event: BoxElementEventMap["box-result-blocks"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ResultBlocks, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/task/review-queue-item.js" {
  interface ReviewQueueItem {
    addEventListener<K extends keyof BoxElementEventMap["box-review-queue-item"] & string>(
      type: K,
      listener: (this: ReviewQueueItem, event: BoxElementEventMap["box-review-queue-item"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ReviewQueueItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-review-queue-item"] & string>(
      type: K,
      listener: (this: ReviewQueueItem, event: BoxElementEventMap["box-review-queue-item"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ReviewQueueItem, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/rich-text-input.js" {
  interface RichTextInput {
    addEventListener<K extends keyof BoxElementEventMap["box-rich-text-input"] & string>(
      type: K,
      listener: (this: RichTextInput, event: BoxElementEventMap["box-rich-text-input"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RichTextInput, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-rich-text-input"] & string>(
      type: K,
      listener: (this: RichTextInput, event: BoxElementEventMap["box-rich-text-input"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RichTextInput, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/run/run-trace.js" {
  interface RunTrace {
    addEventListener<K extends keyof BoxElementEventMap["box-run-trace"] & string>(
      type: K,
      listener: (this: RunTrace, event: BoxElementEventMap["box-run-trace"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RunTrace, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-run-trace"] & string>(
      type: K,
      listener: (this: RunTrace, event: BoxElementEventMap["box-run-trace"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: RunTrace, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/search/saved-view-picker.js" {
  interface SavedViewPicker {
    addEventListener<K extends keyof BoxElementEventMap["box-saved-view-picker"] & string>(
      type: K,
      listener: (this: SavedViewPicker, event: BoxElementEventMap["box-saved-view-picker"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SavedViewPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-saved-view-picker"] & string>(
      type: K,
      listener: (this: SavedViewPicker, event: BoxElementEventMap["box-saved-view-picker"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SavedViewPicker, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/search-field.js" {
  interface SearchField {
    addEventListener<K extends keyof BoxElementEventMap["box-search-field"] & string>(
      type: K,
      listener: (this: SearchField, event: BoxElementEventMap["box-search-field"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SearchField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-search-field"] & string>(
      type: K,
      listener: (this: SearchField, event: BoxElementEventMap["box-search-field"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SearchField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/search/search-results-header.js" {
  interface SearchResultsHeader {
    addEventListener<K extends keyof BoxElementEventMap["box-search-results-header"] & string>(
      type: K,
      listener: (this: SearchResultsHeader, event: BoxElementEventMap["box-search-results-header"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SearchResultsHeader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-search-results-header"] & string>(
      type: K,
      listener: (this: SearchResultsHeader, event: BoxElementEventMap["box-search-results-header"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SearchResultsHeader, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/actions/segmented-control.js" {
  interface SegmentedControl {
    addEventListener<K extends keyof BoxElementEventMap["box-segmented-control"] & string>(
      type: K,
      listener: (this: SegmentedControl, event: BoxElementEventMap["box-segmented-control"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SegmentedControl, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-segmented-control"] & string>(
      type: K,
      listener: (this: SegmentedControl, event: BoxElementEventMap["box-segmented-control"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SegmentedControl, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/select.js" {
  interface Select {
    addEventListener<K extends keyof BoxElementEventMap["box-select"] & string>(
      type: K,
      listener: (this: Select, event: BoxElementEventMap["box-select"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Select, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-select"] & string>(
      type: K,
      listener: (this: Select, event: BoxElementEventMap["box-select"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Select, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/share/share-panel.js" {
  interface SharePanel {
    addEventListener<K extends keyof BoxElementEventMap["box-share-panel"] & string>(
      type: K,
      listener: (this: SharePanel, event: BoxElementEventMap["box-share-panel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SharePanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-share-panel"] & string>(
      type: K,
      listener: (this: SharePanel, event: BoxElementEventMap["box-share-panel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SharePanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/shortcuts-overlay.js" {
  interface ShortcutsOverlay {
    addEventListener<K extends keyof BoxElementEventMap["box-shortcuts-overlay"] & string>(
      type: K,
      listener: (this: ShortcutsOverlay, event: BoxElementEventMap["box-shortcuts-overlay"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ShortcutsOverlay, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-shortcuts-overlay"] & string>(
      type: K,
      listener: (this: ShortcutsOverlay, event: BoxElementEventMap["box-shortcuts-overlay"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ShortcutsOverlay, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/layout/sidebar-toggle-button.js" {
  interface SidebarToggleButton {
    addEventListener<K extends keyof BoxElementEventMap["box-sidebar-toggle-button"] & string>(
      type: K,
      listener: (this: SidebarToggleButton, event: BoxElementEventMap["box-sidebar-toggle-button"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SidebarToggleButton, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-sidebar-toggle-button"] & string>(
      type: K,
      listener: (this: SidebarToggleButton, event: BoxElementEventMap["box-sidebar-toggle-button"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SidebarToggleButton, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/slider.js" {
  interface Slider {
    addEventListener<K extends keyof BoxElementEventMap["box-slider"] & string>(
      type: K,
      listener: (this: Slider, event: BoxElementEventMap["box-slider"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Slider, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-slider"] & string>(
      type: K,
      listener: (this: Slider, event: BoxElementEventMap["box-slider"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Slider, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/spin-button.js" {
  interface SpinButton {
    addEventListener<K extends keyof BoxElementEventMap["box-spin-button"] & string>(
      type: K,
      listener: (this: SpinButton, event: BoxElementEventMap["box-spin-button"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SpinButton, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-spin-button"] & string>(
      type: K,
      listener: (this: SpinButton, event: BoxElementEventMap["box-spin-button"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SpinButton, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/layout/split-view.js" {
  interface SplitView {
    addEventListener<K extends keyof BoxElementEventMap["box-split-view"] & string>(
      type: K,
      listener: (this: SplitView, event: BoxElementEventMap["box-split-view"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SplitView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-split-view"] & string>(
      type: K,
      listener: (this: SplitView, event: BoxElementEventMap["box-split-view"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: SplitView, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/switch.js" {
  interface Switch {
    addEventListener<K extends keyof BoxElementEventMap["box-switch"] & string>(
      type: K,
      listener: (this: Switch, event: BoxElementEventMap["box-switch"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Switch, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-switch"] & string>(
      type: K,
      listener: (this: Switch, event: BoxElementEventMap["box-switch"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Switch, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/table.js" {
  interface Table {
    addEventListener<K extends keyof BoxElementEventMap["box-table"] & string>(
      type: K,
      listener: (this: Table, event: BoxElementEventMap["box-table"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Table, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-table"] & string>(
      type: K,
      listener: (this: Table, event: BoxElementEventMap["box-table"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Table, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/navigation/tabs.js" {
  interface Tabs {
    addEventListener<K extends keyof BoxElementEventMap["box-tabs"] & string>(
      type: K,
      listener: (this: Tabs, event: BoxElementEventMap["box-tabs"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tabs, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-tabs"] & string>(
      type: K,
      listener: (this: Tabs, event: BoxElementEventMap["box-tabs"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tabs, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/task/task-assignment-panel.js" {
  interface TaskAssignmentPanel {
    addEventListener<K extends keyof BoxElementEventMap["box-task-assignment-panel"] & string>(
      type: K,
      listener: (this: TaskAssignmentPanel, event: BoxElementEventMap["box-task-assignment-panel"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TaskAssignmentPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-task-assignment-panel"] & string>(
      type: K,
      listener: (this: TaskAssignmentPanel, event: BoxElementEventMap["box-task-assignment-panel"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TaskAssignmentPanel, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/text-area.js" {
  interface TextArea {
    addEventListener<K extends keyof BoxElementEventMap["box-text-area"] & string>(
      type: K,
      listener: (this: TextArea, event: BoxElementEventMap["box-text-area"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TextArea, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-text-area"] & string>(
      type: K,
      listener: (this: TextArea, event: BoxElementEventMap["box-text-area"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TextArea, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/text-field.js" {
  interface TextField {
    addEventListener<K extends keyof BoxElementEventMap["box-text-field"] & string>(
      type: K,
      listener: (this: TextField, event: BoxElementEventMap["box-text-field"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TextField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-text-field"] & string>(
      type: K,
      listener: (this: TextField, event: BoxElementEventMap["box-text-field"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TextField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/thumbnail-card.js" {
  interface ThumbnailCard {
    addEventListener<K extends keyof BoxElementEventMap["box-thumbnail-card"] & string>(
      type: K,
      listener: (this: ThumbnailCard, event: BoxElementEventMap["box-thumbnail-card"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ThumbnailCard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-thumbnail-card"] & string>(
      type: K,
      listener: (this: ThumbnailCard, event: BoxElementEventMap["box-thumbnail-card"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: ThumbnailCard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/tile-group.js" {
  interface TileGroup {
    addEventListener<K extends keyof BoxElementEventMap["box-tile-group"] & string>(
      type: K,
      listener: (this: TileGroup, event: BoxElementEventMap["box-tile-group"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TileGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-tile-group"] & string>(
      type: K,
      listener: (this: TileGroup, event: BoxElementEventMap["box-tile-group"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TileGroup, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/forms/time-field.js" {
  interface TimeField {
    addEventListener<K extends keyof BoxElementEventMap["box-time-field"] & string>(
      type: K,
      listener: (this: TimeField, event: BoxElementEventMap["box-time-field"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TimeField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-time-field"] & string>(
      type: K,
      listener: (this: TimeField, event: BoxElementEventMap["box-time-field"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TimeField, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/timeline/timeline.js" {
  interface Timeline {
    addEventListener<K extends keyof BoxElementEventMap["box-timeline"] & string>(
      type: K,
      listener: (this: Timeline, event: BoxElementEventMap["box-timeline"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Timeline, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-timeline"] & string>(
      type: K,
      listener: (this: Timeline, event: BoxElementEventMap["box-timeline"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Timeline, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/feedback/toast.js" {
  interface Toast {
    addEventListener<K extends keyof BoxElementEventMap["box-toast"] & string>(
      type: K,
      listener: (this: Toast, event: BoxElementEventMap["box-toast"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Toast, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-toast"] & string>(
      type: K,
      listener: (this: Toast, event: BoxElementEventMap["box-toast"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Toast, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/overlays/tooltip.js" {
  interface Tooltip {
    addEventListener<K extends keyof BoxElementEventMap["box-tooltip"] & string>(
      type: K,
      listener: (this: Tooltip, event: BoxElementEventMap["box-tooltip"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tooltip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-tooltip"] & string>(
      type: K,
      listener: (this: Tooltip, event: BoxElementEventMap["box-tooltip"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tooltip, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/tree.js" {
  interface Tree {
    addEventListener<K extends keyof BoxElementEventMap["box-tree"] & string>(
      type: K,
      listener: (this: Tree, event: BoxElementEventMap["box-tree"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tree, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-tree"] & string>(
      type: K,
      listener: (this: Tree, event: BoxElementEventMap["box-tree"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: Tree, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./components/collections/tree-grid.js" {
  interface TreeGrid {
    addEventListener<K extends keyof BoxElementEventMap["box-tree-grid"] & string>(
      type: K,
      listener: (this: TreeGrid, event: BoxElementEventMap["box-tree-grid"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TreeGrid, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-tree-grid"] & string>(
      type: K,
      listener: (this: TreeGrid, event: BoxElementEventMap["box-tree-grid"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: TreeGrid, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/share/unified-share-modal.js" {
  interface UnifiedShareModal {
    addEventListener<K extends keyof BoxElementEventMap["box-unified-share-modal"] & string>(
      type: K,
      listener: (this: UnifiedShareModal, event: BoxElementEventMap["box-unified-share-modal"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: UnifiedShareModal, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-unified-share-modal"] & string>(
      type: K,
      listener: (this: UnifiedShareModal, event: BoxElementEventMap["box-unified-share-modal"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: UnifiedShareModal, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/versions/version-graph.js" {
  interface VersionGraph {
    addEventListener<K extends keyof BoxElementEventMap["box-version-graph"] & string>(
      type: K,
      listener: (this: VersionGraph, event: BoxElementEventMap["box-version-graph"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: VersionGraph, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-version-graph"] & string>(
      type: K,
      listener: (this: VersionGraph, event: BoxElementEventMap["box-version-graph"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: VersionGraph, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/versions/version-list.js" {
  interface VersionList {
    addEventListener<K extends keyof BoxElementEventMap["box-version-list"] & string>(
      type: K,
      listener: (this: VersionList, event: BoxElementEventMap["box-version-list"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: VersionList, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-version-list"] & string>(
      type: K,
      listener: (this: VersionList, event: BoxElementEventMap["box-version-list"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: VersionList, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/form-wizard/wizard-summary.js" {
  interface WizardSummary {
    addEventListener<K extends keyof BoxElementEventMap["box-wizard-summary"] & string>(
      type: K,
      listener: (this: WizardSummary, event: BoxElementEventMap["box-wizard-summary"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WizardSummary, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-wizard-summary"] & string>(
      type: K,
      listener: (this: WizardSummary, event: BoxElementEventMap["box-wizard-summary"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WizardSummary, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/work-queue/work-queue.js" {
  interface WorkQueue {
    addEventListener<K extends keyof BoxElementEventMap["box-work-queue"] & string>(
      type: K,
      listener: (this: WorkQueue, event: BoxElementEventMap["box-work-queue"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WorkQueue, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-work-queue"] & string>(
      type: K,
      listener: (this: WorkQueue, event: BoxElementEventMap["box-work-queue"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WorkQueue, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}

declare module "./patterns/work-queue/workload-board.js" {
  interface WorkloadBoard {
    addEventListener<K extends keyof BoxElementEventMap["box-workload-board"] & string>(
      type: K,
      listener: (this: WorkloadBoard, event: BoxElementEventMap["box-workload-board"][K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WorkloadBoard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BoxElementEventMap["box-workload-board"] & string>(
      type: K,
      listener: (this: WorkloadBoard, event: BoxElementEventMap["box-workload-board"][K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: WorkloadBoard, event: HTMLElementEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}
