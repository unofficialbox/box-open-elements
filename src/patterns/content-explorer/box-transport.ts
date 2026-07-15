import type {
  ExplorerBreadcrumb,
  ExplorerFetchLike,
  ExplorerFolder,
  ExplorerItem,
  ExplorerItemCollection,
  ExplorerItemOwner,
  ExplorerItemPermissions,
  ExplorerItemSharedLinkSummary,
  ExplorerSearchRequest,
  ExplorerSearchResult,
  ExplorerTransport,
  ExplorerTransportRequest,
  ExplorerTransportResult,
} from "./types.js";

interface BoxOwnedBy {
  id?: string;
  name?: string;
  type?: string;
}

interface BoxSharedLink {
  url?: string;
  access?: string;
  effective_access?: string;
}

interface BoxPermissions {
  can_download?: boolean;
  can_preview?: boolean;
  can_share?: boolean;
  can_delete?: boolean;
  can_rename?: boolean;
  can_upload?: boolean;
}

interface BoxFolderItem {
  id: string;
  name: string;
  type: string;
  size?: number | null;
  modified_at?: string | null;
  created_at?: string | null;
  extension?: string | null;
  owned_by?: BoxOwnedBy | null;
  shared_link?: BoxSharedLink | null;
  permissions?: BoxPermissions | null;
  parent?: { id?: string; name?: string; type?: string } | null;
}

interface BoxFolderItemsResponse {
  entries?: BoxFolderItem[];
  id?: string;
  limit?: number;
  name?: string;
  offset?: number;
  path_collection?: {
    entries?: Array<{
      id: string;
      name: string;
      type: string;
    }>;
  };
  total_count?: number;
  type?: string;
}

interface BoxSearchResponse {
  entries?: BoxFolderItem[];
  limit?: number;
  offset?: number;
  total_count?: number;
}

export interface BoxExplorerTransportOptions {
  apiBaseUrl?: string;
  fields?: string[];
  fetch?: ExplorerFetchLike;
}

const DEFAULT_API_BASE_URL = "https://api.box.com/2.0";
const DEFAULT_FIELDS = [
  "id",
  "name",
  "type",
  "size",
  "modified_at",
  "created_at",
  "extension",
  "owned_by",
  "shared_link",
  "permissions",
  "parent",
];

const isSupportedItemType = (type: string): type is ExplorerItem["type"] =>
  type === "file" || type === "folder" || type === "web_link";

const mapOwner = (ownedBy: BoxOwnedBy | null | undefined): ExplorerItemOwner | null | undefined => {
  if (ownedBy == null) {
    return ownedBy === null ? null : undefined;
  }
  if (!ownedBy.id || !ownedBy.name) {
    return undefined;
  }
  const type = ownedBy.type === "group" || ownedBy.type === "user" ? ownedBy.type : undefined;
  return { id: ownedBy.id, name: ownedBy.name, ...(type ? { type } : {}) };
};

const mapPermissions = (permissions: BoxPermissions | null | undefined): ExplorerItemPermissions | undefined => {
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

const mapSharedLink = (
  sharedLink: BoxSharedLink | null | undefined,
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

export const normalizeBoxExplorerItem = (entry: BoxFolderItem): ExplorerItem | null => {
  if (!isSupportedItemType(entry.type)) {
    return null;
  }

  const owner = mapOwner(entry.owned_by);
  const permissions = mapPermissions(entry.permissions);
  const sharedLink = mapSharedLink(entry.shared_link);
  const parent =
    entry.parent?.id != null
      ? { id: entry.parent.id, ...(entry.parent.name ? { name: entry.parent.name } : {}) }
      : entry.parent === null
        ? null
        : undefined;

  const item: ExplorerItem = {
    id: entry.id,
    name: entry.name,
    type: entry.type,
  };

  if (entry.size !== undefined) {
    item.size = entry.size;
  }
  if (entry.modified_at !== undefined) {
    item.modifiedAt = entry.modified_at;
  }
  if (entry.created_at !== undefined) {
    item.createdAt = entry.created_at;
  }
  if (entry.extension !== undefined) {
    item.extension = entry.extension;
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
  if (entry.extension !== undefined || permissions?.canPreview !== undefined) {
    item.preview = {
      ...(typeof permissions?.canPreview === "boolean" ? { canPreview: permissions.canPreview } : {}),
      ...(entry.extension !== undefined ? { extension: entry.extension } : {}),
    };
  }
  if (parent !== undefined) {
    item.parent = parent;
  }

  return item;
};

const normalizeItems = (entries: BoxFolderItem[]): ExplorerItemCollection => ({
  entries: entries
    .map(normalizeBoxExplorerItem)
    .filter((entry): entry is ExplorerItem => entry !== null),
});

const normalizeFolder = (payload: BoxFolderItemsResponse, folderId: string): ExplorerFolder => ({
  id: payload.id ?? folderId,
  name: payload.name ?? folderId,
  type: "folder",
});

const normalizeBreadcrumbs = (payload: BoxFolderItemsResponse, folder: ExplorerFolder): ExplorerBreadcrumb[] => {
  const parents =
    payload.path_collection?.entries?.filter((entry): entry is ExplorerBreadcrumb => entry.type === "folder") ?? [];

  return [...parents, folder];
};

const resolveFetch = (providedFetch?: ExplorerFetchLike): ExplorerFetchLike => {
  if (providedFetch) {
    return providedFetch;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required to use the Box explorer transport");
  }

  return globalThis.fetch.bind(globalThis) as ExplorerFetchLike;
};

const createFolderItemsUrl = (
  apiBaseUrl: string,
  folderId: string,
  fields: string[],
  limit?: number,
  offset?: number,
): string => {
  const url = new URL(`${apiBaseUrl.replace(/\/$/, "")}/folders/${folderId}/items`);
  url.searchParams.set("fields", fields.join(","));
  if (typeof limit === "number") {
    url.searchParams.set("limit", String(limit));
  }
  if (typeof offset === "number") {
    url.searchParams.set("offset", String(offset));
  }
  return url.toString();
};

const createSearchUrl = (
  apiBaseUrl: string,
  query: string,
  fields: string[],
  ancestorFolderId?: string,
  limit?: number,
  offset?: number,
): string => {
  const url = new URL(`${apiBaseUrl.replace(/\/$/, "")}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("fields", fields.join(","));
  if (ancestorFolderId) {
    url.searchParams.set("ancestor_folder_ids", ancestorFolderId);
  }
  if (typeof limit === "number") {
    url.searchParams.set("limit", String(limit));
  }
  if (typeof offset === "number") {
    url.searchParams.set("offset", String(offset));
  }
  return url.toString();
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string; code?: string };
    if (payload.message) {
      return payload.code ? `${payload.code}: ${payload.message}` : payload.message;
    }
  } catch {
    // Ignore JSON parse issues and fall back to status text.
  }

  return `Box API request failed with status ${response.status}`;
};

const toPagination = (
  payload: { offset?: number; limit?: number; total_count?: number },
  rawEntriesLength: number,
  request: { offset?: number; limit?: number },
) => {
  const offset = payload.offset ?? request.offset ?? 0;
  const limit = payload.limit ?? request.limit ?? rawEntriesLength;
  const totalCount = payload.total_count ?? null;
  const nextOffset = offset + rawEntriesLength;
  return {
    hasMoreItems: totalCount === null ? rawEntriesLength === limit : nextOffset < totalCount,
    limit,
    offset,
    totalCount,
    nextOffset,
  };
};

export const createBoxExplorerTransport = (options: BoxExplorerTransportOptions = {}): ExplorerTransport => {
  const apiBaseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL;
  const fields = options.fields ?? DEFAULT_FIELDS;
  const fetchImpl = resolveFetch(options.fetch);

  return {
    async loadFolderItems(request: ExplorerTransportRequest): Promise<ExplorerTransportResult> {
      const response = await fetchImpl(
        createFolderItemsUrl(apiBaseUrl, request.folderId, fields, request.limit, request.offset),
        {
          headers: {
            Authorization: `Bearer ${request.token}`,
            "Accept-Language": request.language ?? "en-US",
          },
          method: "GET",
          signal: request.signal,
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const payload = (await response.json()) as BoxFolderItemsResponse;
      const rawEntries = payload.entries ?? [];
      const { entries } = normalizeItems(rawEntries);
      const folder = normalizeFolder(payload, request.folderId);

      return {
        breadcrumbs: normalizeBreadcrumbs(payload, folder),
        folder,
        folderId: request.folderId,
        items: entries,
        pagination: toPagination(payload, rawEntries.length, request),
      };
    },

    async searchItems(request: ExplorerSearchRequest): Promise<ExplorerSearchResult> {
      const response = await fetchImpl(
        createSearchUrl(
          apiBaseUrl,
          request.query,
          fields,
          request.ancestorFolderId,
          request.limit,
          request.offset,
        ),
        {
          headers: {
            Authorization: `Bearer ${request.token}`,
            "Accept-Language": request.language ?? "en-US",
          },
          method: "GET",
          signal: request.signal,
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const payload = (await response.json()) as BoxSearchResponse;
      const rawEntries = payload.entries ?? [];
      const { entries } = normalizeItems(rawEntries);

      return {
        query: request.query,
        ...(request.ancestorFolderId ? { ancestorFolderId: request.ancestorFolderId } : {}),
        items: entries,
        pagination: toPagination(payload, rawEntries.length, request),
      };
    },
  };
};
