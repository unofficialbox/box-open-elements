import type {
  ExplorerBreadcrumb,
  ExplorerFolder,
  ExplorerItem,
  ExplorerPaginationState,
  ExplorerTransportResult,
} from "../../../../src/patterns/content-explorer/types.js";

/** Raw Box REST shapes (only the fields this adapter consumes). */
export interface BoxRawItem {
  id: string;
  type: "file" | "folder" | "web_link";
  name?: string;
}

export interface BoxRawFolder {
  id: string;
  name?: string;
  type: "folder";
  path_collection?: { entries?: BoxRawItem[] };
}

export interface BoxRawItemCollection {
  total_count?: number;
  entries?: BoxRawItem[];
  offset?: number;
  limit?: number;
}

const NAME_FALLBACK = "Untitled";

export const mapExplorerItem = (raw: BoxRawItem): ExplorerItem => ({
  id: raw.id,
  name: raw.name?.trim() || NAME_FALLBACK,
  type: raw.type,
});

export const mapExplorerFolder = (raw: BoxRawFolder): ExplorerFolder => ({
  id: raw.id,
  name: raw.name?.trim() || NAME_FALLBACK,
  type: "folder",
});

/**
 * Box returns ancestors in `path_collection` (root → parent). The current
 * folder is appended so the trail ends on where the user is.
 */
export const mapBreadcrumbs = (folder: BoxRawFolder): ExplorerBreadcrumb[] => {
  const ancestors = (folder.path_collection?.entries ?? [])
    .filter(entry => entry.type === "folder")
    .map(entry => ({ id: entry.id, name: entry.name?.trim() || NAME_FALLBACK, type: "folder" as const }));
  return [...ancestors, { id: folder.id, name: folder.name?.trim() || NAME_FALLBACK, type: "folder" }];
};

export const mapPagination = (
  collection: BoxRawItemCollection,
  requested: { limit: number; offset: number },
): ExplorerPaginationState => {
  const offset = collection.offset ?? requested.offset;
  const limit = collection.limit ?? requested.limit;
  const totalCount = typeof collection.total_count === "number" ? collection.total_count : null;
  const returned = collection.entries?.length ?? 0;
  const hasMoreItems =
    totalCount === null ? returned >= limit : offset + returned < totalCount;
  return { hasMoreItems, limit, offset, totalCount };
};

export const buildExplorerResult = (
  folder: BoxRawFolder,
  collection: BoxRawItemCollection,
  requested: { limit: number; offset: number },
): ExplorerTransportResult => ({
  breadcrumbs: mapBreadcrumbs(folder),
  folder: mapExplorerFolder(folder),
  folderId: folder.id,
  items: (collection.entries ?? []).map(mapExplorerItem),
  pagination: mapPagination(collection, requested),
});
