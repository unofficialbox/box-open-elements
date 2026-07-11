export interface ExplorerItem {
  id: string;
  name: string;
  type: "file" | "folder" | "web_link";
}

export type ExplorerSelectionMode = "multiple" | "single";

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

export interface ExplorerPaginationState {
  hasMoreItems: boolean;
  limit: number;
  offset: number;
  totalCount: number | null;
}

export interface ExplorerTransportResult {
  breadcrumbs: ExplorerBreadcrumb[];
  folder: ExplorerFolder;
  folderId: string;
  items: ExplorerItem[];
  pagination: ExplorerPaginationState;
}

export interface ExplorerTransport {
  loadFolderItems(request: ExplorerTransportRequest): Promise<ExplorerTransportResult>;
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
}
