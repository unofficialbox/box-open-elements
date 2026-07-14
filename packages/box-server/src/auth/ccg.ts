import { type FetchLike, resolveFetch, toBoxApiError } from "../http.js";

/**
 * Server-side auth. Prefer Client Credentials Grant (CCG); JWT is only added
 * when a concrete deployment still requires it (see jwt.ts).
 */

/** Resolves a Box access token on demand; may cache and refresh internally. */
export interface BoxTokenProvider {
  getToken(options?: { forceRefresh?: boolean; signal?: AbortSignal }): Promise<string>;
}

export interface BoxCcgConfig {
  clientId: string;
  clientSecret: string;
  /** Authenticate as the whole enterprise (service account) or a single managed user. */
  subjectType: "enterprise" | "user";
  /** Enterprise ID or user ID matching `subjectType`. */
  subjectId: string;
  /** Token endpoint host. Defaults to Box's public API host. */
  tokenHost?: string;
  fetch?: FetchLike;
  /** Injectable clock (ms) so token expiry is testable without real time. */
  now?: () => number;
  /** Refresh this many ms before the real expiry to avoid edge-of-expiry failures. */
  refreshSkewMs?: number;
}

interface TokenGrantResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const DEFAULT_TOKEN_HOST = "https://api.box.com";
const DEFAULT_REFRESH_SKEW_MS = 60_000;

/**
 * Create a caching CCG token provider. The token is fetched lazily on first
 * use and reused until it is within `refreshSkewMs` of expiry (or a caller
 * passes `forceRefresh`). Concurrent callers during a refresh share one
 * in-flight request rather than stampeding the token endpoint.
 */
export const createCcgTokenProvider = (config: BoxCcgConfig): BoxTokenProvider => {
  const fetchImpl = resolveFetch(config.fetch);
  const now = config.now ?? (() => Date.now());
  const tokenHost = (config.tokenHost ?? DEFAULT_TOKEN_HOST).replace(/\/$/, "");
  const refreshSkewMs = config.refreshSkewMs ?? DEFAULT_REFRESH_SKEW_MS;

  let cachedToken: string | null = null;
  let expiresAt = 0;
  let inFlight: Promise<string> | null = null;

  const fetchToken = async (signal?: AbortSignal): Promise<string> => {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      box_subject_type: config.subjectType,
      box_subject_id: config.subjectId,
    });

    const response = await fetchImpl(`${tokenHost}/oauth2/token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: body.toString(),
      signal,
    });

    if (!response.ok) {
      throw await toBoxApiError(response);
    }

    const grant = (await response.json()) as TokenGrantResponse;
    cachedToken = grant.access_token;
    expiresAt = now() + grant.expires_in * 1000;
    return grant.access_token;
  };

  return {
    async getToken(options = {}) {
      const isFresh = cachedToken !== null && now() < expiresAt - refreshSkewMs;
      if (isFresh && !options.forceRefresh) {
        return cachedToken as string;
      }
      // Coalesce concurrent refreshes into a single token request.
      if (!inFlight) {
        inFlight = fetchToken(options.signal).finally(() => {
          inFlight = null;
        });
      }
      return inFlight;
    },
  };
};
