import type {
  ExplorerFetchLike,
  ExplorerSearchResult,
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
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerSearchInput {
  query: string;
  ancestorFolderId?: string;
  limit?: number;
  offset?: number;
  context?: ContentExplorerRequestContext;
}

export interface ContentExplorerDataSource {
  listFolderItems(input: ContentExplorerListFolderInput): Promise<ExplorerTransportResult>;
  search?(input: ContentExplorerSearchInput): Promise<ExplorerSearchResult>;
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

const defaultListFolderUrl = (baseUrl: string, input: ContentExplorerListFolderInput): string => {
  const root = baseUrl.replace(/\/$/, "");
  const url = new URL(`${root}/folders/${encodeURIComponent(input.folderId)}/items`, resolveUrlBase());
  if (typeof input.limit === "number") {
    url.searchParams.set("limit", String(input.limit));
  }
  if (typeof input.offset === "number") {
    url.searchParams.set("offset", String(input.offset));
  }
  return url.toString();
};

const defaultSearchUrl = (baseUrl: string, input: ContentExplorerSearchInput): string => {
  const root = baseUrl.replace(/\/$/, "");
  const url = new URL(`${root}/search`, resolveUrlBase());
  url.searchParams.set("query", input.query);
  if (input.ancestorFolderId) {
    url.searchParams.set("ancestorFolderId", input.ancestorFolderId);
  }
  if (typeof input.limit === "number") {
    url.searchParams.set("limit", String(input.limit));
  }
  if (typeof input.offset === "number") {
    url.searchParams.set("offset", String(input.offset));
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
        context: {
          locale: request.language,
          signal: request.signal,
        },
      });
  }

  return transport;
};

export const createHttpContentExplorerDataSource = (
  options: ContentExplorerHttpDataSourceOptions = {},
): ContentExplorerDataSource => {
  const fetchImpl = resolveFetch(options.fetch);
  const baseUrl = options.baseUrl ?? "/api/content-explorer";

  const requestJson = async <T>(url: string, input: { context?: ContentExplorerRequestContext }): Promise<T> => {
    const response = await fetchImpl(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(input.context?.locale ? { "accept-language": input.context.locale } : {}),
        ...(input.context?.requestId ? { "x-request-id": input.context.requestId } : {}),
        ...options.headers,
      },
      signal: input.context?.signal,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    return (await response.json()) as T;
  };

  return {
    async listFolderItems(input) {
      const url = options.buildListFolderUrl?.(input) ?? defaultListFolderUrl(baseUrl, input);
      return requestJson<ExplorerTransportResult>(url, input);
    },
    async search(input) {
      const url = options.buildSearchUrl?.(input) ?? defaultSearchUrl(baseUrl, input);
      return requestJson<ExplorerSearchResult>(url, input);
    },
  };
};
