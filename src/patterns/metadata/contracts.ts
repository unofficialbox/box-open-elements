export interface MetadataFetchLike {
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

export type MetadataFieldType =
  | "string"
  | "enum"
  | "float"
  | "integer"
  | "date"
  | "bool"
  | "multiSelect";

export interface MetadataFieldDefinition {
  key: string;
  label: string;
  type: MetadataFieldType;
  description?: string;
  required?: boolean;
  options?: string[];
}

export interface MetadataTemplateDefinition {
  key: string;
  label: string;
  scope: string;
  fields: MetadataFieldDefinition[];
}

export interface MetadataInstance {
  id?: string;
  scope: string;
  templateKey: string;
  values: Record<string, unknown>;
}

export interface MetadataRequestContext {
  locale?: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface MetadataQueryInput {
  templateKey: string;
  scope?: string;
  filters: Record<string, unknown>;
  limit?: number;
  offset?: number;
  context?: MetadataRequestContext;
}

export interface MetadataPage<TItem> {
  entries: TItem[];
  limit: number;
  offset: number;
  totalCount: number | null;
}

export interface MetadataDataSource<TItem = unknown> {
  listTemplates(context?: MetadataRequestContext): Promise<MetadataTemplateDefinition[]>;
  listInstances(
    input: {
      itemId: string;
      itemType: "file" | "folder";
      context?: MetadataRequestContext;
    },
  ): Promise<MetadataInstance[]>;
  updateInstance(
    input: {
      itemId: string;
      itemType: "file" | "folder";
      instance: MetadataInstance;
      context?: MetadataRequestContext;
    },
  ): Promise<MetadataInstance>;
  query(input: MetadataQueryInput): Promise<MetadataPage<TItem>>;
}

export interface MetadataHttpDataSourceOptions<TItem = unknown> {
  baseUrl?: string;
  fetch?: MetadataFetchLike;
  headers?: Record<string, string>;
  buildListTemplatesUrl?: () => string;
  buildListInstancesUrl?: (input: {
    itemId: string;
    itemType: "file" | "folder";
  }) => string;
  buildUpdateInstanceUrl?: (input: {
    itemId: string;
    itemType: "file" | "folder";
    instance: MetadataInstance;
  }) => string;
  buildQueryUrl?: () => string;
}

const resolveFetch = (providedFetch?: MetadataFetchLike): MetadataFetchLike => {
  if (providedFetch) {
    return providedFetch;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required to use the metadata HTTP data source.");
  }

  return globalThis.fetch.bind(globalThis) as MetadataFetchLike;
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

  return `Metadata request failed with status ${response.status}`;
};

export const createHttpMetadataDataSource = <TItem = unknown>(
  options: MetadataHttpDataSourceOptions<TItem> = {},
): MetadataDataSource<TItem> => {
  const fetchImpl = resolveFetch(options.fetch);
  const baseUrl = (options.baseUrl ?? "/api/metadata").replace(/\/$/, "");

  const withContextHeaders = (context?: MetadataRequestContext): Record<string, string> => ({
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
    async listTemplates(context) {
      const url = options.buildListTemplatesUrl?.() ?? `${baseUrl}/templates`;
      const response = await fetchImpl(url, {
        method: "GET",
        headers: withContextHeaders(context),
        signal: context?.signal,
      });

      return readJson<MetadataTemplateDefinition[]>(response);
    },
    async listInstances(input) {
      const url =
        options.buildListInstancesUrl?.(input) ??
        `${baseUrl}/items/${encodeURIComponent(input.itemType)}/${encodeURIComponent(input.itemId)}/instances`;
      const response = await fetchImpl(url, {
        method: "GET",
        headers: withContextHeaders(input.context),
        signal: input.context?.signal,
      });

      return readJson<MetadataInstance[]>(response);
    },
    async updateInstance(input) {
      const url =
        options.buildUpdateInstanceUrl?.(input) ??
        `${baseUrl}/items/${encodeURIComponent(input.itemType)}/${encodeURIComponent(input.itemId)}/instances/${encodeURIComponent(input.instance.templateKey)}`;
      const response = await fetchImpl(url, {
        method: "PUT",
        headers: {
          ...withContextHeaders(input.context),
          "content-type": "application/json",
        },
        body: JSON.stringify(input.instance),
        signal: input.context?.signal,
      });

      return readJson<MetadataInstance>(response);
    },
    async query(input) {
      const url = options.buildQueryUrl?.() ?? `${baseUrl}/query`;
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          ...withContextHeaders(input.context),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          templateKey: input.templateKey,
          scope: input.scope,
          filters: input.filters,
          limit: input.limit,
          offset: input.offset,
        }),
        signal: input.context?.signal,
      });

      return readJson<MetadataPage<TItem>>(response);
    },
  };
};
