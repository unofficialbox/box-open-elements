import { describe, expect, it, vi } from "vitest";

import { createBoxExplorerTransport } from "../../../src/patterns/content-explorer/box-transport.js";

const okJson = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), { status });

describe("createBoxExplorerTransport sorting", () => {
  it("maps sort onto Box folder-items params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okJson({ entries: [], id: "0", name: "Root", path_collection: { entries: [] }, total_count: 0 }),
    );
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    await transport.loadFolderItems({ folderId: "0", token: "t", sortBy: "size", sortDirection: "DESC" });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("sort=size");
    expect(url).toContain("direction=DESC");
  });

  it("maps only date sorts onto Box search (name/size are unsupported there)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okJson({ entries: [], total_count: 0 })));
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    await transport.searchItems!({ query: "q", token: "t", sortBy: "date", sortDirection: "ASC" });
    expect(fetchMock.mock.calls[0]?.[0]).toContain("sort=modified_at");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("direction=ASC");

    await transport.searchItems!({ query: "q", token: "t", sortBy: "name", sortDirection: "ASC" });
    expect(fetchMock.mock.calls[1]?.[0]).not.toContain("sort=");
  });
});

describe("createBoxExplorerTransport mutations", () => {
  it("creates a folder via POST /folders and normalizes the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: "77", name: "Reports", type: "folder" }, 201));
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    const item = await transport.createFolder!({ parentFolderId: "0", name: "Reports", token: "t" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.box.test/2.0/folders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ name: "Reports", parent: { id: "0" } });
    expect(item).toEqual({ id: "77", name: "Reports", type: "folder" });
  });

  it("renames files and folders against their own endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson({ id: "1", name: "Doc 2", type: "file" }))
      .mockResolvedValueOnce(okJson({ id: "9", name: "Docs 2", type: "folder" }));
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    await transport.renameItem!({ itemId: "1", itemType: "file", name: "Doc 2", token: "t" });
    await transport.renameItem!({ itemId: "9", itemType: "folder", name: "Docs 2", token: "t" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.box.test/2.0/files/1");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "PUT" });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.box.test/2.0/folders/9");
  });

  it("deletes folders recursively and accepts 204 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    await transport.deleteItem!({ itemId: "9", itemType: "folder", token: "t" });
    await transport.deleteItem!({ itemId: "1", itemType: "file", token: "t" });

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/folders/9?recursive=true");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.box.test/2.0/files/1");
  });

  it("surfaces Box error messages from failed mutations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okJson({ code: "item_name_in_use", message: "Name in use" }, 409));
    const transport = createBoxExplorerTransport({ fetch: fetchMock });

    await expect(
      transport.createFolder!({ parentFolderId: "0", name: "Dup", token: "t" }),
    ).rejects.toThrow("item_name_in_use: Name in use");
  });
});

describe("createBoxExplorerTransport folder metadata", () => {
  it("fetches GET /folders/:id when the first page lacks metadata and degrades gracefully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson({ entries: [{ id: "1", name: "Doc", type: "file" }], total_count: 1 }))
      .mockResolvedValueOnce(
        okJson({
          id: "42",
          name: "Marketing",
          path_collection: { entries: [{ id: "0", name: "All Files", type: "folder" }] },
        }),
      );
    const transport = createBoxExplorerTransport({ apiBaseUrl: "https://api.box.test/2.0", fetch: fetchMock });

    const result = await transport.loadFolderItems({ folderId: "42", token: "t" });

    expect(fetchMock.mock.calls[1]?.[0]).toContain("/folders/42?");
    expect(result.folder).toEqual({ id: "42", name: "Marketing", type: "folder" });
    expect(result.breadcrumbs.map(crumb => crumb.name)).toEqual(["All Files", "Marketing"]);
  });

  it("keeps the listing usable when the folder-info request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson({ entries: [], total_count: 0 }))
      .mockRejectedValueOnce(new Error("network down"));
    const transport = createBoxExplorerTransport({ fetch: fetchMock });

    const result = await transport.loadFolderItems({ folderId: "42", token: "t" });

    expect(result.folder).toEqual({ id: "42", name: "42", type: "folder" });
  });

  it("does not fetch folder info for later pages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ entries: [], offset: 100, total_count: 200 }));
    const transport = createBoxExplorerTransport({ fetch: fetchMock });

    await transport.loadFolderItems({ folderId: "42", offset: 100, token: "t" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
