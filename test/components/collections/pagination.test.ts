// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxPaginationElement,
  defineBoxPaginationElement,
} from "../../../src/components/collections/pagination.js";

describe("BoxPaginationElement", () => {
  beforeEach(() => {
    defineBoxPaginationElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the current item range", () => {
    const element = document.createElement("box-pagination") as BoxPaginationElement;
    element.page = 2;
    element.pageSize = 10;
    element.totalItems = 45;

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Showing 11-20 of 45");
  });

  it("emits page changes when next is clicked", () => {
    const element = document.createElement("box-pagination") as BoxPaginationElement;
    const changed = vi.fn();
    element.page = 1;
    element.pageSize = 10;
    element.totalItems = 25;
    element.addEventListener("page-changed", changed);

    document.body.append(element);

    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement | null;
    next?.click();

    expect(element.page).toBe(2);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { page: 2 },
      }),
    );
  });

  it("uses navigation semantics and accessible button labels", () => {
    const element = document.createElement("box-pagination") as BoxPaginationElement;
    element.page = 1;
    element.pageSize = 10;
    element.totalItems = 25;

    document.body.append(element);

    const pagination = element.shadowRoot?.querySelector('[part="pagination"]') as HTMLElement | null;
    const previous = element.shadowRoot?.querySelector('[part="previous"]') as HTMLButtonElement | null;
    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement | null;

    expect(pagination?.getAttribute("aria-label")).toBe("Pagination");
    expect(previous?.getAttribute("aria-label")).toBe("Previous page");
    expect(next?.getAttribute("aria-label")).toBe("Next page");
  });
});
