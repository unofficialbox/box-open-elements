import type { ExplorerFetchLike, ExplorerTransport, ExplorerTransportResult } from "./types.js";

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
  search?(input: ContentExplorerSearchInput): Promise<ExplorerTransportResult>;
}

export interface ContentExplorerHttpDataSourceOptions {
  baseUrl?: string;
  fetch?: ExplorerFetchLike;
  headers?: Record<string, string>;
  buildListFolderUrl?: (input: ContentExplorerListFolderInput) => string;
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
): ExplorerTransport => ({
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
});

export const createHttpContentExplorerDataSource = (
  options: ContentExplorerHttpDataSourceOptions = {},
): ContentExplorerDataSource => {
  const fetchImpl = resolveFetch(options.fetch);
  const baseUrl = options.baseUrl ?? "/api/content-explorer";

  return {
    async listFolderItems(input) {
      const url = options.buildListFolderUrl?.(input) ?? defaultListFolderUrl(baseUrl, input);
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

      return (await response.json()) as ExplorerTransportResult;
    },
  };
};
