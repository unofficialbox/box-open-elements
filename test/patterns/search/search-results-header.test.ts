// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxSearchResultsHeaderElement,
  defineBoxSearchResultsHeaderElement,
} from "../../../src/patterns/search/search-results-header.js";

describe("BoxSearchResultsHeaderElement", () => {
  beforeEach(() => {
    defineBoxSearchResultsHeaderElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders count and context", () => {
    const element = document.createElement("box-search-results-header") as BoxSearchResultsHeaderElement;
    element.resultCount = 24;
    element.query = "brand";
    element.scope = "Marketing";
    element.sortLabel = "Updated";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("24 results");
    expect(element.shadowRoot?.textContent).toContain("Query: brand");
    expect(element.shadowRoot?.textContent).toContain("Scope: Marketing");
  });

  it("emits action when a toolbar action is clicked", () => {
    const element = document.createElement("box-search-results-header") as BoxSearchResultsHeaderElement;
    const action = vi.fn();
    element.actions = [{ id: "save-view", label: "Save view" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "save-view" },
      }),
    );
  });

  it("emits filter-removed when a chip is clicked", () => {
    const element = document.createElement("box-search-results-header") as BoxSearchResultsHeaderElement;
    const removed = vi.fn();
    element.filters = ["Shared externally"];
    element.addEventListener("filter-removed", removed);

    document.body.append(element);

    const chip = element.shadowRoot?.querySelector('[part="filter-chip"]') as HTMLButtonElement | null;
    chip?.click();

    expect(removed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { filter: "Shared externally" },
      }),
    );
  });
});

