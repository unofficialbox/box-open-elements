import type { ExplorerItem, ExplorerPaginationState } from "../types.js";

export interface ExplorerCollectionControllerOptions {
  pageSize?: number;
}

export interface ExplorerCollectionState {
  items: ExplorerItem[];
  loading: boolean;
  pagination: ExplorerPaginationState;
}

export interface ExplorerCollectionEvents {
  itemsChanged: { items: ExplorerItem[] };
  loadingChanged: { loading: boolean };
  paginationChanged: { pagination: ExplorerPaginationState };
}
