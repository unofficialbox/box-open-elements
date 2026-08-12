import type {
  ExplorerFetchLike,
  ExplorerItem,
  ExplorerSearchResult,
  ExplorerSortBy,
  ExplorerSortDirection,
  ExplorerTransport,
  ExplorerTransportResult,
} from "./types.js";

export interface ContentExplorerRequestContext {
  locale?: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface ContentExplorerListFolderInput {
  folderId: string;
  limit?: number;
  offset?: number;
  sortBy?: ExplorerSortBy;
  sortDirection?: ExplorerSortDirection;
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerSearchInput {
  query: string;
  ancestorFolderId?: string;
  limit?: number;
  offset?: number;
  sortBy?: ExplorerSortBy;
  sortDirection?: ExplorerSortDirection;
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerCreateFolderInput {
  parentFolderId: string;
  name: string;
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerRenameItemInput {
  itemId: string;
  itemType: ExplorerItem["type"];
  name: string;
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerDeleteItemInput {
  itemId: string;
  itemType: ExplorerItem["type"];
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerDataSource {
  listFolderItems(input: ContentExplorerListFolderInput): Promise<ExplorerTransportResult>;
  search?(input: ContentExplorerSearchInput): Promise<ExplorerSearchResult>;
  createFolder?(input: ContentExplorerCreateFolderInput): Promise<ExplorerItem>;
  renameItem?(input: ContentExplorerRenameItemInput): Promise<ExplorerItem>;
  deleteItem?(input: ContentExplorerDeleteItemInput): Promise<void>;
}

export interface ContentExplorerHttpDataSourceOptions {
  baseUrl?: string;
  fetch?: ExplorerFetchLike;
  headers?: Record<string, string>;
  buildListFolderUrl?: (input: ContentExplorerListFolderInput) => string;
  buildSearchUrl?: (input: ContentExplorerSearchInput) => string;
}

const resolveFetch = (providedFetch?: ExplorerFetchLike): ExplorerFetchLike => {
  if (providedFetch) {
    return providedFetch;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required to use the explorer HTTP data source.");
  }

  return globalThis.fetch.bind(globalThis) as ExplorerFetchLike;
};

const resolveUrlBase = (): string => {
  if (typeof globalThis.location?.href === "string" && globalThis.location.href.length > 0) {
    return globalThis.location.href;
  }

  return "http://localhost";
};

const applyPageAndSortParams = (
  url: URL,
  input: { limit?: number; offset?: number; sortBy?: ExplorerSortBy; sortDirection?: ExplorerSortDirection },
): void => {
  if (typeof input.limit === "number") {
    url.searchParams.set("limit", String(input.limit));
  }
  if (typeof input.offset === "number") {
    url.searchParams.set("offset", String(input.offset));
  }
  if (input.sortBy) {
    url.searchParams.set("sortBy", input.sortBy);
    url.searchParams.set("sortDirection", input.sortDirection ?? "ASC");
  }
};

const defaultListFolderUrl = (baseUrl: string, input: ContentExplorerListFolderInput): string => {
  const root = baseUrl.replace(/\/$/, "");
  const url = new URL(`${root}/folders/${encodeURIComponent(input.folderId)}/items`, resolveUrlBase());
  applyPageAndSortParams(url, input);
  return url.toString();
};

const defaultSearchUrl = (baseUrl: string, input: ContentExplorerSearchInput): string => {
  const root = baseUrl.replace(/\/$/, "");
  const url = new URL(`${root}/search`, resolveUrlBase());
  url.searchParams.set("query", input.query);
  if (input.ancestorFolderId) {
    url.searchParams.set("ancestorFolderId", input.ancestorFolderId);
  }
  applyPageAndSortParams(url, input);
  return url.toString();
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string; code?: string };
    if (payload.message) {
      return payload.code ? `${payload.code}: ${payload.message}` : payload.message;
    }
  } catch {
    // ignore parse issues and fall back to status text
  }

  return `Explorer request failed with status ${response.status}`;
};

export const createExplorerTransportFromDataSource = (
  dataSource: ContentExplorerDataSource,
): ExplorerTransport => {
  const transport: ExplorerTransport = {
    loadFolderItems(request) {
      return dataSource.listFolderItems({
        folderId: request.folderId,
        limit: request.limit,
        offset: request.offset,
        sortBy: request.sortBy,
        sortDirection: request.sortDirection,
        context: {
          locale: request.language,
          signal: request.signal,
        },
      });
    },
  };

  if (dataSource.search) {
    const search = dataSource.search.bind(dataSource);
    transport.searchItems = request =>
      search({
        query: request.query,
        ancestorFolderId: request.ancestorFolderId,
        limit: request.limit,
        offset: request.offset,
        sortBy: request.sortBy,
        sortDirection: request.sortDirection,
        context: {
          locale: request.language,
          signal: request.signal,
        },
      });
  }

  if (dataSource.createFolder) {
    const createFolder = dataSource.createFolder.bind(dataSource);
    transport.createFolder = request =>
      createFolder({
        parentFolderId: request.parentFolderId,
        name: request.name,
        context: { locale: request.language, signal: request.signal },
      });
  }

  if (dataSource.renameItem) {
    const renameItem = dataSource.renameItem.bind(dataSource);
    transport.renameItem = request =>
      renameItem({
        itemId: request.itemId,
        itemType: request.itemType,
        name: request.name,
        context: { locale: request.language, signal: request.signal },
      });
  }

  if (dataSource.deleteItem) {
    const deleteItem = dataSource.deleteItem.bind(dataSource);
    transport.deleteItem = request =>
      deleteItem({
        itemId: request.itemId,
        itemType: request.itemType,
        context: { locale: request.language, signal: request.signal },
      });
  }

  return transport;
};

export const createHttpContentExplorerDataSource = (
  options: ContentExplorerHttpDataSourceOptions = {},
): ContentExplorerDataSource => {
  const fetchImpl = resolveFetch(options.fetch);
  const baseUrl = options.baseUrl ?? "/api/content-explorer";

  const request = async (
    url: string,
    input: { context?: ContentExplorerRequestContext },
    init: { method: string; body?: unknown } = { method: "GET" },
  ): Promise<Response> => {
    const response = await fetchImpl(url, {
      method: init.method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(input.context?.locale ? { "accept-language": input.context.locale } : {}),
        ...(input.context?.requestId ? { "x-request-id": input.context.requestId } : {}),
        ...options.headers,
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      signal: input.context?.signal,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    return response;
  };

  const requestJson = async <T>(
    url: string,
    input: { context?: ContentExplorerRequestContext },
    init?: { method: string; body?: unknown },
  ): Promise<T> => {
    const response = await request(url, input, init);
    return (await response.json()) as T;
  };

  const root = baseUrl.replace(/\/$/, "");

  return {
    async listFolderItems(input) {
      const url = options.buildListFolderUrl?.(input) ?? defaultListFolderUrl(baseUrl, input);
      return requestJson<ExplorerTransportResult>(url, input);
    },
    async search(input) {
      const url = options.buildSearchUrl?.(input) ?? defaultSearchUrl(baseUrl, input);
      return requestJson<ExplorerSearchResult>(url, input);
    },
    async createFolder(input) {
      const url = new URL(`${root}/folders`, resolveUrlBase()).toString();
      return requestJson<ExplorerItem>(url, input, {
        method: "POST",
        body: { parentFolderId: input.parentFolderId, name: input.name },
      });
    },
    async renameItem(input) {
      const url = new URL(`${root}/items/${encodeURIComponent(input.itemId)}`, resolveUrlBase()).toString();
      return requestJson<ExplorerItem>(url, input, {
        method: "PUT",
        body: { itemType: input.itemType, name: input.name },
      });
    },
    async deleteItem(input) {
      const url = new URL(`${root}/items/${encodeURIComponent(input.itemId)}`, resolveUrlBase());
      url.searchParams.set("itemType", input.itemType);
      await request(url.toString(), input, { method: "DELETE" });
    },
  };
};
