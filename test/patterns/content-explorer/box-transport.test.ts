import { describe, expect, it, vi } from "vitest";

import { createBoxExplorerTransport } from "../../../src/patterns/content-explorer/box-transport.js";

describe("createBoxExplorerTransport", () => {
  it("maps Box folder items into explorer items with pagination", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          entries: [
            { id: "1", name: "Report", type: "file" },
            { id: "2", name: "Designs", type: "folder" },
            { id: "3", name: "Ignored", type: "bookmark" },
          ],
          limit: 2,
          offset: 0,
          total_count: 3,
        }),
        { status: 200 },
      ),
    );

    const transport = createBoxExplorerTransport({
      apiBaseUrl: "https://api.box.test/2.0",
      fetch: fetchMock,
    });

    const result = await transport.loadFolderItems({
      folderId: "123",
      language: "fr-FR",
      limit: 2,
      offset: 0,
      token: "secret",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://api.box.test/2.0/folders/123/items?fields=id%2Cname%2Ctype&limit=2&offset=0");
    expect(init).toMatchObject({
      headers: {
        Authorization: "Bearer secret",
        "Accept-Language": "fr-FR",
      },
      method: "GET",
    });
    expect(result).toEqual({
      breadcrumbs: [{ id: "123", name: "123", type: "folder" }],
      folder: {
        id: "123",
        name: "123",
        type: "folder",
      },
      folderId: "123",
      items: [
        { id: "1", name: "Report", type: "file" },
        { id: "2", name: "Designs", type: "folder" },
      ],
      pagination: {
        hasMoreItems: true,
        limit: 2,
        offset: 0,
        totalCount: 3,
      },
    });
  });

  it("surfaces Box API error messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "not_found", message: "Folder not found" }), { status: 404 }),
    );

    const transport = createBoxExplorerTransport({ fetch: fetchMock });

    await expect(
      transport.loadFolderItems({
        folderId: "404",
        token: "secret",
      }),
    ).rejects.toThrow("not_found: Folder not found");
  });

  it("falls back to status-based error messages when JSON parsing fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 }));
    const transport = createBoxExplorerTransport({ fetch: fetchMock });

    await expect(
      transport.loadFolderItems({
        folderId: "500",
        token: "secret",
      }),
    ).rejects.toThrow("Box API request failed with status 502");
  });

  it("uses folder metadata from the Box response when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          entries: [],
          id: "999",
          name: "Projects",
          type: "folder",
          total_count: 0,
        }),
        { status: 200 },
      ),
    );

    const transport = createBoxExplorerTransport({ fetch: fetchMock });
    const result = await transport.loadFolderItems({
      folderId: "999",
      token: "secret",
    });

    expect(result.folder).toEqual({
      id: "999",
      name: "Projects",
      type: "folder",
    });
    expect(result.breadcrumbs).toEqual([{ id: "999", name: "Projects", type: "folder" }]);
  });

  it("maps path collection entries into breadcrumbs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          entries: [],
          id: "marketing",
          name: "Marketing",
          path_collection: {
            entries: [{ id: "0", name: "All Files", type: "folder" }],
          },
          total_count: 0,
        }),
        { status: 200 },
      ),
    );

    const transport = createBoxExplorerTransport({ fetch: fetchMock });
    const result = await transport.loadFolderItems({
      folderId: "marketing",
      token: "secret",
    });

    expect(result.breadcrumbs).toEqual([
      { id: "0", name: "All Files", type: "folder" },
      { id: "marketing", name: "Marketing", type: "folder" },
    ]);
  });
});
