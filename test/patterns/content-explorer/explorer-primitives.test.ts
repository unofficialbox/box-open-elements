// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerActionMenuElement,
  defineBoxExplorerActionMenuElement,
} from "../../../src/patterns/content-explorer/adapters/action-menu.js";
import {
  BoxExplorerBreadcrumbsElement,
  defineBoxExplorerBreadcrumbsElement,
} from "../../../src/patterns/content-explorer/adapters/breadcrumbs.js";
import {
  BoxExplorerItemsElement,
  defineBoxExplorerItemsElement,
} from "../../../src/patterns/content-explorer/adapters/items.js";
import {
  BoxExplorerListElement,
  defineBoxExplorerListElement,
} from "../../../src/patterns/content-explorer/adapters/list.js";
import {
  BoxExplorerToolbarElement,
  defineBoxExplorerToolbarElement,
} from "../../../src/patterns/content-explorer/adapters/toolbar.js";
import {
  BoxExplorerTableElement,
  defineBoxExplorerTableElement,
} from "../../../src/patterns/content-explorer/adapters/table.js";
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

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("Explorer primitive web components", () => {
  beforeEach(() => {
    defineBoxExplorerActionMenuElement();
    defineBoxExplorerBreadcrumbsElement();
    defineBoxExplorerListElement();
    defineBoxExplorerItemsElement();
    defineBoxExplorerTableElement();
    defineBoxExplorerToolbarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders breadcrumbs from a shared controller", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          breadcrumbs: [
            { id: "0", name: "All Files", type: "folder" },
            { id: "marketing", name: "Marketing", type: "folder" },
          ],
          folder: { id: "marketing", name: "Marketing", type: "folder" },
          folderId: "marketing",
        }),
      ),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "marketing",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-breadcrumbs") as BoxExplorerBreadcrumbsElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("All Files");
    expect(element.shadowRoot?.textContent).toContain("Marketing");
  });

  it("renders items and invokes item actions through a shared controller", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      itemActions: [{ id: "preview", label: "Preview", itemTypes: ["file"] }],
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-items") as BoxExplorerItemsElement;
    const invoked = vi.fn();
    element.controller = controller;
    element.addEventListener("item-action-invoked", invoked);

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Spec");

    const actionButton = element.shadowRoot?.querySelector('[part="item-action"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(invoked).toHaveBeenCalled();
  });

  it("renders the list primitive and loads additional pages", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Spec", type: "file" }],
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
            items: [{ id: "2", name: "Appendix", type: "file" }],
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
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Spec");

    const loadMoreButton = element.shadowRoot?.querySelector('[part="load-more"]') as HTMLButtonElement | null;
    loadMoreButton?.click();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Appendix");
  });

  it("uses listbox semantics and keyboard navigation in the list primitive", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [
            { id: "1", name: "Spec", type: "file" },
            { id: "2", name: "Appendix", type: "file" },
          ],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const list = element.shadowRoot?.querySelector('[part="list"]') as HTMLElement | null;
    const firstItem = element.shadowRoot?.querySelector('[part~="item"][data-item-id="1"]') as HTMLButtonElement | null;
    expect(list?.getAttribute("role")).toBe("listbox");
    expect(firstItem?.getAttribute("role")).toBe("option");

    firstItem?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await flushMicrotasks();

    const focused = element.shadowRoot?.activeElement as HTMLButtonElement | null;
    expect(focused?.dataset.itemId).toBe("2");
  });

  it("exports explicit selected parts for active list rows", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
      selectionMode: "single",
    });
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const firstItem = element.shadowRoot?.querySelector('[part~="item"][data-item-id="1"]') as HTMLButtonElement | null;
    firstItem?.click();
    await flushMicrotasks();

    const selectedRow = element.shadowRoot?.querySelector('[part~="item-row-selected"]') as HTMLElement | null;
    const selectedItem = element.shadowRoot?.querySelector('[part~="item-selected"][data-item-id="1"]') as HTMLButtonElement | null;
    expect(selectedRow).not.toBeNull();
    expect(selectedItem?.getAttribute("aria-selected")).toBe("true");
  });

  it("renders selection state and clears selection through the toolbar", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-toolbar") as BoxExplorerToolbarElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    controller.select(["1"]);
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("1 selected");

    const clearButton = element.shadowRoot?.querySelector('[part="clear-selection"]') as HTMLButtonElement | null;
    clearButton?.click();

    expect(controller.getState().selectedItemIds).toEqual([]);
  });

  it("renders the table primitive and supports row selection and actions", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      itemActions: [{ id: "preview", label: "Preview", itemTypes: ["file"] }],
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-table") as BoxExplorerTableElement;
    const actionInvoked = vi.fn();
    element.controller = controller;
    element.addEventListener("item-action-invoked", actionInvoked);

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Spec");
    expect(element.shadowRoot?.textContent).toContain("file");

    const selection = element.shadowRoot?.querySelector('[part="selection"]') as HTMLInputElement | null;
    selection?.click();
    await flushMicrotasks();

    expect(controller.getState().selectedItemIds).toEqual(["1"]);

    const actionMenu = element.shadowRoot?.querySelector("box-explorer-action-menu") as BoxExplorerActionMenuElement | null;
    const trigger = actionMenu?.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();
    await flushMicrotasks();

    const actionButton = actionMenu?.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(actionInvoked).toHaveBeenCalled();
  });

  it("adds accessible labels to table row controls", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-table") as BoxExplorerTableElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const selection = element.shadowRoot?.querySelector('[part="selection"]') as HTMLInputElement | null;
    const rowItem = element.shadowRoot?.querySelector('[part="row-item"]') as HTMLButtonElement | null;

    expect(selection?.getAttribute("aria-label")).toBe("Select Spec");
    expect(rowItem?.getAttribute("aria-label")).toBe("Spec");
  });

  it("renders a standalone action menu primitive for a specific item", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      itemActions: [{ id: "preview", label: "Preview", itemTypes: ["file"] }],
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-action-menu") as BoxExplorerActionMenuElement;
    const invoked = vi.fn();
    element.controller = controller;
    element.itemId = "1";
    element.addEventListener("item-action-invoked", invoked);

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();
    await flushMicrotasks();

    const actionButton = element.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(invoked).toHaveBeenCalled();
  });

  it("exposes menu disclosure semantics and keyboard open behavior", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };
    const controller = new ContentExplorerController({
      itemActions: [{ id: "preview", label: "Preview", itemTypes: ["file"] }],
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-action-menu") as BoxExplorerActionMenuElement;
    element.controller = controller;
    element.itemId = "1";

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    expect(trigger?.getAttribute("aria-haspopup")).toBe("menu");

    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await flushMicrotasks();

    const menu = element.shadowRoot?.querySelector('[part="menu"]') as HTMLElement | null;
    expect(menu?.getAttribute("role")).toBe("menu");
  });
});
