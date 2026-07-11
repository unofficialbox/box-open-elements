import { describe, expect, it, vi } from "vitest";

import { createHttpShareDataSource } from "../../../src/patterns/share/contracts.js";

describe("createHttpShareDataSource", () => {
  it("loads share state over HTTP", async () => {
    const result = {
      itemId: "123",
      itemType: "file" as const,
      sharedLink: {
        url: "https://box.com/s/example",
        access: "open" as const,
      },
      collaborators: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const dataSource = createHttpShareDataSource({
      baseUrl: "https://app.example.com/api/share",
      fetch: fetchMock,
    });

    const response = await dataSource.getShareState({
      itemId: "123",
      itemType: "file",
      context: {
        locale: "en-US",
        requestId: "req-1",
      },
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith("https://app.example.com/api/share/items/file/123", {
      method: "GET",
      headers: {
        accept: "application/json",
        "accept-language": "en-US",
        "x-request-id": "req-1",
      },
      signal: undefined,
    });
  });

  it("updates a shared link over HTTP", async () => {
    const result = {
      itemId: "123",
      itemType: "file" as const,
      sharedLink: {
        url: "https://box.com/s/example",
        access: "company" as const,
      },
      collaborators: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const dataSource = createHttpShareDataSource({
      fetch: fetchMock,
    });

    const response = await dataSource.updateSharedLink({
      itemId: "123",
      itemType: "file",
      sharedLink: result.sharedLink,
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith("/api/share/items/file/123/shared-link", {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sharedLink: result.sharedLink,
      }),
      signal: undefined,
    });
  });
});
