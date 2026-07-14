import type { BoxTokenProvider } from "./ccg.js";

/**
 * Lightweight token providers for cases that don't use CCG:
 *
 * - `createStaticTokenProvider` — a fixed token (tests, short-lived scripts,
 *   or a token already minted upstream).
 * - `createRefreshingTokenProvider` — wraps any async token source (e.g. a
 *   user OAuth refresh flow owned by the host app) with the same caching and
 *   refresh-skew semantics as the CCG provider, without this package owning
 *   the OAuth dance itself.
 */

export const createStaticTokenProvider = (token: string): BoxTokenProvider => ({
  async getToken() {
    return token;
  },
});

export interface RefreshingTokenProviderConfig {
  /** Return a freshly minted token and its lifetime in seconds. */
  refresh: (signal?: AbortSignal) => Promise<{ accessToken: string; expiresIn: number }>;
  now?: () => number;
  refreshSkewMs?: number;
}

const DEFAULT_REFRESH_SKEW_MS = 60_000;

export const createRefreshingTokenProvider = (
  config: RefreshingTokenProviderConfig,
): BoxTokenProvider => {
  const now = config.now ?? (() => Date.now());
  const refreshSkewMs = config.refreshSkewMs ?? DEFAULT_REFRESH_SKEW_MS;

  let cachedToken: string | null = null;
  let expiresAt = 0;
  let inFlight: Promise<string> | null = null;

  const run = async (signal?: AbortSignal): Promise<string> => {
    const { accessToken, expiresIn } = await config.refresh(signal);
    cachedToken = accessToken;
    expiresAt = now() + expiresIn * 1000;
    return accessToken;
  };

  return {
    async getToken(options = {}) {
      const isFresh = cachedToken !== null && now() < expiresAt - refreshSkewMs;
      if (isFresh && !options.forceRefresh) {
        return cachedToken as string;
      }
      if (!inFlight) {
        inFlight = run(options.signal).finally(() => {
          inFlight = null;
        });
      }
      return inFlight;
    },
  };
};
