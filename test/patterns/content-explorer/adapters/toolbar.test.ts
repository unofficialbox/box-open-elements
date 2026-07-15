// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerToolbarElement,
  defineBoxExplorerToolbarElement,
} from "../../../../src/patterns/content-explorer/adapters/toolbar.js";
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

describe("BoxExplorerToolbarElement", () => {
  beforeEach(() => {
    defineBoxExplorerToolbarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders selection state and clears current selection", async () => {
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
    const element = document.createElement("box-explorer-toolbar") as BoxExplorerToolbarElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    controller.toggleSelection("1");
    await flushMicrotasks();

    const count = element.shadowRoot?.querySelector('[part="selection-count"]') as HTMLElement | null;
    expect(count?.textContent).toContain("1 selected");

    const clearButton = element.shadowRoot?.querySelector('[part="clear-selection"]') as HTMLButtonElement | null;
    clearButton?.click();
    await flushMicrotasks();

    expect(controller.getState().selectedItemIds).toHaveLength(0);
  });

  it("exposes toolbar semantics and failed status", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockRejectedValue(new Error("Network unavailable")),
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
    await flushMicrotasks();

    const toolbar = element.shadowRoot?.querySelector('[part="toolbar"]');
    const status = element.shadowRoot?.querySelector('[part="status"]');

    expect(toolbar?.getAttribute("role")).toBe("toolbar");
    expect(toolbar?.getAttribute("aria-label")).toBe("Explorer toolbar");
    expect(status?.getAttribute("data-status")).toBe("failed");
    expect(status?.textContent).toBe("failed");
  });
});
