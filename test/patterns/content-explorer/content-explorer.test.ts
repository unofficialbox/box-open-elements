// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxContentExplorerElement,
  defineBoxContentExplorerElement,
} from "../../../src/patterns/content-explorer/content-explorer.js";
import type { ExplorerTransport, ExplorerTransportResult } from "../../src/elements/content-explorer/types.js";

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

describe("BoxContentExplorerElement", () => {
  beforeEach(() => {
    defineBoxContentExplorerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("connects through attributes and dispatches DOM events", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
          pagination: {
            hasMoreItems: false,
            limit: 100,
            offset: 0,
            totalCount: 1,
          },
        }),
      ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    const itemsChanged = vi.fn();

    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.addEventListener("items-changed", itemsChanged);

    document.body.append(element);
    await flushMicrotasks();

    expect(transport.loadFolderItems).toHaveBeenCalledOnce();
    expect(itemsChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          items: [{ id: "1", name: "Spec", type: "file" }],
        },
      }),
    );
    expect(element.shadowRoot?.textContent).toContain("All Files");
    expect(element.shadowRoot?.textContent).toContain("Spec");
    expect(element.state?.items).toEqual([{ id: "1", name: "Spec", type: "file" }]);
  });

  it("loads the next page when the shadow button is clicked", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Page 1", type: "file" }],
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
            items: [{ id: "2", name: "Page 2", type: "file" }],
            pagination: {
              hasMoreItems: false,
              limit: 1,
              offset: 1,
              totalCount: 2,
            },
          }),
        ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;

    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.pageSize = 1;

    document.body.append(element);
    await flushMicrotasks();

    const button = element.shadowRoot?.querySelector('[part="load-more"]');
    expect(button).not.toBeNull();

    button?.dispatchEvent(new MouseEvent("click"));
    await flushMicrotasks();

    expect(transport.loadFolderItems).toHaveBeenNthCalledWith(2, {
      folderId: "0",
      language: undefined,
      limit: 1,
      offset: 1,
      token: "token",
    });
    expect(element.shadowRoot?.textContent).toContain("Page 2");
    expect(element.state?.items).toEqual([
      { id: "1", name: "Page 1", type: "file" },
      { id: "2", name: "Page 2", type: "file" },
    ]);
  });

  it("refreshes through the public method and rerenders updated content", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "1", name: "Old Name", type: "file" }],
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            folder: { id: "0", name: "Renamed Folder", type: "folder" },
            items: [{ id: "2", name: "New Name", type: "file" }],
          }),
        ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";

    document.body.append(element);
    await flushMicrotasks();

    await element.refresh();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Renamed Folder");
    expect(element.shadowRoot?.textContent).toContain("New Name");
  });

  it("reuses an existing definition when asked to define the element again", () => {
    const first = defineBoxContentExplorerElement();
    const second = defineBoxContentExplorerElement();

    expect(first).toBe(second);
    expect(customElements.get("box-content-explorer")).toBe(first);
  });

  it("activates folder items from the rendered list", async () => {
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

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    const activated = vi.fn();
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.addEventListener("item-activated", activated);

    document.body.append(element);
    await flushMicrotasks();

    const itemButton = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    itemButton?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await flushMicrotasks();

    expect(activated).toHaveBeenCalled();
    expect(element.shadowRoot?.textContent).toContain("Marketing");
    expect(element.shadowRoot?.textContent).toContain("Leaf");
  });

  it("renders and invokes inline item actions", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    const actionInvoked = vi.fn();
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.itemActions = [{ id: "preview", label: "Preview", itemTypes: ["file"] }];
    element.addEventListener("item-action-invoked", actionInvoked);

    document.body.append(element);
    await flushMicrotasks();

    const actionButton = element.shadowRoot?.querySelector('[part="item-action"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(actionInvoked).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: { id: "preview", label: "Preview", itemTypes: ["file"] },
          item: { id: "1", name: "Spec", type: "file" },
        },
      }),
    );
  });

  it("supports custom templates without losing built-in interaction behavior", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.templates = {
      renderFolder: ({ breadcrumbsMarkup, state }) =>
        `<header part="folder"><div data-template="folder">${breadcrumbsMarkup}<strong>${state?.currentFolder?.name ?? "none"}</strong></div></header>`,
      renderItem: ({ item, itemActionsMarkup, itemButtonAttributes, isSelected }) => `
        <li data-template="item">
          <article part="item-card">
            <button ${itemButtonAttributes}>Custom ${item.name} ${isSelected ? "selected" : "idle"}</button>
            ${itemActionsMarkup}
          </article>
        </li>
      `,
    };

    document.body.append(element);
    await flushMicrotasks();

    expect(element.shadowRoot?.querySelector('[data-template="folder"]')).not.toBeNull();
    expect(element.shadowRoot?.querySelector('[data-template="item"]')).not.toBeNull();

    const itemButton = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    itemButton?.click();
    await flushMicrotasks();

    expect(element.state?.selectedItemIds).toEqual(["1"]);
  });

  it("uses listbox semantics and keyboard navigation for rendered items", async () => {
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

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";

    document.body.append(element);
    await flushMicrotasks();

    const list = element.shadowRoot?.querySelector('[part="items"]') as HTMLElement | null;
    const firstItem = element.shadowRoot?.querySelector('[part="item"][data-item-id="1"]') as HTMLButtonElement | null;
    expect(list?.getAttribute("role")).toBe("listbox");
    expect(firstItem?.getAttribute("role")).toBe("option");

    firstItem?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await flushMicrotasks();

    const focused = element.shadowRoot?.activeElement as HTMLButtonElement | null;
    expect(focused?.dataset.itemId).toBe("2");
  });

  it("adds accessible labels to composite controls", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.itemActions = [{ id: "preview", label: "Preview", itemTypes: ["file"] }];

    document.body.append(element);
    await flushMicrotasks();

    const refreshButton = element.shadowRoot?.querySelector('[part="refresh"]') as HTMLButtonElement | null;
    const itemButton = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    const actionButton = element.shadowRoot?.querySelector('[part="item-action"]') as HTMLButtonElement | null;
    const breadcrumbButton = element.shadowRoot?.querySelector('[part="breadcrumb"]') as HTMLButtonElement | null;

    expect(refreshButton?.getAttribute("aria-label")).toBe("Refresh items");
    expect(itemButton?.getAttribute("aria-label")).toBe("Spec");
    expect(actionButton?.getAttribute("aria-label")).toBe("Preview Spec");
    expect(breadcrumbButton?.getAttribute("aria-label")).toBe("Open All Files");
  });

  it("escapes error messages rather than injecting them as markup", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockRejectedValue(new Error('<img src=x onerror=alert(1)>')),
    };

    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    document.body.append(element);
    await flushMicrotasks();
    await flushMicrotasks();

    const error = element.shadowRoot?.querySelector('[part="error"]');
    // The message text is present but as text, not parsed markup — no <img> injected.
    expect(error?.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
  });

  it("searches and clears search through the element API", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
      searchItems: vi.fn().mockResolvedValue({
        query: "plan",
        ancestorFolderId: "0",
        items: [{ id: "9", name: "Quarterly Plan", type: "file" }],
        pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: 1 },
      }),
    };
    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    const searchSucceeded = vi.fn();
    const viewChanged = vi.fn();
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.pageSize = 25;
    element.addEventListener("search-succeeded", searchSucceeded);
    element.addEventListener("view-changed", viewChanged);

    document.body.append(element);
    await flushMicrotasks();
    await flushMicrotasks();

    await element.search("plan");
    await flushMicrotasks();

    expect(searchSucceeded).toHaveBeenCalled();
    expect(viewChanged).toHaveBeenCalled();
    expect(element.searchQuery).toBe("plan");
    expect(element.shadowRoot?.textContent).toContain("Search results");
    expect(element.shadowRoot?.textContent).toContain("Quarterly Plan");

    const clearButton = element.shadowRoot?.querySelector('[part="clear-search"]') as HTMLButtonElement;
    clearButton.click();
    await flushMicrotasks();

    expect(element.state?.view.mode).toBe("folder");
    expect(element.shadowRoot?.querySelector('[part="clear-search"]')).toBeNull();
  });

  it("honors a declarative search-query set before connect", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: "1", name: "Spec", type: "file" }],
        }),
      ),
      searchItems: vi.fn().mockResolvedValue({
        query: "plan",
        ancestorFolderId: "0",
        items: [{ id: "9", name: "Quarterly Plan", type: "file" }],
        pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: 1 },
      }),
    };
    const element = document.createElement("box-content-explorer") as BoxContentExplorerElement;
    element.transport = transport;
    element.rootFolderId = "0";
    element.token = "token";
    element.pageSize = 25;
    element.setAttribute("search-query", "plan");

    document.body.append(element);
    await flushMicrotasks();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(transport.searchItems).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "plan",
        ancestorFolderId: "0",
        limit: 25,
        offset: 0,
        token: "token",
      }),
    );
    expect(element.state?.view.mode).toBe("search");
    expect(element.shadowRoot?.textContent).toContain("Quarterly Plan");
  });
});
