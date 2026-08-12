import { describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../src/patterns/content-explorer/controller.js";
import type {
  ExplorerItem,
  ExplorerTransport,
  ExplorerTransportResult,
} from "../../../src/patterns/content-explorer/types.js";

const folderResult = (overrides: Partial<ExplorerTransportResult> = {}): ExplorerTransportResult => ({
  breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
  folder: { id: "0", name: "All Files", type: "folder" },
  folderId: "0",
  items: [
    {
      id: "1",
      name: "Doc 1",
      type: "file",
      permissions: { canRename: true, canDelete: false },
    },
    { id: "sub", name: "Subfolder", type: "folder" },
  ],
  pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: 2 },
  ...overrides,
});

const createTransport = (overrides: Partial<ExplorerTransport> = {}): ExplorerTransport => ({
  loadFolderItems: vi.fn().mockResolvedValue(folderResult()),
  ...overrides,
});

const createController = (
  transport: ExplorerTransport,
  configOverrides: Partial<ConstructorParameters<typeof ContentExplorerController>[0]> = {},
): ContentExplorerController =>
  new ContentExplorerController({
    rootFolderId: "0",
    token: "token",
    transport,
    ...configOverrides,
  });

describe("ContentExplorerController sorting", () => {
  it("passes the sort with every request and reloads when it changes", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();

    await controller.setSort("name", "DESC");

    expect(transport.loadFolderItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: "name", sortDirection: "DESC", offset: 0 }),
    );
    expect(controller.getState().sort).toEqual({ sortBy: "name", direction: "DESC" });
  });

  it("emits sortChanged and treats a repeated sort as a no-op", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();

    const sortChanged = vi.fn();
    controller.subscribe("sortChanged", sortChanged);

    await controller.setSort({ sortBy: "size", direction: "ASC" });
    await controller.setSort({ sortBy: "size", direction: "ASC" });

    expect(sortChanged).toHaveBeenCalledTimes(1);
    expect(transport.loadFolderItems).toHaveBeenCalledTimes(2); // connect + one reload
  });

  it("clears the sort with null and reloads without sort params", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();
    await controller.setSort("date", "DESC");

    await controller.setSort(null);

    expect(controller.getState().sort).toBeNull();
    const lastCall = vi.mocked(transport.loadFolderItems).mock.calls.at(-1)?.[0];
    expect(lastCall).not.toHaveProperty("sortBy");
  });
});

describe("ContentExplorerController mutations", () => {
  it("creates a folder in the current folder and refreshes", async () => {
    const created: ExplorerItem = { id: "new", name: "Reports", type: "folder" };
    const createFolder = vi.fn().mockResolvedValue(created);
    const transport = createTransport({ createFolder });
    const controller = createController(transport);
    await controller.connect();

    const mutated = vi.fn();
    controller.subscribe("itemMutated", mutated);

    const result = await controller.createFolder("  Reports ");

    expect(result).toEqual(created);
    expect(createFolder).toHaveBeenCalledWith(
      expect.objectContaining({ parentFolderId: "0", name: "Reports", token: "token" }),
    );
    expect(mutated).toHaveBeenCalledWith({ kind: "create-folder", item: created, itemId: "new" });
    // connect + post-mutation refresh
    expect(transport.loadFolderItems).toHaveBeenCalledTimes(2);
  });

  it("renames an item using its type and surfaces failures as mutationFailed", async () => {
    const renameItem = vi.fn().mockRejectedValue(new Error("name_in_use: already exists"));
    const transport = createTransport({ renameItem });
    const controller = createController(transport);
    await controller.connect();

    const failed = vi.fn();
    controller.subscribe("mutationFailed", failed);

    const result = await controller.renameItem("1", "Doc 2");

    expect(result).toBeNull();
    expect(renameItem).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "1", itemType: "file", name: "Doc 2" }),
    );
    expect(failed).toHaveBeenCalledWith({
      kind: "rename",
      message: "name_in_use: already exists",
      itemId: "1",
    });
    expect(controller.getState().error).toEqual({
      code: "mutation_failed",
      message: "name_in_use: already exists",
    });
  });

  it("deletes an item and refreshes", async () => {
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    const transport = createTransport({ deleteItem });
    const controller = createController(transport);
    await controller.connect();

    const deleted = await controller.deleteItem("sub");

    expect(deleted).toBe(true);
    expect(deleteItem).toHaveBeenCalledWith(expect.objectContaining({ itemId: "sub", itemType: "folder" }));
    expect(transport.loadFolderItems).toHaveBeenCalledTimes(2);
  });

  it("throws for unsupported mutations and no-ops for unknown items", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();

    await expect(controller.createFolder("X")).rejects.toThrow("does not support folder creation");

    const deleteItem = vi.fn();
    const withDelete = createController(createTransport({ deleteItem }));
    await withDelete.connect();
    expect(await withDelete.deleteItem("missing")).toBe(false);
    expect(deleteItem).not.toHaveBeenCalled();
  });
});

describe("ContentExplorerController permission gating", () => {
  it("marks actions disabled when an item explicitly denies the permission", async () => {
    const transport = createTransport();
    const controller = createController(transport, {
      itemActions: [
        { id: "rename", label: "Rename", requiresPermission: "canRename" },
        { id: "delete", label: "Delete", requiresPermission: "canDelete" },
        { id: "open", label: "Open" },
      ],
    });
    await controller.connect();

    // Item 1 allows rename, denies delete; the folder has no permission data.
    expect(controller.getItemActions("1")).toEqual([
      { id: "rename", label: "Rename", requiresPermission: "canRename" },
      { id: "delete", label: "Delete", requiresPermission: "canDelete", disabled: true },
      { id: "open", label: "Open" },
    ]);
    expect(controller.getItemActions("sub").every(action => !action.disabled)).toBe(true);
  });

  it("refuses to invoke a disabled action", async () => {
    const transport = createTransport();
    const controller = createController(transport, {
      itemActions: [{ id: "delete", label: "Delete", requiresPermission: "canDelete" }],
    });
    await controller.connect();

    const invoked = vi.fn();
    controller.subscribe("itemActionInvoked", invoked);
    controller.invokeItemAction("1", "delete");

    expect(invoked).not.toHaveBeenCalled();
  });
});

describe("ContentExplorerController navigation + lifecycle", () => {
  it("truncates the breadcrumb trail when navigating to an ancestor", async () => {
    const transport = createTransport({
      loadFolderItems: vi.fn().mockImplementation(({ folderId }: { folderId: string }) =>
        Promise.resolve(
          folderResult({
            folderId,
            folder: { id: folderId, name: `Folder ${folderId}`, type: "folder" },
            breadcrumbs:
              folderId === "0"
                ? [{ id: "0", name: "All Files", type: "folder" }]
                : folderId === "a"
                  ? [
                      { id: "0", name: "All Files", type: "folder" },
                      { id: "a", name: "A", type: "folder" },
                    ]
                  : [
                      { id: "0", name: "All Files", type: "folder" },
                      { id: "a", name: "A", type: "folder" },
                      { id: "b", name: "B", type: "folder" },
                    ],
          }),
        ),
      ),
    });
    const controller = createController(transport);
    await controller.connect();
    await controller.navigateTo("a");
    await controller.navigateTo("b");

    // Click the "A" ancestor crumb: the trail must become [All Files, A], not reorder.
    await controller.navigateTo("a");

    expect(controller.getState().breadcrumbs.map(crumb => crumb.id)).toEqual(["0", "a"]);
    expect(controller.getState().currentFolderId).toBe("a");
  });

  it("resets to the root folder on disconnect", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();
    await controller.navigateTo("sub");

    controller.disconnect();

    const state = controller.getState();
    expect(state.connected).toBe(false);
    expect(state.currentFolderId).toBe("0");
    expect(state.currentFolder).toBeNull();
    expect(state.breadcrumbs).toEqual([]);
    expect(state.items).toEqual([]);
  });

  it("aborts a superseded in-flight load", async () => {
    let firstSignal: AbortSignal | undefined;
    let resolveFirst: ((result: ExplorerTransportResult) => void) | undefined;
    const loadFolderItems = vi
      .fn()
      .mockImplementationOnce((request: { signal?: AbortSignal }) => {
        firstSignal = request.signal;
        return new Promise<ExplorerTransportResult>(resolve => {
          resolveFirst = resolve;
        });
      })
      .mockImplementation(() => Promise.resolve(folderResult()));
    const controller = createController(createTransport({ loadFolderItems }));

    const connectPromise = controller.connect();
    await Promise.resolve();
    const reloadPromise = controller.reload();

    expect(firstSignal?.aborted).toBe(true);

    resolveFirst?.(folderResult());
    await Promise.all([connectPromise, reloadPromise]);
    // The superseded response must not clobber the newer one.
    expect(controller.getState().items).toHaveLength(2);
  });
});
