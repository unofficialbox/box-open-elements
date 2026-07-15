export interface ExplorerItemPermissions {
  canDownload?: boolean;
  canPreview?: boolean;
  canShare?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
  canUpload?: boolean;
}

export interface ExplorerItemOwner {
  id: string;
  name: string;
  type?: "user" | "group";
}

/** Lightweight list-row signal; full share state stays in patterns/share. */
export interface ExplorerItemSharedLinkSummary {
  isShared: boolean;
  access?: "open" | "company" | "collaborators";
  url?: string;
}

export interface ExplorerItemPreviewAffordance {
  canPreview?: boolean;
  extension?: string | null;
  mimeType?: string | null;
}

export interface ExplorerItem {
  id: string;
  name: string;
  type: "file" | "folder" | "web_link";
  size?: number | null;
  modifiedAt?: string | null;
  createdAt?: string | null;
  extension?: string | null;
  owner?: ExplorerItemOwner | null;
  permissions?: ExplorerItemPermissions;
  sharedLink?: ExplorerItemSharedLinkSummary | null;
  preview?: ExplorerItemPreviewAffordance;
  /** Useful in search results; omit in folder listing when redundant. */
  parent?: { id: string; name?: string } | null;
}

export type ExplorerSelectionMode = "multiple" | "single";

/**
 * Presentation gesture mapping for explorer item rows:
 * - `split` (default): click/Space select; Enter/dblclick activate
 * - `legacy`: click/Enter/Space both select and activate
 */
export type ExplorerItemGesture = "split" | "legacy";

export const resolveExplorerItemGesture = (value: string | null | undefined): ExplorerItemGesture =>
  value === "legacy" ? "legacy" : "split";

/** Legacy click/Space also activates; split mode selects only. */
export const shouldActivateOnClick = (gesture: ExplorerItemGesture): boolean => gesture === "legacy";

/** Legacy Enter also toggles selection before activate; split mode activates only. */
export const shouldToggleOnEnter = (gesture: ExplorerItemGesture): boolean => gesture === "legacy";

export type ExplorerViewMode = "folder" | "search";

export interface ExplorerViewState {
  mode: ExplorerViewMode;
  /** Non-null when mode === "search". */
  searchQuery: string | null;
  /** Folder scope for search; defaults to current folder when entering search. */
  searchAncestorFolderId: string | null;
}

export const createInitialExplorerViewState = (): ExplorerViewState => ({
  mode: "folder",
  searchQuery: null,
  searchAncestorFolderId: null,
});

export interface ExplorerItemAction {
  id: string;
  itemTypes?: ExplorerItem["type"][];
  label: string;
}

export interface ExplorerFolder {
  id: string;
  name: string;
  type: "folder";
}

export interface ExplorerBreadcrumb {
  id: string;
  name: string;
  type: "folder";
}

export interface ExplorerItemCollection {
  entries: ExplorerItem[];
}

export interface ExplorerTransportRequest {
  folderId: string;
  limit?: number;
  offset?: number;
  token: string;
  language?: string;
  signal?: AbortSignal;
}

export interface ExplorerSearchRequest {
  query: string;
  ancestorFolderId?: string;
  limit?: number;
  offset?: number;
  token: string;
  language?: string;
  signal?: AbortSignal;
}

export interface ExplorerPaginationState {
  hasMoreItems: boolean;
  limit: number;
  offset: number;
  totalCount: number | null;
  /**
   * Upstream cursor for the next page when client-side filtering shrinks `items`
   * (e.g. unsupported Box entry types). Controllers should prefer this over
   * `items.length` when requesting the next page.
   */
  nextOffset?: number;
}

export interface ExplorerTransportResult {
  breadcrumbs: ExplorerBreadcrumb[];
  folder: ExplorerFolder;
  folderId: string;
  items: ExplorerItem[];
  pagination: ExplorerPaginationState;
}

export interface ExplorerSearchResult {
  query: string;
  ancestorFolderId?: string;
  items: ExplorerItem[];
  pagination: ExplorerPaginationState;
}

export interface ExplorerTransport {
  loadFolderItems(request: ExplorerTransportRequest): Promise<ExplorerTransportResult>;
  searchItems?(request: ExplorerSearchRequest): Promise<ExplorerSearchResult>;
}

export interface ExplorerFetchLike {
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

export interface ExplorerSessionConfig {
  container?: Element | null;
  itemActions?: ExplorerItemAction[];
  rootFolderId: string;
  selectionMode?: ExplorerSelectionMode;
  token: string;
  language?: string;
  pageSize?: number;
  transport: ExplorerTransport;
}

export interface ExplorerErrorState {
  code: "load_failed";
  message: string;
}

export interface ExplorerState {
  availableActionsByItemId: Record<string, ExplorerItemAction[]>;
  breadcrumbs: ExplorerBreadcrumb[];
  connected: boolean;
  currentFolder: ExplorerFolder | null;
  currentFolderId: string;
  error: ExplorerErrorState | null;
  items: ExplorerItem[];
  loading: boolean;
  pagination: ExplorerPaginationState;
  selectedItemIds: string[];
  view: ExplorerViewState;
}

export interface ExplorerEvents {
  breadcrumbsChanged: { breadcrumbs: ExplorerBreadcrumb[] };
  connected: { folderId: string };
  disconnected: undefined;
  folderChanged: { folder: ExplorerFolder };
  loadFailed: { folderId: string; message: string };
  loadSucceeded: {
    folder: ExplorerFolder;
    folderId: string;
    items: ExplorerItem[];
    pagination: ExplorerPaginationState;
  };
  loadingChanged: { loading: boolean };
  folderLoaded: { folder: ExplorerFolder };
  itemActivated: { item: ExplorerItem };
  itemsChanged: { items: ExplorerItem[] };
  itemActionInvoked: { action: ExplorerItemAction; item: ExplorerItem };
  paginationChanged: { pagination: ExplorerPaginationState };
  selectionChanged: { selectedItemIds: string[] };
  viewChanged: { view: ExplorerViewState };
  searchSucceeded: {
    query: string;
    items: ExplorerItem[];
    pagination: ExplorerPaginationState;
  };
}
