import { describe, expect, it, vi } from "vitest";

import { UnifiedShareController } from "../../../src/patterns/share/unified-share-controller.js";
import type { ShareDataSource, ShareState } from "../../../src/patterns/share/contracts.js";

const baseState = (): ShareState => ({
  itemId: "42",
  itemType: "file",
  sharedLink: { url: "https://app.box.com/s/abc", access: "company" },
  collaborators: [{ id: "1", name: "Morgan Lee", type: "user", role: "editor" }],
});

const createDataSource = (overrides: Partial<ShareDataSource> = {}): ShareDataSource => ({
  getShareState: vi.fn(async () => baseState()),
  updateSharedLink: vi.fn(async ({ sharedLink }) => ({ ...baseState(), sharedLink })),
  listCollaborators: vi.fn(async () => baseState().collaborators),
  ...overrides,
});

const createController = (dataSource = createDataSource()): UnifiedShareController =>
  new UnifiedShareController({ itemId: "42", dataSource });

describe("UnifiedShareController", () => {
  it("starts idle on the link tab", () => {
    const controller = createController();
    const state = controller.getState();
    expect(state.status).toBe("idle");
    expect(state.activeTab).toBe("link");
    expect(state.sharedLink).toBeNull();
    expect(state.collaborators).toEqual([]);
  });

  it("loads the shared link and collaborators, emitting loaded", async () => {
    const dataSource = createDataSource();
    const controller = createController(dataSource);
    const onLoaded = vi.fn();
    controller.subscribe("loaded", onLoaded);

    await controller.load();

    expect(dataSource.getShareState).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "42", itemType: "file" }),
    );
    const state = controller.getState();
    expect(state.status).toBe("ready");
    expect(state.sharedLink?.url).toBe("https://app.box.com/s/abc");
    expect(state.collaborators).toHaveLength(1);
    expect(onLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ sharedLink: expect.objectContaining({ access: "company" }) }),
    );
  });

  it("honours a configured folder itemType", async () => {
    const dataSource = createDataSource();
    const controller = new UnifiedShareController({ itemId: "9", itemType: "folder", dataSource });

    await controller.load();

    expect(dataSource.getShareState).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "9", itemType: "folder" }),
    );
  });

  it("surfaces a load failure as error status and event", async () => {
    const dataSource = createDataSource({
      getShareState: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    const controller = createController(dataSource);
    const onError = vi.fn();
    controller.subscribe("error", onError);

    await controller.load();

    expect(controller.getState().status).toBe("error");
    expect(controller.getState().error).toBe("boom");
    expect(onError).toHaveBeenCalledWith({ error: "boom" });
  });

  it("ignores a concurrent load while already loading", async () => {
    const dataSource = createDataSource();
    const controller = createController(dataSource);

    const first = controller.load();
    // Second call is a no-op because status is already "loading".
    await controller.load();
    await first;

    expect(dataSource.getShareState).toHaveBeenCalledTimes(1);
  });

  it("changes access through the data source and emits linkChanged", async () => {
    const dataSource = createDataSource();
    const controller = createController(dataSource);
    await controller.load();
    const onLinkChanged = vi.fn();
    controller.subscribe("linkChanged", onLinkChanged);

    await controller.setAccess("open");

    expect(dataSource.updateSharedLink).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "42",
        sharedLink: expect.objectContaining({ access: "open", url: "https://app.box.com/s/abc" }),
      }),
    );
    expect(controller.getState().sharedLink?.access).toBe("open");
    expect(controller.getState().updatingLink).toBe(false);
    expect(onLinkChanged).toHaveBeenCalled();
  });

  it("reports an access-change failure without losing the previous link", async () => {
    const dataSource = createDataSource({
      updateSharedLink: vi.fn(async () => {
        throw new Error("nope");
      }),
    });
    const controller = createController(dataSource);
    await controller.load();

    await controller.setAccess("open");

    const state = controller.getState();
    expect(state.error).toBe("nope");
    expect(state.updatingLink).toBe(false);
    expect(state.sharedLink?.access).toBe("company");
  });

  it("switches tabs only when the value changes", () => {
    const controller = createController();
    const onStateChanged = vi.fn();
    controller.subscribe("stateChanged", onStateChanged);

    controller.setActiveTab("people");
    expect(controller.getState().activeTab).toBe("people");
    expect(onStateChanged).toHaveBeenCalledTimes(1);

    controller.setActiveTab("people");
    expect(onStateChanged).toHaveBeenCalledTimes(1);
  });
});
