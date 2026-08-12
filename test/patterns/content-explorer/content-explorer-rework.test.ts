import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentExplorer } from "../../../src/patterns/content-explorer/content-explorer.js";
import type {
  ExplorerTransport,
  ExplorerTransportResult,
} from "../../../src/patterns/content-explorer/types.js";

ContentExplorer.register();

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const createResult = (overrides: Partial<ExplorerTransportResult> = {}): ExplorerTransportResult => ({
  breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
  folder: { id: "0", name: "All Files", type: "folder" },
  folderId: "0",
  items: [
    { id: "1", name: "Spec", type: "file", permissions: { canDelete: false } },
    { id: "2", name: "Appendix", type: "file" },
  ],
  pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: 2 },
  ...overrides,
});

const mountExplorer = async (
  transport: ExplorerTransport,
  configure?: (element: ContentExplorer) => void,
): Promise<ContentExplorer> => {
  const element = document.createElement("box-content-explorer") as ContentExplorer;
  element.transport = transport;
  element.rootFolderId = "0";
  element.token = "token";
  configure?.(element);
  document.body.append(element);
  await flushMicrotasks();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ContentExplorer rework", () => {
  it("does not steal focus from outside the element on state updates", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(createResult()),
    };
    const element = await mountExplorer(transport);

    const outside = document.createElement("button");
    document.body.append(outside);

    // Simulate a prior in-element interaction, then move focus away.
    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement;
    item.click();
    await flushMicrotasks();
    outside.focus();

    // An API-driven update (selection change) must not pull focus back in.
    element.clearSelection();
    await flushMicrotasks();

    expect(document.activeElement).toBe(outside);
  });

  it("renders permission-gated actions as disabled and exposes multiselect semantics", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(createResult()),
    };
    const element = await mountExplorer(transport, el => {
      el.itemActions = [{ id: "delete", label: "Delete", requiresPermission: "canDelete" }];
    });

    const gated = element.shadowRoot?.querySelector(
      '[part="item-action"][data-item-id="1"]',
    ) as HTMLButtonElement | null;
    const open = element.shadowRoot?.querySelector(
      '[part="item-action"][data-item-id="2"]',
    ) as HTMLButtonElement | null;
    expect(gated?.disabled).toBe(true);
    expect(gated?.getAttribute("aria-disabled")).toBe("true");
    expect(open?.disabled).toBe(false);

    const list = element.shadowRoot?.querySelector('[part="items"]');
    expect(list?.getAttribute("aria-multiselectable")).toBe("true");
  });

  it("delegates sort and mutations to the controller", async () => {
    const loadFolderItems = vi.fn().mockResolvedValue(createResult());
    const createFolder = vi.fn().mockResolvedValue({ id: "n", name: "New", type: "folder" });
    const element = await mountExplorer({ loadFolderItems, createFolder });

    await element.setSort({ sortBy: "name", direction: "ASC" });
    expect(loadFolderItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: "name", sortDirection: "ASC" }),
    );
    expect(element.state?.sort).toEqual({ sortBy: "name", direction: "ASC" });

    const created = await element.createFolder("New");
    expect(created?.id).toBe("n");
    expect(createFolder).toHaveBeenCalledWith(expect.objectContaining({ parentFolderId: "0", name: "New" }));
  });

  it("exposes the live controller for adapter pairing", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(createResult()),
    };
    const element = await mountExplorer(transport);

    expect(element.explorerController).not.toBeNull();
    expect(element.explorerController?.getState().items).toHaveLength(2);
  });

  it("escapes hostile item ids in list markup", async () => {
    const hostileId = `x" onmouseover="alert(1)`;
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [{ id: hostileId, name: "Weird", type: "file" }],
        }),
      ),
    };
    const element = await mountExplorer(transport);

    const li = element.shadowRoot?.querySelector("ul[part='items'] > li[data-item-id]");
    expect(li?.getAttribute("data-item-id")).toBe(hostileId);
    expect(li?.hasAttribute("onmouseover")).toBe(false);
  });
});
