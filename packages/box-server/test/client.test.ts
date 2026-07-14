// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createBoxRestClient } from "../src/auth/client.js";
import { createStaticTokenProvider } from "../src/auth/oauth.js";
import { BoxApiError, type FetchLike } from "../src/http.js";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

/** vi.fn typed with the fetch signature so mock.calls carry (url, init). */
const makeFetch = (impl: FetchLike) => vi.fn(impl);

describe("createBoxRestClient", () => {
  it("injects the bearer token, As-User, and query params", async () => {
    const fetchImpl = makeFetch(async () => json({ id: "1" }));
    const client = createBoxRestClient({
      tokenProvider: createStaticTokenProvider("tok"),
      fetch: fetchImpl,
    });

    await client.request("GET", "/2.0/folders/0", { query: { fields: "name", limit: 25 }, asUser: "u1" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://api.box.com/2.0/folders/0?fields=name&limit=25");
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer tok");
    expect(headers["as-user"]).toBe("u1");
  });

  it("serializes a JSON body and sets content-type", async () => {
    const fetchImpl = makeFetch(async () => json({ ok: true }));
    const client = createBoxRestClient({
      tokenProvider: createStaticTokenProvider("tok"),
      fetch: fetchImpl,
    });

    await client.request("PUT", "/2.0/files/1", { body: { shared_link: null } });

    const [, init] = fetchImpl.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ shared_link: null }));
    expect((init?.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });

  it("honours a content-type override", async () => {
    const fetchImpl = makeFetch(async () => json({}));
    const client = createBoxRestClient({
      tokenProvider: createStaticTokenProvider("tok"),
      fetch: fetchImpl,
    });

    await client.request("PUT", "/2.0/files/1/metadata/enterprise/p", {
      body: [{ op: "add", path: "/x", value: 1 }],
      contentType: "application/json-patch+json",
    });

    expect((fetchImpl.mock.calls[0][1]?.headers as Record<string, string>)["content-type"]).toBe(
      "application/json-patch+json",
    );
  });

  it("retries once with a forced refresh on 401", async () => {
    const fetchImpl = makeFetch(async () => json({ id: "1" }));
    fetchImpl.mockResolvedValueOnce(json({ message: "expired" }, 401)).mockResolvedValueOnce(json({ id: "1" }));
    const getToken = vi
      .fn<(options?: { forceRefresh?: boolean }) => Promise<string>>()
      .mockResolvedValueOnce("stale")
      .mockResolvedValueOnce("fresh");

    const client = createBoxRestClient({ tokenProvider: { getToken }, fetch: fetchImpl });
    const result = await client.request<{ id: string }>("GET", "/2.0/files/1");

    expect(result).toEqual({ id: "1" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(getToken).toHaveBeenNthCalledWith(2, expect.objectContaining({ forceRefresh: true }));
    expect((fetchImpl.mock.calls[1][1]?.headers as Record<string, string>).authorization).toBe("Bearer fresh");
  });

  it("maps a non-ok response to BoxApiError with status", async () => {
    const fetchImpl = makeFetch(async () => json({ code: "not_found", message: "gone" }, 404));
    const client = createBoxRestClient({
      tokenProvider: createStaticTokenProvider("tok"),
      fetch: fetchImpl,
    });

    await expect(client.request("GET", "/2.0/files/999")).rejects.toMatchObject({
      name: "BoxApiError",
      status: 404,
      code: "not_found",
    });
  });

  it("returns undefined for 204 responses", async () => {
    const fetchImpl = makeFetch(async () => new Response(null, { status: 204 }));
    const client = createBoxRestClient({
      tokenProvider: createStaticTokenProvider("tok"),
      fetch: fetchImpl,
    });

    await expect(client.request("DELETE", "/2.0/files/1")).resolves.toBeUndefined();
  });

  it("propagates BoxApiError from the token provider", async () => {
    const client = createBoxRestClient({
      tokenProvider: {
        getToken: async () => {
          throw new BoxApiError("no token", { status: 401 });
        },
      },
      fetch: vi.fn(),
    });
    await expect(client.request("GET", "/2.0/files/1")).rejects.toBeInstanceOf(BoxApiError);
  });
});
