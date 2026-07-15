import { describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../src/patterns/content-explorer/controller.js";
import type { ExplorerTransport, ExplorerTransportResult } from "../../../src/patterns/content-explorer/types.js";

const createResult = (overrides: Partial<ExplorerTransportResult> = {}): ExplorerTransportResult => ({
  breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
  folder: {
    id: "0",
    name: "All Files",
    type: "folder",
  },
  folderId: "0",
  items: [],
  pagination: {
    hasMoreItems: false,
    limit: 100,
    offset: 0,
    totalCount: 0,
  },
  ...overrides,
});

describe("ContentExplorerController", () => {
  it("loads items during connect and updates state", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Quarterly Plan", type: "file" }],
          pagination: {
            hasMoreItems: false,
            limit: 100,
            offset: 0,
            totalCount: 1,
          },
        }),
      ),
    };

    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();

    expect(transport.loadFolderItems).toHaveBeenCalledWith({
      folderId: "0",
      language: undefined,
      limit: 100,
      offset: 0,
      token: "token",
    });
    expect(controller.getState()).toMatchObject({
      breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
      connected: true,
      currentFolder: { id: "0", name: "All Files", type: "folder" },
      currentFolderId: "0",
      error: null,
      items: [{ id: "1", name: "Quarterly Plan", type: "file" }],
      loading: false,
      selectedItemIds: [],
    });
  });

  it("appends items when loading the next page", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Doc 1", type: "file" }],
            pagination: {
              hasMoreItems: true,
              limit: 1,
              offset: 0,
              totalCount: 2,
            },
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "2", name: "Doc 2", type: "file" }],
            pagination: {
              hasMoreItems: false,
              limit: 1,
              offset: 1,
              totalCount: 2,
            },
          }),
        ),
    };

    const controller = new ContentExplorerController({
      pageSize: 1,
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();
    await controller.loadNextPage();

    expect(transport.loadFolderItems).toHaveBeenNthCalledWith(1, {
      folderId: "0",
      language: undefined,
      limit: 1,
      offset: 0,
      token: "token",
    });
    expect(transport.loadFolderItems).toHaveBeenNthCalledWith(2, {
      folderId: "0",
      language: undefined,
      limit: 1,
      offset: 1,
      token: "token",
    });
    expect(controller.getState().items).toEqual([
      { id: "1", name: "Doc 1", type: "file" },
      { id: "2", name: "Doc 2", type: "file" },
    ]);
    expect(controller.getState().pagination).toEqual({
      hasMoreItems: false,
      limit: 1,
      offset: 1,
      totalCount: 2,
    });
  });

  it("preserves existing items when a next-page load fails", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Doc 1", type: "file" }],
            pagination: {
              hasMoreItems: true,
              limit: 1,
              offset: 0,
              totalCount: 2,
            },
          }),
        )
        .mockRejectedValueOnce(new Error("Network down")),
    };

    const controller = new ContentExplorerController({
      pageSize: 1,
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();
    await controller.loadNextPage();

    expect(controller.getState().items).toEqual([{ id: "1", name: "Doc 1", type: "file" }]);
    expect(controller.getState().error).toEqual({
      code: "load_failed",
      message: "Network down",
    });
  });

  it("emits pagination updates during successful loads", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Doc 1", type: "file" }],
          pagination: {
            hasMoreItems: true,
            limit: 1,
            offset: 0,
            totalCount: 2,
          },
        }),
      ),
    };

    const controller = new ContentExplorerController({
      pageSize: 1,
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const paginationEvents: Array<ExplorerTransportResult["pagination"]> = [];

    controller.subscribe("paginationChanged", ({ pagination }) => {
      paginationEvents.push(pagination);
    });

    await controller.connect();

    expect(paginationEvents).toEqual([
      {
        hasMoreItems: true,
        limit: 1,
        offset: 0,
        totalCount: 2,
      },
    ]);
  });

  it("refreshes the current folder without changing navigation state", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            folder: { id: "0", name: "All Files", type: "folder" },
            items: [{ id: "1", name: "Before Refresh", type: "file" }],
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            folder: { id: "0", name: "All Files", type: "folder" },
            items: [{ id: "2", name: "After Refresh", type: "file" }],
          }),
        ),
    };

    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();
    await controller.refresh();

    expect(transport.loadFolderItems).toHaveBeenNthCalledWith(2, {
      folderId: "0",
      language: undefined,
      limit: 100,
      offset: 0,
      token: "token",
    });
    expect(controller.getState().currentFolder).toEqual({ id: "0", name: "All Files", type: "folder" });
    expect(controller.getState().items).toEqual([{ id: "2", name: "After Refresh", type: "file" }]);
  });

  it("activates folder items by emitting and navigating", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "marketing", name: "Marketing", type: "folder" }],
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            breadcrumbs: [
              { id: "0", name: "All Files", type: "folder" },
              { id: "marketing", name: "Marketing", type: "folder" },
            ],
            folder: { id: "marketing", name: "Marketing", type: "folder" },
            folderId: "marketing",
            items: [{ id: "leaf", name: "Leaf", type: "file" }],
          }),
        ),
    };

    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const activated = vi.fn();

    controller.subscribe("itemActivated", ({ item }) => {
      activated(item.id);
    });

    await controller.connect();
    await controller.activateItem("marketing");

    expect(activated).toHaveBeenCalledWith("marketing");
    expect(controller.getState().currentFolderId).toBe("marketing");
    expect(controller.getState().breadcrumbs).toEqual([
      { id: "0", name: "All Files", type: "folder" },
      { id: "marketing", name: "Marketing", type: "folder" },
    ]);
  });

  it("enforces single selection mode", () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn(),
    };

    const controller = new ContentExplorerController({
      rootFolderId: "0",
      selectionMode: "single",
      token: "token",
      transport,
    });

    controller.setItems([
      { id: "1", name: "One", type: "file" },
      { id: "2", name: "Two", type: "file" },
    ]);
    controller.select(["1", "2"]);

    expect(controller.getState().selectedItemIds).toEqual(["1"]);

    controller.toggleSelection("2");
    expect(controller.getState().selectedItemIds).toEqual(["2"]);
  });

  it("invokes configured item actions for matching item types", () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn(),
    };
    const controller = new ContentExplorerController({
      itemActions: [
        { id: "preview", label: "Preview", itemTypes: ["file"] },
        { id: "open", label: "Open", itemTypes: ["folder"] },
      ],
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const actionInvoked = vi.fn();

    controller.subscribe("itemActionInvoked", payload => {
      actionInvoked(payload);
    });

    controller.setItems([
      { id: "1", name: "One", type: "file" },
      { id: "2", name: "Two", type: "folder" },
    ]);

    expect(controller.getItemActions("1")).toEqual([{ id: "preview", label: "Preview", itemTypes: ["file"] }]);
    expect(controller.getItemActions("2")).toEqual([{ id: "open", label: "Open", itemTypes: ["folder"] }]);

    controller.invokeItemAction("1", "preview");

    expect(actionInvoked).toHaveBeenCalledWith({
      action: { id: "preview", label: "Preview", itemTypes: ["file"] },
      item: { id: "1", name: "One", type: "file" },
    });
  });

  it("searches through transport.searchItems and restores folder mode on clear", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Folder File", type: "file" }],
        }),
      ),
      searchItems: vi.fn().mockResolvedValue({
        query: "plan",
        ancestorFolderId: "0",
        items: [{ id: "9", name: "Quarterly Plan", type: "file" }],
        pagination: {
          hasMoreItems: false,
          limit: 100,
          offset: 0,
          totalCount: 1,
        },
      }),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const viewChanged = vi.fn();
    const searchSucceeded = vi.fn();
    controller.subscribe("viewChanged", viewChanged);
    controller.subscribe("searchSucceeded", searchSucceeded);

    await controller.connect();
    await controller.search(" plan ");

    expect(transport.searchItems).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "plan",
        ancestorFolderId: "0",
        offset: 0,
      }),
    );
    expect(controller.getState().view).toEqual({
      mode: "search",
      searchQuery: "plan",
      searchAncestorFolderId: "0",
    });
    expect(controller.getState().items).toEqual([{ id: "9", name: "Quarterly Plan", type: "file" }]);
    expect(searchSucceeded).toHaveBeenCalled();
    expect(viewChanged).toHaveBeenCalled();

    await controller.clearSearch();

    expect(controller.getState().view.mode).toBe("folder");
    expect(controller.getState().items).toEqual([{ id: "1", name: "Folder File", type: "file" }]);
    expect(transport.loadFolderItems).toHaveBeenCalledTimes(2);
  });

  it("exits search when navigating to a folder discovered via search", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Spec", type: "file" }],
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            breadcrumbs: [
              { id: "0", name: "All Files", type: "folder" },
              { id: "marketing", name: "Marketing", type: "folder" },
            ],
            folder: { id: "marketing", name: "Marketing", type: "folder" },
            folderId: "marketing",
            items: [{ id: "leaf", name: "Leaf", type: "file" }],
          }),
        ),
      searchItems: vi.fn().mockResolvedValue({
        query: "marketing",
        items: [{ id: "marketing", name: "Marketing", type: "folder" }],
        pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: 1 },
      }),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();
    await controller.search("marketing");
    expect(controller.getState().view.mode).toBe("search");
    await controller.navigateTo("marketing");

    expect(controller.getState().view.mode).toBe("folder");
    expect(controller.getState().currentFolderId).toBe("marketing");
    expect(controller.getState().items).toEqual([{ id: "leaf", name: "Leaf", type: "file" }]);
  });

  it("keeps search mode when navigateTo is a no-op", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(createResult({ items: [] })),
      searchItems: vi.fn().mockResolvedValue({
        query: "q",
        items: [{ id: "hit", name: "Hit", type: "file" }],
        pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: 1 },
      }),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });

    await controller.connect();
    await controller.search("q");
    // Same folder id as current → navigation controller returns null.
    await controller.navigateTo("0");

    expect(controller.getState().view.mode).toBe("search");
    expect(controller.getState().items).toEqual([{ id: "hit", name: "Hit", type: "file" }]);
  });
});
