// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDraggableListElement,
  defineBoxDraggableListElement,
} from "../../../src/components/collections/draggable-list.js";

const sampleItems = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie" },
];

const createList = (): BoxDraggableListElement => {
  const element = document.createElement("box-draggable-list") as BoxDraggableListElement;
  element.items = sampleItems;
  document.body.append(element);
  return element;
};

const handleFor = (element: BoxDraggableListElement, value: string): HTMLButtonElement =>
  element.shadowRoot?.querySelector(`[part="item"][data-value="${value}"] [part="handle"]`) as HTMLButtonElement;

const order = (element: BoxDraggableListElement): string[] =>
  Array.from(element.shadowRoot?.querySelectorAll('[part="item"]') ?? []).map(
    node => (node as HTMLElement).dataset.value ?? "",
  );

describe("BoxDraggableListElement", () => {
  beforeEach(() => {
    defineBoxDraggableListElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled list with one row per item", () => {
    const element = createList();

    const list = element.shadowRoot?.querySelector('[part="list"]');
    expect(list?.getAttribute("aria-label")).toBe("Reorderable list");
    expect(order(element)).toEqual(["a", "b", "c"]);
  });

  it("renders an empty state when there are no items", () => {
    const element = document.createElement("box-draggable-list") as BoxDraggableListElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="list"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No items loaded");
  });

  it("moves an item down with ArrowDown and emits reorder", () => {
    const element = createList();
    const onReorder = vi.fn();
    element.addEventListener("reorder", onReorder);

    handleFor(element, "a").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(order(element)).toEqual(["b", "a", "c"]);
    expect(element.items.map(item => item.value)).toEqual(["b", "a", "c"]);
    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expect.objectContaining({ value: "a", from: 0, to: 1 }) }),
    );
  });

  it("moves an item up with ArrowUp", () => {
    const element = createList();

    handleFor(element, "c").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(order(element)).toEqual(["a", "c", "b"]);
  });

  it("jumps to the ends with Home and End", () => {
    const element = createList();

    handleFor(element, "b").dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(order(element)).toEqual(["b", "a", "c"]);

    handleFor(element, "b").dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(order(element)).toEqual(["a", "c", "b"]);
  });

  it("does not move or emit past the list bounds", () => {
    const element = createList();
    const onReorder = vi.fn();
    element.addEventListener("reorder", onReorder);

    // First item cannot move up.
    handleFor(element, "a").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(order(element)).toEqual(["a", "b", "c"]);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("keeps keyboard focus on the moved item's handle", () => {
    const element = createList();

    handleFor(element, "a").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    const active = element.shadowRoot?.activeElement?.closest('[part="item"]') as HTMLElement | null;
    expect(active?.dataset.value).toBe("a");
  });

  it("does not re-steal focus when label changes after a reorder", () => {
    const element = createList();

    handleFor(element, "a").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const moved = element.shadowRoot?.activeElement?.closest('[part="item"]') as HTMLElement | null;
    expect(moved?.dataset.value).toBe("a");

    const otherHandle = handleFor(element, "b");
    otherHandle.focus();
    expect(element.shadowRoot?.activeElement).toBe(otherHandle);

    element.label = "Updated list";

    expect(element.shadowRoot?.activeElement).toBe(otherHandle);
  });

  it("includes focus-visible and hover styles for handles", () => {
    const element = createList();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="handle"]:focus-visible');
    expect(styles).toContain('[part="handle"]:hover:not(:disabled)');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
