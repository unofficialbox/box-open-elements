import { describe, expect, it } from "vitest";

import { ExplorerCollectionController } from "../../../src/patterns/content-explorer/collection/controller.js";
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

describe("ExplorerCollectionController", () => {
  it("tracks items and pagination for a fresh load", () => {
    const controller = new ExplorerCollectionController({ pageSize: 25 });

    controller.startLoading();
    controller.applyLoadResult(
      createResult({
        items: [{ id: "1", name: "Quarterly Plan", type: "file" }],
        pagination: {
          hasMoreItems: true,
          limit: 25,
          offset: 0,
          totalCount: 2,
        },
      }),
      false,
    );

    expect(controller.getState()).toEqual({
      items: [{ id: "1", name: "Quarterly Plan", type: "file" }],
      loading: false,
      pagination: {
        hasMoreItems: true,
        limit: 25,
        offset: 0,
        totalCount: 2,
      },
    });
  });

  it("appends items for next-page loads", () => {
    const controller = new ExplorerCollectionController({ pageSize: 1 });

    controller.startLoading();
    controller.applyLoadResult(
      createResult({
        items: [{ id: "1", name: "Doc 1", type: "file" }],
        pagination: {
          hasMoreItems: true,
          limit: 1,
          offset: 0,
          totalCount: 2,
        },
      }),
      false,
    );

    controller.startLoading();
    controller.applyLoadResult(
      createResult({
        items: [{ id: "2", name: "Doc 2", type: "file" }],
        pagination: {
          hasMoreItems: false,
          limit: 1,
          offset: 1,
          totalCount: 2,
        },
      }),
      true,
    );

    expect(controller.getState().items).toEqual([
      { id: "1", name: "Doc 1", type: "file" },
      { id: "2", name: "Doc 2", type: "file" },
    ]);
    expect(controller.canLoadNextPage()).toBe(false);
  });
});
