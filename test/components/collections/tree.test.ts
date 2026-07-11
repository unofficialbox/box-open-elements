// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTreeElement, defineBoxTreeElement } from "../../../src/components/collections/tree.js";

describe("BoxTreeElement", () => {
  beforeEach(() => {
    defineBoxTreeElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nested items and expands top-level groups by default", () => {
    const element = document.createElement("box-tree") as BoxTreeElement;
    element.items = [
      {
        label: "Navigation",
        children: [{ label: "Breadcrumbs", value: "breadcrumbs" }],
      },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Navigation");
    expect(element.shadowRoot?.textContent).toContain("Breadcrumbs");
  });

  it("emits value changes for leaf selections", () => {
    const element = document.createElement("box-tree") as BoxTreeElement;
    const changed = vi.fn();
    element.items = [
      {
        label: "Navigation",
        children: [{ label: "Breadcrumbs", value: "breadcrumbs" }],
      },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const leaf = element.shadowRoot?.querySelector('[part~="item"][data-value="breadcrumbs"]') as HTMLButtonElement | null;
    leaf?.click();

    expect(element.value).toBe("breadcrumbs");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "breadcrumbs" },
      }),
    );
  });

  it("uses tree semantics and supports keyboard navigation", async () => {
    const element = document.createElement("box-tree") as BoxTreeElement;
    element.items = [
      {
        label: "Navigation",
        children: [
          { label: "Breadcrumbs", value: "breadcrumbs" },
          { label: "Toolbar", value: "toolbar" },
        ],
      },
    ];

    document.body.append(element);

    const firstLeaf = element.shadowRoot?.querySelector('[part~="item"][data-value="breadcrumbs"]') as HTMLButtonElement | null;
    expect(firstLeaf?.getAttribute("role")).toBe("treeitem");

    firstLeaf?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Promise.resolve();

    const focused = element.shadowRoot?.activeElement as HTMLButtonElement | null;
    expect(focused?.dataset.value).toBe("toolbar");
  });

  it("keeps selected and expanded tokenized parts queryable", () => {
    const element = document.createElement("box-tree") as BoxTreeElement;
    element.items = [
      {
        label: "Navigation",
        value: "navigation",
        children: [{ label: "Breadcrumbs", value: "breadcrumbs" }],
      },
    ];
    element.value = "navigation";

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part~="toggle-expanded"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part~="item-selected"][data-value="navigation"]')).toBeTruthy();
  });

  it("supports expand-all and collapse-all controls", () => {
    const element = document.createElement("box-tree") as BoxTreeElement;
    element.items = [
      {
        label: "Navigation",
        value: "navigation",
        children: [
          {
            label: "Collections",
            value: "collections",
            children: [{ label: "Tree", value: "tree" }],
          },
        ],
      },
    ];

    document.body.append(element);

    const collapseAll = element.shadowRoot?.querySelector(
      '[part~="control-collapse-all"]',
    ) as HTMLButtonElement | null;
    collapseAll?.click();

    expect(element.shadowRoot?.querySelector('[part~="item"][data-value="tree"]')).toBeFalsy();

    const expandAll = element.shadowRoot?.querySelector(
      '[part~="control-expand-all"]',
    ) as HTMLButtonElement | null;
    expandAll?.click();

    expect(element.shadowRoot?.querySelector('[part~="item"][data-value="tree"]')).toBeTruthy();
  });
});
