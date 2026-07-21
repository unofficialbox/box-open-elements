// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTableElement, defineBoxTableElement } from "../../../src/components/collections/table.js";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "owner", label: "Owner" },
];
const ROWS = [
  { id: "1", cells: { name: "A.pdf", owner: "Morgan" } },
  { id: "2", cells: { name: "B.pdf", owner: "Alex" } },
  { id: "3", cells: { name: "C.pdf", owner: "Sam" } },
  { id: "4", cells: { name: "D.pdf", owner: "Kai" } },
];

const create = (mode = "multiple"): BoxTableElement => {
  const el = document.createElement("box-table") as BoxTableElement;
  el.columns = COLUMNS as never;
  el.rows = ROWS as never;
  el.selectionMode = mode as never;
  document.body.append(el);
  return el;
};

const rowAt = (el: BoxTableElement, i: number): HTMLElement =>
  el.shadowRoot?.querySelectorAll('[part="row"]')[i] as HTMLElement;

describe("BoxTableElement", () => {
  beforeEach(() => {
    defineBoxTableElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders headers and a row per item", () => {
    const el = create("none");
    expect(el.shadowRoot?.querySelectorAll("thead th").length).toBe(2);
    expect(el.shadowRoot?.querySelectorAll('[part="row"]').length).toBe(4);
    expect(el.shadowRoot?.querySelector('[part="table"]')?.getAttribute("role")).toBe("table");
  });

  it("uses grid semantics when selectable", () => {
    const el = create("multiple");
    expect(el.shadowRoot?.querySelector('[part="table"]')?.getAttribute("role")).toBe("grid");
    expect(rowAt(el, 0).getAttribute("tabindex")).toBe("0");
  });

  it("selects a single row on click in single mode", () => {
    const el = create("single");
    const changed = vi.fn();
    el.addEventListener("selection-changed", changed);
    rowAt(el, 1).click();
    expect(el.selectedIds).toEqual(["2"]);
    rowAt(el, 2).click();
    expect(el.selectedIds).toEqual(["3"]); // single replaces
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("toggles with Ctrl/Cmd-click in multiple mode", () => {
    const el = create("multiple");
    rowAt(el, 0).dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    rowAt(el, 2).dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect(new Set(el.selectedIds)).toEqual(new Set(["1", "3"]));
    rowAt(el, 0).dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    expect(el.selectedIds).toEqual(["3"]);
  });

  it("selects a range with Shift-click", () => {
    const el = create("multiple");
    rowAt(el, 1).click(); // anchor at index 1
    rowAt(el, 3).dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect(new Set(el.selectedIds)).toEqual(new Set(["2", "3", "4"]));
  });

  it("selects all with Ctrl/Cmd+A and clears with Escape", () => {
    const el = create("multiple");
    const body = el.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    rowAt(el, 0).focus();
    body.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }));
    expect(el.selectedIds.length).toBe(4);
    body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(el.selectedIds.length).toBe(0);
  });

  it("emits sort on a sortable header click", () => {
    const el = create("none");
    const sorted = vi.fn();
    el.addEventListener("sort", sorted);
    (el.shadowRoot?.querySelector('th[part="sortable"]') as HTMLElement).click();
    expect(sorted).toHaveBeenCalledTimes(1);
    expect(sorted.mock.calls[0][0].detail).toEqual({ key: "name", direction: "ascending" });
  });

  it("does not select when selection-mode is none", () => {
    const el = create("none");
    const changed = vi.fn();
    el.addEventListener("selection-changed", changed);
    rowAt(el, 0).click();
    expect(changed).not.toHaveBeenCalled();
  });
});
