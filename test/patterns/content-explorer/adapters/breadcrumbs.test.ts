// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentExplorerController } from "../../../../src/patterns/content-explorer/controller.js";
import {
  BoxExplorerBreadcrumbsElement,
  defineBoxExplorerBreadcrumbsElement,
} from "../../../../src/patterns/content-explorer/adapters/breadcrumbs.js";
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

describe("BoxExplorerBreadcrumbsElement", () => {
  beforeEach(() => {
    defineBoxExplorerBreadcrumbsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders breadcrumbs and navigates when a crumb is clicked", async () => {
    const transport: ExplorerTransport = {
      loadFolderItems: vi
        .fn()
        .mockResolvedValueOnce(
          createResult({
            breadcrumbs: [
              { id: "0", name: "All Files", type: "folder" },
              { id: "marketing", name: "Marketing", type: "folder" },
            ],
            folder: { id: "marketing", name: "Marketing", type: "folder" },
            folderId: "marketing",
          }),
        )
        .mockResolvedValueOnce(createResult()),
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

    const crumbs = element.shadowRoot?.querySelectorAll('[part="breadcrumb"]') ?? [];
    expect(crumbs).toHaveLength(2);

    (crumbs[0] as HTMLButtonElement | undefined)?.click();
    await flushMicrotasks();

    expect(transport.loadFolderItems).toHaveBeenCalledTimes(2);
    expect((transport.loadFolderItems as ReturnType<typeof vi.fn>).mock.calls[1]?.[0]?.folderId).toBe("0");
  });
});
