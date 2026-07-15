// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxGridViewElement, defineBoxGridViewElement } from "../../../src/components/collections/grid-view.js";

const sampleItems = [
  { value: "1", label: "Quarterly Plan.pdf", meta: "2.1 MB" },
  { value: "2", label: "Brand Guidelines.pdf", meta: "5.4 MB" },
  { value: "3", label: "Launch", icon: "L" },
];

const createGridView = (): BoxGridViewElement => {
  const element = document.createElement("box-grid-view") as BoxGridViewElement;
  element.items = sampleItems;
  document.body.append(element);
  return element;
};

describe("BoxGridViewElement", () => {
  beforeEach(() => {
    defineBoxGridViewElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled listbox with one tile per item", () => {
    const element = createGridView();

    const grid = element.shadowRoot?.querySelector('[part="grid"]');
    expect(grid?.getAttribute("role")).toBe("listbox");
    expect(grid?.getAttribute("aria-label")).toBe("Items");

    const tiles = element.shadowRoot?.querySelectorAll('[part~="tile"]');
    expect(tiles?.length).toBe(3);
    expect(tiles?.[0].querySelector('[part="tile-label"]')?.textContent).toContain("Quarterly Plan.pdf");
    expect(tiles?.[0].querySelector('[part="meta"]')?.textContent).toContain("2.1 MB");
  });

  it("renders an empty state when there are no items", () => {
    const element = document.createElement("box-grid-view") as BoxGridViewElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="grid"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No items loaded");
  });

  it("makes exactly one tile tabbable via roving tabindex", () => {
    const element = createGridView();

    const tabbable = element.shadowRoot?.querySelectorAll('[part~="tile"][tabindex="0"]');
    expect(tabbable?.length).toBe(1);
    expect((tabbable?.[0] as HTMLElement).dataset.value).toBe("1");
  });

  it("selects a tile on click and emits value-changed", () => {
    const element = createGridView();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    const secondTile = element.shadowRoot?.querySelectorAll('[part~="tile"]')[1] as HTMLButtonElement;
    secondTile.click();

    expect(element.value).toBe("2");
    expect(
      element.shadowRoot?.querySelector('[part~="tile"][data-value="2"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "2" } }));
  });

  it("does not re-emit value-changed when the same tile is clicked again", () => {
    const element = createGridView();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    const tile = element.shadowRoot?.querySelector('[part~="tile"][data-value="1"]') as HTMLButtonElement;
    tile.click();
    tile.click();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("moves roving focus with arrow keys and jumps with Home/End", () => {
    const element = createGridView();

    const firstTile = element.shadowRoot?.querySelector('[part~="tile"][data-value="1"]') as HTMLButtonElement;
    firstTile.focus();
    firstTile.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("2");

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("3");

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("1");
  });

  it("selects the focused tile on Enter", () => {
    const element = createGridView();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    const tile = element.shadowRoot?.querySelector('[part~="tile"][data-value="3"]') as HTMLButtonElement;
    tile.focus();
    tile.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(element.value).toBe("3");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "3" } }));
  });

  it("includes focus-visible and interactive styles for tiles", () => {
    const element = createGridView();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part~="tile"]:focus-visible');
    expect(styles).toContain('[part~="tile"]:hover:not(:disabled)');
    expect(styles).toContain('[part~="tile"]:active:not(:disabled)');
    expect(styles).toContain('[part~="tile"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-hover");
  });
});
