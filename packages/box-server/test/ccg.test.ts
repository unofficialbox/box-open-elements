// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createCcgTokenProvider } from "../src/auth/ccg.js";
import { BoxApiError, type FetchLike } from "../src/http.js";

/** vi.fn typed with the fetch signature so mock.calls carry (url, init). */
const makeFetch = (impl: FetchLike) => vi.fn(impl);

const tokenResponse = (accessToken: string, expiresIn = 3600): Response =>
  new Response(JSON.stringify({ access_token: accessToken, expires_in: expiresIn, token_type: "bearer" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const baseConfig = {
  clientId: "id",
  clientSecret: "secret",
  subjectType: "enterprise" as const,
  subjectId: "12345",
};

describe("createCcgTokenProvider", () => {
  it("fetches once and caches while fresh", async () => {
    const fetchImpl = makeFetch(async () => tokenResponse("t1"));
    let clock = 0;
    const provider = createCcgTokenProvider({ ...baseConfig, fetch: fetchImpl, now: () => clock });

    expect(await provider.getToken()).toBe("t1");
    expect(await provider.getToken()).toBe("t1");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [, init] = fetchImpl.mock.calls[0];
    expect(String(init?.body)).toContain("grant_type=client_credentials");
    expect(String(init?.body)).toContain("box_subject_type=enterprise");
  });

  it("refreshes after expiry (minus skew)", async () => {
    const fetchImpl = makeFetch(async () => tokenResponse("t1", 3600));
    let clock = 0;
    const provider = createCcgTokenProvider({
      ...baseConfig,
      fetch: fetchImpl,
      now: () => clock,
      refreshSkewMs: 60_000,
    });

    await provider.getToken();
    clock = 3600_000 - 59_000; // within the 60s skew window → stale
    fetchImpl.mockResolvedValueOnce(tokenResponse("t2"));
    expect(await provider.getToken()).toBe("t2");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("forceRefresh bypasses the cache", async () => {
    const fetchImpl = makeFetch(async () => tokenResponse("t1"));
    fetchImpl.mockResolvedValueOnce(tokenResponse("t1")).mockResolvedValueOnce(tokenResponse("t2"));
    const provider = createCcgTokenProvider({ ...baseConfig, fetch: fetchImpl, now: () => 0 });

    await provider.getToken();
    expect(await provider.getToken({ forceRefresh: true })).toBe("t2");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent refreshes into one request", async () => {
    const fetchImpl = makeFetch(async () => tokenResponse("t1"));
    const provider = createCcgTokenProvider({ ...baseConfig, fetch: fetchImpl, now: () => 0 });

    const [a, b] = await Promise.all([provider.getToken(), provider.getToken()]);
    expect(a).toBe("t1");
    expect(b).toBe("t1");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws a BoxApiError when the token endpoint rejects", async () => {
    const fetchImpl = makeFetch(async () =>
      new Response(JSON.stringify({ error: "invalid_client", message: "bad creds" }), { status: 401 }),
    );
    const provider = createCcgTokenProvider({ ...baseConfig, fetch: fetchImpl, now: () => 0 });

    await expect(provider.getToken()).rejects.toBeInstanceOf(BoxApiError);
  });
});
