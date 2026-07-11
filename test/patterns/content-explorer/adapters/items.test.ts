// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerItemsElement,
  defineBoxExplorerItemsElement,
} from "../../../../src/patterns/content-explorer/adapters/items.js";
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

describe("BoxExplorerItemsElement", () => {
  beforeEach(() => {
    defineBoxExplorerItemsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders explorer items and emits item-action-invoked from row actions", async () => {
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

    const actionButton = element.shadowRoot?.querySelector('[part="item-action"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(element.shadowRoot?.textContent).toContain("Spec");
    expect(invoked).toHaveBeenCalled();
  });
});
