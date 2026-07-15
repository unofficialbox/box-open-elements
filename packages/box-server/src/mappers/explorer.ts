import type {
  ExplorerBreadcrumb,
  ExplorerFolder,
  ExplorerItem,
  ExplorerItemOwner,
  ExplorerItemPermissions,
  ExplorerItemSharedLinkSummary,
  ExplorerPaginationState,
  ExplorerSearchResult,
  ExplorerTransportResult,
} from "../../../../src/patterns/content-explorer/types.js";

/** Raw Box REST shapes (only the fields this adapter consumes). */
export interface BoxRawItem {
  id: string;
  type: "file" | "folder" | "web_link";
  name?: string;
  size?: number | null;
  modified_at?: string | null;
  created_at?: string | null;
  extension?: string | null;
  owned_by?: { id?: string; name?: string; type?: string } | null;
  shared_link?: { url?: string; access?: string; effective_access?: string } | null;
  permissions?: {
    can_download?: boolean;
    can_preview?: boolean;
    can_share?: boolean;
    can_delete?: boolean;
    can_rename?: boolean;
    can_upload?: boolean;
  } | null;
  parent?: { id?: string; name?: string; type?: string } | null;
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

const mapOwner = (ownedBy: BoxRawItem["owned_by"]): ExplorerItemOwner | null | undefined => {
  if (ownedBy == null) {
    return ownedBy === null ? null : undefined;
  }
  if (!ownedBy.id || !ownedBy.name) {
    return undefined;
  }
  const type = ownedBy.type === "group" || ownedBy.type === "user" ? ownedBy.type : undefined;
  return { id: ownedBy.id, name: ownedBy.name, ...(type ? { type } : {}) };
};

const mapPermissions = (permissions: BoxRawItem["permissions"]): ExplorerItemPermissions | undefined => {
  if (!permissions) {
    return undefined;
  }
  return {
    ...(typeof permissions.can_download === "boolean" ? { canDownload: permissions.can_download } : {}),
    ...(typeof permissions.can_preview === "boolean" ? { canPreview: permissions.can_preview } : {}),
    ...(typeof permissions.can_share === "boolean" ? { canShare: permissions.can_share } : {}),
    ...(typeof permissions.can_delete === "boolean" ? { canDelete: permissions.can_delete } : {}),
    ...(typeof permissions.can_rename === "boolean" ? { canRename: permissions.can_rename } : {}),
    ...(typeof permissions.can_upload === "boolean" ? { canUpload: permissions.can_upload } : {}),
  };
};

const mapSharedLinkSummary = (
  sharedLink: BoxRawItem["shared_link"],
): ExplorerItemSharedLinkSummary | null | undefined => {
  if (sharedLink === undefined) {
    return undefined;
  }
  if (sharedLink === null || !sharedLink.url) {
    return sharedLink === null ? null : { isShared: false };
  }
  const accessRaw = sharedLink.effective_access ?? sharedLink.access;
  const access =
    accessRaw === "open" || accessRaw === "company" || accessRaw === "collaborators" ? accessRaw : undefined;
  return {
    isShared: true,
    ...(access ? { access } : {}),
    url: sharedLink.url,
  };
};

export const mapExplorerItem = (raw: BoxRawItem): ExplorerItem => {
  const owner = mapOwner(raw.owned_by);
  const permissions = mapPermissions(raw.permissions);
  const sharedLink = mapSharedLinkSummary(raw.shared_link);
  const parent =
    raw.parent?.id != null
      ? { id: raw.parent.id, ...(raw.parent.name ? { name: raw.parent.name } : {}) }
      : raw.parent === null
        ? null
        : undefined;

  const item: ExplorerItem = {
    id: raw.id,
    name: raw.name?.trim() || NAME_FALLBACK,
    type: raw.type,
  };

  if (raw.size !== undefined) {
    item.size = raw.size;
  }
  if (raw.modified_at !== undefined) {
    item.modifiedAt = raw.modified_at;
  }
  if (raw.created_at !== undefined) {
    item.createdAt = raw.created_at;
  }
  if (raw.extension !== undefined) {
    item.extension = raw.extension;
  }
  if (owner !== undefined) {
    item.owner = owner;
  }
  if (permissions && Object.keys(permissions).length > 0) {
    item.permissions = permissions;
  }
  if (sharedLink !== undefined) {
    item.sharedLink = sharedLink;
  }
  if (raw.extension !== undefined || permissions?.canPreview !== undefined) {
    item.preview = {
      ...(typeof permissions?.canPreview === "boolean" ? { canPreview: permissions.canPreview } : {}),
      ...(raw.extension !== undefined ? { extension: raw.extension } : {}),
    };
  }
  if (parent !== undefined) {
    item.parent = parent;
  }

  return item;
};

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
  const nextOffset = offset + returned;
  const hasMoreItems =
    totalCount === null ? returned >= limit : nextOffset < totalCount;
  return { hasMoreItems, limit, offset, totalCount, nextOffset };
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

export const buildExplorerSearchResult = (
  query: string,
  collection: BoxRawItemCollection,
  requested: { limit: number; offset: number; ancestorFolderId?: string },
): ExplorerSearchResult => ({
  query,
  ...(requested.ancestorFolderId ? { ancestorFolderId: requested.ancestorFolderId } : {}),
  items: (collection.entries ?? []).map(mapExplorerItem),
  pagination: mapPagination(collection, requested),
});
