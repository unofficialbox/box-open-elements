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

    expect(url).toContain("https://api.box.test/2.0/folders/123/items?");
    expect(url).toContain("fields=");
    expect(url).toContain("limit=2");
    expect(url).toContain("offset=0");
    expect(decodeURIComponent(url)).toContain("modified_at");
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
        hasMoreItems: false,
        limit: 2,
        offset: 0,
        totalCount: 3,
        nextOffset: 3,
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

  it("maps optional summary fields and search results", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [
              {
                id: "1",
                name: "Report.pdf",
                type: "file",
                size: 2048,
                modified_at: "2026-07-01T12:00:00Z",
                extension: "pdf",
                owned_by: { id: "u1", name: "Morgan", type: "user" },
                shared_link: { url: "https://box.com/s/x", access: "company" },
                permissions: { can_preview: true, can_download: true },
                parent: { id: "0", name: "All Files", type: "folder" },
              },
            ],
            total_count: 1,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [{ id: "9", name: "Hit", type: "file" }],
            limit: 25,
            offset: 0,
            total_count: 1,
          }),
          { status: 200 },
        ),
      );

    const transport = createBoxExplorerTransport({
      apiBaseUrl: "https://api.box.test/2.0",
      fetch: fetchMock,
    });

    const folderResult = await transport.loadFolderItems({
      folderId: "0",
      token: "secret",
    });
    expect(folderResult.items[0]).toMatchObject({
      id: "1",
      size: 2048,
      modifiedAt: "2026-07-01T12:00:00Z",
      extension: "pdf",
      owner: { id: "u1", name: "Morgan", type: "user" },
      sharedLink: { isShared: true, access: "company", url: "https://box.com/s/x" },
      permissions: { canPreview: true, canDownload: true },
      parent: { id: "0", name: "All Files" },
      preview: { canPreview: true, extension: "pdf" },
    });

    const searchResult = await transport.searchItems!({
      query: "hit",
      ancestorFolderId: "0",
      limit: 25,
      offset: 0,
      token: "secret",
    });
    const [searchUrl] = fetchMock.mock.calls[1] as [string];
    expect(searchUrl).toContain("/search?");
    expect(searchUrl).toContain("query=hit");
    expect(searchUrl).toContain("ancestor_folder_ids=0");
    expect(searchResult).toMatchObject({
      query: "hit",
      ancestorFolderId: "0",
      items: [{ id: "9", name: "Hit", type: "file" }],
    });
  });

  it("advances nextOffset by raw entry count when filtering unsupported types", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [
              { id: "1", name: "Report", type: "file" },
              { id: "x", name: "Bookmark", type: "bookmark" },
            ],
            limit: 2,
            offset: 0,
            total_count: 4,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [
              { id: "2", name: "Designs", type: "folder" },
              { id: "3", name: "Notes", type: "file" },
            ],
            limit: 2,
            offset: 2,
            total_count: 4,
          }),
          { status: 200 },
        ),
      );

    const transport = createBoxExplorerTransport({
      apiBaseUrl: "https://api.box.test/2.0",
      fetch: fetchMock,
    });

    const first = await transport.loadFolderItems({
      folderId: "123",
      limit: 2,
      offset: 0,
      token: "secret",
    });
    expect(first.items.map(item => item.id)).toEqual(["1"]);
    expect(first.pagination.nextOffset).toBe(2);

    const second = await transport.loadFolderItems({
      folderId: "123",
      limit: 2,
      offset: first.pagination.nextOffset,
      token: "secret",
    });
    expect(second.items.map(item => item.id)).toEqual(["2", "3"]);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("offset=2");
  });
});
