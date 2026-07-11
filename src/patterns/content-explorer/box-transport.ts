import type {
  ExplorerBreadcrumb,
  ExplorerFetchLike,
  ExplorerFolder,
  ExplorerItem,
  ExplorerItemCollection,
  ExplorerTransport,
  ExplorerTransportRequest,
  ExplorerTransportResult,
} from "./types.js";

interface BoxFolderItem {
  id: string;
  name: string;
  type: string;
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

export interface BoxExplorerTransportOptions {
  apiBaseUrl?: string;
  fields?: string[];
  fetch?: ExplorerFetchLike;
}

const DEFAULT_API_BASE_URL = "https://api.box.com/2.0";
const DEFAULT_FIELDS = ["id", "name", "type"];

const isSupportedItemType = (type: string): type is ExplorerItem["type"] =>
  type === "file" || type === "folder" || type === "web_link";

const normalizeItems = (entries: BoxFolderItem[]): ExplorerItemCollection => ({
  entries: entries
    .filter((entry): entry is BoxFolderItem & { type: ExplorerItem["type"] } => isSupportedItemType(entry.type))
    .map(entry => ({
      id: entry.id,
      name: entry.name,
      type: entry.type,
    })),
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
      const { entries } = normalizeItems(payload.entries ?? []);
      const offset = payload.offset ?? request.offset ?? 0;
      const limit = payload.limit ?? request.limit ?? entries.length;
      const totalCount = payload.total_count ?? null;
      const nextOffset = offset + entries.length;

      const folder = normalizeFolder(payload, request.folderId);

      return {
        breadcrumbs: normalizeBreadcrumbs(payload, folder),
        folder,
        folderId: request.folderId,
        items: entries,
        pagination: {
          hasMoreItems: totalCount === null ? entries.length === limit : nextOffset < totalCount,
          limit,
          offset,
          totalCount,
        },
      };
    },
  };
};
