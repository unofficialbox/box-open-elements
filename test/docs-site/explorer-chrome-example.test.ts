// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  contentExplorerChromeHtml,
  setupContentExplorerChrome,
} from "../../docs-site/explorer-chrome-demo.js";
import { defineBoxExplorerBreadcrumbsElement } from "../../src/patterns/content-explorer/adapters/breadcrumbs.js";
import { defineBoxExplorerListElement } from "../../src/patterns/content-explorer/adapters/list.js";
import { defineBoxExplorerTableElement } from "../../src/patterns/content-explorer/adapters/table.js";
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
    defineBoxExplorerBreadcrumbsElement();
    defineBoxExplorerListElement();
    defineBoxExplorerTableElement();
    defineBoxFilterBarElement();
    defineBoxSavedViewPickerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("composes adapters and swaps list/table presentation from filter-bar view", async () => {
    expect(contentExplorerChromeHtml).toContain("box-saved-view-picker");
    expect(contentExplorerChromeHtml).toContain("box-filter-bar");
    expect(contentExplorerChromeHtml).toContain("box-explorer-breadcrumbs");
    expect(contentExplorerChromeHtml).toContain("box-explorer-list");
    expect(contentExplorerChromeHtml).toContain("box-explorer-table");
    expect(contentExplorerChromeHtml).not.toContain("box-content-explorer");

    document.body.innerHTML = contentExplorerChromeHtml;
    const transport = createTransport();
    const cleanup = setupContentExplorerChrome(document.body, transport);
    expect(cleanup).toEqual(expect.any(Function));

    // Allow controller.connect() to settle on the mock transport.
    await Promise.resolve();
    await Promise.resolve();

    const filterBar = document.querySelector("box-filter-bar") as HTMLElement;
    const picker = document.querySelector("box-saved-view-picker") as HTMLElement;
    const list = document.querySelector("box-explorer-list") as HTMLElement;
    const table = document.querySelector("box-explorer-table") as HTMLElement;
    const presentation = document.querySelector("[data-host-presentation]") as HTMLElement;

    expect(list.hidden).toBe(false);
    expect(table.hidden).toBe(true);
    expect(presentation.querySelector("strong")?.textContent).toBe("list");

    filterBar.dispatchEvent(
      new CustomEvent("search", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "Plan", sort: "", view: "list", filters: [] } },
      }),
    );
    await Promise.resolve();
    expect(transport.searchItems).toHaveBeenCalled();
    expect(
      (transport.searchItems.mock.calls.at(-1)?.[0] as { query?: string } | undefined)?.query,
    ).toBe("Plan");

    picker.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: "pdfs" },
      }),
    );
    await Promise.resolve();
    expect(
      (transport.searchItems.mock.calls.at(-1)?.[0] as { query?: string } | undefined)?.query,
    ).toBe("pdf");

    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "Plan", sort: "name", view: "table", filters: [] } },
      }),
    );
    expect(list.hidden).toBe(true);
    expect(table.hidden).toBe(false);
    expect(presentation.querySelector("strong")?.textContent).toBe("table");
    expect(presentation.getAttribute("aria-live")).toBe("polite");

    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "Plan", sort: "name", view: "list", filters: [] } },
      }),
    );
    expect(list.hidden).toBe(false);
    expect(table.hidden).toBe(true);

    const callsBeforeCleanup = transport.searchItems.mock.calls.length;
    cleanup?.();
    filterBar.dispatchEvent(
      new CustomEvent("search", {
        bubbles: true,
        composed: true,
        detail: { value: { query: "again", sort: "", view: "list", filters: [] } },
      }),
    );
    await Promise.resolve();
    expect(transport.searchItems.mock.calls.length).toBe(callsBeforeCleanup);
  });
});
