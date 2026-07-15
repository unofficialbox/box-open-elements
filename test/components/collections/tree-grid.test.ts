// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxTreeGridElement,
  defineBoxTreeGridElement,
} from "../../../src/components/collections/tree-grid.js";

describe("BoxTreeGridElement", () => {
  beforeEach(() => {
    defineBoxTreeGridElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nested rows and columns", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
    ];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        cells: ["Folder", "Active"],
        children: [{ label: "Brand Guide.pdf", value: "brand-guide", cells: ["File", "Review"] }],
      },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Marketing");
    expect(element.shadowRoot?.textContent).toContain("Brand Guide.pdf");
    expect(element.shadowRoot?.textContent).toContain("Folder");
  });

  it("emits value changes when a row is selected", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    const changed = vi.fn();
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ];
    element.items = [{ label: "Marketing", value: "marketing", cells: ["Folder"] }];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part~="item"][data-value="marketing"]') as HTMLButtonElement | null;
    item?.click();

    expect(element.value).toBe("marketing");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "marketing" },
      }),
    );
  });

  it("uses treegrid semantics and supports keyboard navigation", async () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        cells: ["Folder"],
        children: [{ label: "Brand Guide.pdf", value: "brand-guide", cells: ["File"] }],
      },
    ];

    document.body.append(element);

    const parentItem = element.shadowRoot?.querySelector('[part~="item"][data-value="marketing"]') as HTMLButtonElement | null;
    expect(element.shadowRoot?.querySelector('[part="tree-grid"]')?.getAttribute("role")).toBe("treegrid");

    parentItem?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Promise.resolve();

    const focused = element.shadowRoot?.activeElement as HTMLButtonElement | null;
    expect(focused?.dataset.value).toBe("brand-guide");
  });

  it("keeps selected and expanded tokenized parts queryable", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        cells: ["Folder"],
        children: [{ label: "Brand Guide.pdf", value: "brand-guide", cells: ["File"] }],
      },
    ];
    element.value = "marketing";

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part~="toggle-expanded"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part~="item-selected"][data-value="marketing"]')).toBeTruthy();
  });

  it("supports expand-all and collapse-all controls", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        cells: ["Folder"],
        children: [
          {
            label: "Campaign Assets",
            value: "campaign-assets",
            cells: ["Folder"],
            children: [{ label: "Brand Guide.pdf", value: "brand-guide", cells: ["File"] }],
          },
        ],
      },
    ];

    document.body.append(element);

    const collapseAll = element.shadowRoot?.querySelector(
      '[part~="control-collapse-all"]',
    ) as HTMLButtonElement | null;
    collapseAll?.click();

    expect(element.shadowRoot?.querySelector('[part~="item"][data-value="brand-guide"]')).toBeFalsy();

    const expandAll = element.shadowRoot?.querySelector(
      '[part~="control-expand-all"]',
    ) as HTMLButtonElement | null;
    expandAll?.click();

    expect(element.shadowRoot?.querySelector('[part~="item"][data-value="brand-guide"]')).toBeTruthy();
  });

  it("applies grid column and depth custom properties", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        cells: ["Folder"],
        children: [{ label: "Brand Guide.pdf", value: "brand-guide", cells: ["File"] }],
      },
    ];

    document.body.append(element);

    const treeGrid = element.shadowRoot?.querySelector('[part="tree-grid"]') as HTMLElement | null;
    expect(treeGrid?.style.getPropertyValue("--tree-grid-columns")).toContain("minmax(260px, 1.5fr)");

    const childContent = element.shadowRoot?.querySelector(
      '[part="tree-content"][style*="--tree-grid-depth:1"]',
    );
    expect(childContent).toBeTruthy();
  });

  it("emits expand-changed when a branch is toggled", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    const expandChanged = vi.fn();
    element.columns = [{ key: "name", label: "Name" }];
    element.items = [
      {
        label: "Marketing",
        value: "marketing",
        children: [{ label: "Brand Guide.pdf", value: "brand-guide" }],
      },
    ];
    element.addEventListener("expand-changed", expandChanged);

    document.body.append(element);

    const toggle = element.shadowRoot?.querySelector('[part~="toggle"][data-value="marketing"]') as HTMLButtonElement | null;
    toggle?.click();

    expect(expandChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "marketing", expanded: false },
      }),
    );
  });

  it("exposes selected and hoverable row parts", () => {
    const element = document.createElement("box-tree-grid") as BoxTreeGridElement;
    element.columns = [{ key: "name", label: "Name" }];
    element.items = [{ label: "Marketing", value: "marketing", cells: ["Folder"] }];
    element.value = "marketing";

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part~="row-selected"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part~="item-selected"]')).toBeTruthy();
  });
});
