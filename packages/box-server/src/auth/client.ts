import { type FetchLike, resolveFetch, toBoxApiError } from "../http.js";
import type { BoxTokenProvider } from "./ccg.js";

/**
 * A thin Box REST client: it injects the bearer token from a
 * {@link BoxTokenProvider}, supports enterprise `As-User` impersonation, maps
 * non-2xx responses to {@link BoxApiError}, and transparently retries once on a
 * 401 by forcing a token refresh. It knows nothing about specific endpoints —
 * data sources compose it.
 */
export interface BoxRestClientConfig {
  tokenProvider: BoxTokenProvider;
  /** Box API host. Defaults to the public API host. */
  apiHost?: string;
  fetch?: FetchLike;
}

export interface BoxRequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** Override the request content type (e.g. `application/json-patch+json`). */
  contentType?: string;
  /** Box user ID to impersonate for this request (enterprise `As-User`). */
  asUser?: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface BoxRestClient {
  request<T>(method: string, path: string, options?: BoxRequestOptions): Promise<T>;
}

const DEFAULT_API_HOST = "https://api.box.com";

const buildUrl = (
  apiHost: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string => {
  const url = new URL(`${apiHost}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
};

export const createBoxRestClient = (config: BoxRestClientConfig): BoxRestClient => {
  const fetchImpl = resolveFetch(config.fetch);
  const apiHost = (config.apiHost ?? DEFAULT_API_HOST).replace(/\/$/, "");

  const send = async (
    method: string,
    url: string,
    options: BoxRequestOptions,
    token: string,
  ): Promise<Response> => {
    const headers: Record<string, string> = {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    };
    if (options.asUser) {
      headers["as-user"] = options.asUser;
    }
    if (options.requestId) {
      headers["x-request-id"] = options.requestId;
    }
    const hasBody = options.body !== undefined;
    if (hasBody) {
      headers["content-type"] = options.contentType ?? "application/json";
    }
    return fetchImpl(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  };

  return {
    async request<T>(method: string, path: string, options: BoxRequestOptions = {}): Promise<T> {
      const url = buildUrl(apiHost, path, options.query);
      const token = await config.tokenProvider.getToken({ signal: options.signal });
      let response = await send(method, url, options, token);

      // A single forced-refresh retry covers a token that expired mid-flight.
      if (response.status === 401) {
        const refreshed = await config.tokenProvider.getToken({
          forceRefresh: true,
          signal: options.signal,
        });
        response = await send(method, url, options, refreshed);
      }

      if (!response.ok) {
        throw await toBoxApiError(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    },
  };
};
