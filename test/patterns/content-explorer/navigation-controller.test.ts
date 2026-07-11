import { describe, expect, it } from "vitest";

import { ExplorerNavigationController } from "../../../src/patterns/content-explorer/navigation/controller.js";
import type { ExplorerTransportResult } from "../../../src/patterns/content-explorer/types.js";

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

describe("ExplorerNavigationController", () => {
  it("tracks explicit folder navigation before data reloads", () => {
    const controller = new ExplorerNavigationController({ rootFolderId: "0" });

    const nextFolder = controller.navigateTo("marketing");

    expect(nextFolder).toEqual({ id: "marketing", name: "marketing", type: "folder" });
    expect(controller.getState()).toEqual({
      breadcrumbs: [{ id: "marketing", name: "marketing", type: "folder" }],
      currentFolder: { id: "marketing", name: "marketing", type: "folder" },
      currentFolderId: "marketing",
    });
  });

  it("applies loaded folder metadata and breadcrumbs from transport", () => {
    const controller = new ExplorerNavigationController({ rootFolderId: "0" });

    controller.applyLoadedFolder(
      createResult({
        breadcrumbs: [
          { id: "0", name: "All Files", type: "folder" },
          { id: "marketing", name: "Marketing", type: "folder" },
        ],
        folder: { id: "marketing", name: "Marketing", type: "folder" },
        folderId: "marketing",
      }),
    );

    expect(controller.getState()).toEqual({
      breadcrumbs: [
        { id: "0", name: "All Files", type: "folder" },
        { id: "marketing", name: "Marketing", type: "folder" },
      ],
      currentFolder: { id: "marketing", name: "Marketing", type: "folder" },
      currentFolderId: "marketing",
    });
  });
});
