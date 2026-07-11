// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerActionMenuElement,
  defineBoxExplorerActionMenuElement,
} from "../../../../src/patterns/content-explorer/adapters/action-menu.js";
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

describe("BoxExplorerActionMenuElement", () => {
  beforeEach(() => {
    defineBoxExplorerActionMenuElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens item actions and emits item-action-invoked details", async () => {
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
    expect(trigger?.getAttribute("aria-label")).toBe("Open item actions");
    expect(element.shadowRoot?.querySelector('[part="trigger-icon"]')?.textContent).toContain("⋯");
    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flushMicrotasks();

    const menuItem = element.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null;
    expect(menuItem?.textContent).toContain("Preview");

    menuItem?.click();

    expect(invoked).toHaveBeenCalled();
    expect(invoked.mock.calls[0]?.[0]?.detail).toMatchObject({
      action: { id: "preview", label: "Preview" },
      item: { id: "1", name: "Spec", type: "file" },
    });
  });
});
