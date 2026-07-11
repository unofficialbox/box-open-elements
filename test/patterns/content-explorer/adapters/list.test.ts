// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerListElement,
  defineBoxExplorerListElement,
} from "../../../../src/patterns/content-explorer/adapters/list.js";
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

describe("BoxExplorerListElement", () => {
  beforeEach(() => {
    defineBoxExplorerListElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("loads additional pages and preserves keyboard listbox semantics", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            items: [
              { id: "1", name: "Spec", type: "file" },
              { id: "2", name: "Appendix", type: "file" },
            ],
            pagination: { hasMoreItems: true, limit: 2, offset: 0, totalCount: 3 },
          }),
        )
        .mockResolvedValueOnce(
          createResult({
            items: [{ id: "3", name: "Roadmap", type: "file" }],
            pagination: { hasMoreItems: false, limit: 2, offset: 2, totalCount: 3 },
          }),
        ),
    };
    const controller = new ContentExplorerController({
      pageSize: 2,
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
    expect(list?.getAttribute("role")).toBe("listbox");

    const firstItem = element.shadowRoot?.querySelector('[part~="item"][data-item-id="1"]') as HTMLButtonElement | null;
    firstItem?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await flushMicrotasks();

    expect((element.shadowRoot?.activeElement as HTMLButtonElement | null)?.dataset.itemId).toBe("2");

    const loadMoreButton = element.shadowRoot?.querySelector('[part="load-more"]') as HTMLButtonElement | null;
    loadMoreButton?.click();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("Roadmap");
  });
});
