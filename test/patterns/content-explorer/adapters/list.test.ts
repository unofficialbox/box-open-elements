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

  it("renders a secondary meta line from enriched item fields", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockResolvedValue(
        createResult({
          items: [
            {
              id: "1",
              name: "Quarterly Plan.pdf",
              type: "file",
              size: 2_400_000,
              modifiedAt: "2026-07-10T18:30:00.000Z",
              owner: { id: "u1", name: "Morgan Lee" },
              sharedLink: { isShared: true, access: "company" },
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
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const meta = element.shadowRoot?.querySelector('[part="item-meta"]');
    expect(meta?.textContent).toContain("MB");
    expect(meta?.textContent).toContain("Morgan Lee");
    expect(meta?.textContent).toContain("Shared · Company");
  });

  it("sets aria-multiselectable for multiple selection mode", async () => {
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
      selectionMode: "multiple",
    });
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    element.controller = controller;

    document.body.append(element);
    await controller.connect();
    await flushMicrotasks();

    const list = element.shadowRoot?.querySelector('[part="list"]');
    expect(list?.getAttribute("aria-multiselectable")).toBe("true");
  });

  it("does not steal focus after folder navigation when focus is outside the list", async () => {
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
    const controller = new ContentExplorerController({
      rootFolderId: "0",
      token: "token",
      transport,
    });
    const element = document.createElement("box-explorer-list") as BoxExplorerListElement;
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    element.controller = controller;

    document.body.append(outsideButton, element);
    await controller.connect();
    await flushMicrotasks();

    const firstItem = element.shadowRoot?.querySelector('[part~="item"][data-item-id="marketing"]') as HTMLButtonElement | null;
    firstItem?.focus();
    firstItem?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    outsideButton.focus();
    await flushMicrotasks();

    expect(document.activeElement).toBe(outsideButton);
    expect(element.shadowRoot?.querySelector('[part~="item"][tabindex="0"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part~="item"][data-item-id="leaf"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part~="item"][data-item-id="marketing"]')).toBeNull();
  });

  it("surfaces load failures in the list shell", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi.fn().mockRejectedValue(new Error("Network unavailable")),
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

    expect(element.shadowRoot?.querySelector('[part="error"]')?.textContent).toContain("Network unavailable");
    expect(element.shadowRoot?.querySelector('[part="error"]')?.getAttribute("role")).toBe("alert");
  });

  it("splits selection (click/Space) from activation (Enter/dblclick) by default", async () => {
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

    const folder = element.shadowRoot?.querySelector('[part~="item"][data-item-id="marketing"]') as HTMLButtonElement;
    folder.click();
    await flushMicrotasks();

    expect(controller.getState().selectedItemIds).toEqual(["marketing"]);
    expect(controller.getState().currentFolder?.id).toBe("0");

    folder.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flushMicrotasks();

    expect(controller.getState().currentFolder?.id).toBe("marketing");
  });
});
