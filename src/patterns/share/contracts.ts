export interface ShareFetchLike {
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

export interface ShareRequestContext {
  locale?: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface SharedLinkState {
  url?: string;
  access?: "open" | "company" | "collaborators";
  passwordEnabled?: boolean;
  canDownload?: boolean;
  canPreview?: boolean;
  expiresAt?: string | null;
}

export interface CollaboratorSummary {
  id: string;
  name: string;
  type: "user" | "group" | "invite";
  role: string;
  status?: string;
}

export interface ShareState {
  itemId: string;
  itemType: "file" | "folder";
  sharedLink: SharedLinkState | null;
  collaborators: CollaboratorSummary[];
}

export interface ShareDataSource {
  getShareState(
    input: {
      itemId: string;
      itemType: "file" | "folder";
      context?: ShareRequestContext;
    },
  ): Promise<ShareState>;
  updateSharedLink(
    input: {
      itemId: string;
      itemType: "file" | "folder";
      sharedLink: SharedLinkState | null;
      context?: ShareRequestContext;
    },
  ): Promise<ShareState>;
  listCollaborators(
    input: {
      itemId: string;
      itemType: "file" | "folder";
      context?: ShareRequestContext;
    },
  ): Promise<CollaboratorSummary[]>;
}

export interface ShareHttpDataSourceOptions {
  baseUrl?: string;
  fetch?: ShareFetchLike;
  headers?: Record<string, string>;
  buildGetShareStateUrl?: (input: {
    itemId: string;
    itemType: "file" | "folder";
  }) => string;
  buildUpdateSharedLinkUrl?: (input: {
    itemId: string;
    itemType: "file" | "folder";
  }) => string;
  buildListCollaboratorsUrl?: (input: {
    itemId: string;
    itemType: "file" | "folder";
  }) => string;
}

const resolveFetch = (providedFetch?: ShareFetchLike): ShareFetchLike => {
  if (providedFetch) {
    return providedFetch;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required to use the share HTTP data source.");
  }

  return globalThis.fetch.bind(globalThis) as ShareFetchLike;
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

  return `Share request failed with status ${response.status}`;
};

export const createHttpShareDataSource = (
  options: ShareHttpDataSourceOptions = {},
): ShareDataSource => {
  const fetchImpl = resolveFetch(options.fetch);
  const baseUrl = (options.baseUrl ?? "/api/share").replace(/\/$/, "");

  const withContextHeaders = (context?: ShareRequestContext): Record<string, string> => ({
    accept: "application/json",
    ...(context?.locale ? { "accept-language": context.locale } : {}),
    ...(context?.requestId ? { "x-request-id": context.requestId } : {}),
    ...options.headers,
  });

  const readJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
    return (await response.json()) as T;
  };

  return {
    async getShareState(input) {
      const url =
        options.buildGetShareStateUrl?.(input) ??
        `${baseUrl}/items/${encodeURIComponent(input.itemType)}/${encodeURIComponent(input.itemId)}`;
      const response = await fetchImpl(url, {
        method: "GET",
        headers: withContextHeaders(input.context),
        signal: input.context?.signal,
      });

      return readJson<ShareState>(response);
    },
    async updateSharedLink(input) {
      const url =
        options.buildUpdateSharedLinkUrl?.(input) ??
        `${baseUrl}/items/${encodeURIComponent(input.itemType)}/${encodeURIComponent(input.itemId)}/shared-link`;
      const response = await fetchImpl(url, {
        method: "PUT",
        headers: {
          ...withContextHeaders(input.context),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sharedLink: input.sharedLink,
        }),
        signal: input.context?.signal,
      });

      return readJson<ShareState>(response);
    },
    async listCollaborators(input) {
      const url =
        options.buildListCollaboratorsUrl?.(input) ??
        `${baseUrl}/items/${encodeURIComponent(input.itemType)}/${encodeURIComponent(input.itemId)}/collaborators`;
      const response = await fetchImpl(url, {
        method: "GET",
        headers: withContextHeaders(input.context),
        signal: input.context?.signal,
      });

      return readJson<CollaboratorSummary[]>(response);
    },
  };
};
