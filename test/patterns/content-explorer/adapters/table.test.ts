// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerTableElement,
  defineBoxExplorerTableElement,
} from "../../../../src/patterns/content-explorer/adapters/table.js";
import { defineBoxExplorerActionMenuElement } from "../../../../src/patterns/content-explorer/adapters/action-menu.js";
import type { ExplorerTransport, ExplorerTransportResult } from "../../../../src/patterns/content-explorer/types.js";

const createResult = (overrides: Partial<ExplorerTransportResult> = {}): ExplorerTransportResult => ({
  breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
  folder: { id: "0", name: "All Files", type: "folder" },
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

describe("BoxExplorerTableElement", () => {
  beforeEach(() => {
    defineBoxExplorerActionMenuElement();
    defineBoxExplorerTableElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders enriched metadata columns", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [
            {
              id: "1",
              name: "Spec",
              type: "file",
              size: 2048,
              modifiedAt: "2026-07-10T18:30:00.000Z",
              owner: { id: "u1", name: "Morgan Lee" },
              sharedLink: { isShared: true, access: "open" },
            },
          ],
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

    expect(element.shadowRoot?.querySelector('[part="header-modified"]')?.textContent).toBe(
      "Modified",
    );
    expect(element.shadowRoot?.querySelector('[part="size-cell"]')?.textContent).toContain("KB");
    expect(element.shadowRoot?.querySelector('[part="owner-cell"]')?.textContent).toBe("Morgan Lee");
    expect(element.shadowRoot?.querySelector('[part="shared-cell"]')?.textContent).toBe(
      "Shared · Open",
    );
    expect(element.shadowRoot?.querySelector('[part="modified-cell"]')?.textContent).toMatch(/Jul/);
  });

  it("renders table rows, toggles selection, and mounts row action menus", async () => {
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
      selectionMode: "single",
    });
    const element = document.createElement("box-explorer-table") as BoxExplorerTableElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const checkbox = element.shadowRoot?.querySelector('[part="selection"]') as HTMLInputElement | null;
    checkbox?.dispatchEvent(new Event("change", { bubbles: true }));
    await flushMicrotasks();

    expect(controller.getState().selectedItemIds).toContain("1");
    expect(element.shadowRoot?.querySelector("box-explorer-action-menu")).not.toBeNull();
  });
});
