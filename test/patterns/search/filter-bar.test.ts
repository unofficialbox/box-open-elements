// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxFilterBarElement, defineBoxFilterBarElement } from "../../../src/patterns/search/filter-bar.js";

describe("BoxFilterBarElement", () => {
  beforeEach(() => {
    defineBoxFilterBarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value-changed when the search query changes", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.value = "marketing";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(element.query).toBe("marketing");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          value: {
            query: "marketing",
            sort: "",
            view: "",
            filters: [],
          },
        },
      }),
    );
  });

  it("emits value-changed when sort and view change", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    const changed = vi.fn();
    element.sortOptions = [
      { label: "Updated", value: "updated" },
      { label: "Name", value: "name" },
    ];
    element.viewOptions = [
      { label: "List", value: "list" },
      { label: "Grid", value: "grid" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const selects = element.shadowRoot?.querySelectorAll('[part="select"]') ?? [];
    const sort = selects[0] as HTMLSelectElement | undefined;
    const view = selects[1] as HTMLSelectElement | undefined;

    if (sort) {
      sort.value = "name";
      sort.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (view) {
      view.value = "grid";
      view.dispatchEvent(new Event("change", { bubbles: true }));
    }

    expect(element.sortValue).toBe("name");
    expect(element.viewValue).toBe("grid");
    expect(changed).toHaveBeenCalled();
  });

  it("toggles filter chips", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    element.filterOptions = [
      { label: "Owned by me", value: "mine" },
      { label: "Shared externally", value: "shared" },
    ];

    document.body.append(element);

    const chip = element.shadowRoot?.querySelector('[part="filter-chip"][data-value="mine"]') as HTMLButtonElement | null;
    chip?.click();

    expect(element.filters).toEqual(["mine"]);
  });

  it("emits search on query change commit", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    const searched = vi.fn();
    element.addEventListener("search", searched);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(searched).toHaveBeenCalled();
  });

  it("keeps the same input focused while typing", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();
    input?.dispatchEvent(new FocusEvent("focus"));

    if (input) {
      input.value = "mark";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const nextInput = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;

    expect(nextInput).toBe(input);
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(element.query).toBe("mark");
  });

  it("keeps chip focus when toggling filters", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    element.filterOptions = [
      { label: "Owned by me", value: "mine" },
      { label: "Shared externally", value: "shared" },
    ];
    document.body.append(element);

    const chip = element.shadowRoot?.querySelector(
      '[part="filter-chip"][data-value="mine"]',
    ) as HTMLButtonElement;
    chip.focus();
    chip.click();

    expect(element.filters).toEqual(["mine"]);
    expect(element.shadowRoot?.activeElement).toBe(chip);
    expect(chip.dataset.selected).toBe("true");

    chip.click();
    expect(element.filters).toEqual([]);
    expect(element.shadowRoot?.activeElement).toBe(chip);
    expect(chip.dataset.selected).toBe("false");
  });

  it("preserves search focus across unrelated attribute updates", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    element.filterOptions = [{ label: "Mine", value: "mine" }];
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    input.focus();
    input.value = "docs";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    element.filters = ["mine"];
    element.label = "Search filters";

    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.value).toBe("docs");
  });

  it("includes brand focus-visible and interactive states for controls", () => {
    const element = document.createElement("box-filter-bar") as BoxFilterBarElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="input"]:focus-visible');
    expect(styles).toContain('[part="filter-chip"]:hover:not(:disabled)');
    expect(styles).toContain('[part="select"]:active:not(:disabled)');
    expect(styles).toContain('[part="filter-chip"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
