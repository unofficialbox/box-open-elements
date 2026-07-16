// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  contentExplorerChromeHtml,
  setupContentExplorerChrome,
} from "../../docs-site/explorer-chrome-demo.js";
import { defineBoxContentExplorerElement } from "../../src/patterns/content-explorer/content-explorer.js";
import { defineBoxFilterBarElement } from "../../src/patterns/search/filter-bar.js";
import { defineBoxSavedViewPickerElement } from "../../src/patterns/search/saved-view-picker.js";
import type { ExplorerTransport } from "../../src/patterns/content-explorer/types.js";

const createTransport = (): ExplorerTransport & {
  searchItems: ReturnType<typeof vi.fn>;
} => {
  const searchItems = vi.fn(async ({ query }: { query: string }) => ({
    query,
    ancestorFolderId: "0",
    items: [],
    pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: 0 },
  }));
  return {
    async loadFolderItems({ folderId }) {
      return {
        folderId,
        folder: { id: folderId, name: "All Files", type: "folder" },
        breadcrumbs: [{ id: "0", name: "All Files", type: "folder" }],
        items: [],
        pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: 0 },
      };
    },
    searchItems,
  };
};

describe("docs-site content-explorer chrome demo", () => {
  beforeEach(() => {
    defineBoxContentExplorerElement();
    defineBoxFilterBarElement();
    defineBoxSavedViewPickerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("wires filter search, saved-view search, presentation updates, and cleanup", async () => {
    expect(contentExplorerChromeHtml).toContain("box-saved-view-picker");
    expect(contentExplorerChromeHtml).toContain("box-filter-bar");
    expect(contentExplorerChromeHtml).toContain("box-content-explorer");

    document.body.innerHTML = contentExplorerChromeHtml;
    const transport = createTransport();
    const cleanup = setupContentExplorerChrome(document.body, transport);
    expect(cleanup).toEqual(expect.any(Function));

    const explorer = document.querySelector("box-content-explorer") as HTMLElement & {
      search: (q: string) => Promise<void>;
      clearSearch: () => Promise<void>;
      connect?: () => Promise<void>;
    };
    const filterBar = document.querySelector("box-filter-bar") as HTMLElement;
    const picker = document.querySelector("box-saved-view-picker") as HTMLElement;
    const presentation = document.querySelector("[data-host-presentation]") as HTMLElement;

    // Avoid full connect; spy search/clearSearch at the element boundary.
    const search = vi.fn(async () => undefined);
    const clearSearch = vi.fn(async () => undefined);
    explorer.search = search;
    explorer.clearSearch = clearSearch;

    filterBar.dispatchEvent(
      new CustomEvent("search", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "Plan", sort: "", view: "list", filters: [] } },
      }),
    );
    expect(search).toHaveBeenCalledWith("Plan");

    picker.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: "pdfs" },
      }),
    );
    expect(search).toHaveBeenCalledWith("pdf");

    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "Plan", sort: "name", view: "table", filters: [] } },
      }),
    );
    expect(presentation.querySelector("strong")?.textContent).toBe("table");
    expect(presentation.getAttribute("aria-live")).toBe("polite");

    cleanup?.();
    search.mockClear();
    filterBar.dispatchEvent(
      new CustomEvent("search", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "again", sort: "", view: "list", filters: [] } },
      }),
    );
    expect(search).not.toHaveBeenCalled();
  });
});
