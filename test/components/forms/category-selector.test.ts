// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxCategorySelectorElement,
  defineBoxCategorySelectorElement,
} from "../../../src/components/forms/category-selector.js";

const sampleOptions = [
  { value: "all", label: "All" },
  { value: "docs", label: "Documents" },
  { value: "media", label: "Media" },
  { value: "archived", label: "Archived", disabled: true },
];

const createSelector = (value = ""): BoxCategorySelectorElement => {
  const element = document.createElement("box-category-selector") as BoxCategorySelectorElement;
  element.options = sampleOptions;
  if (value) {
    element.value = value;
  }
  document.body.append(element);
  return element;
};

const pillFor = (element: BoxCategorySelectorElement, value: string): HTMLButtonElement =>
  element.shadowRoot?.querySelector(`[part~="pill"][data-value="${value}"]`) as HTMLButtonElement;

describe("BoxCategorySelectorElement", () => {
  beforeEach(() => {
    defineBoxCategorySelectorElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled radiogroup of category pills", () => {
    const element = createSelector();

    const group = element.shadowRoot?.querySelector('[part="group"]');
    expect(group?.getAttribute("role")).toBe("radiogroup");
    expect(group?.getAttribute("aria-label")).toBe("Categories");
    expect(element.shadowRoot?.querySelectorAll('[part~="pill"]').length).toBe(4);
    expect(pillFor(element, "archived").disabled).toBe(true);
  });

  it("selects on click and emits value-changed with aria-checked", () => {
    const element = createSelector();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    pillFor(element, "docs").click();

    expect(element.value).toBe("docs");
    expect(pillFor(element, "docs").getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "docs" } }));
  });

  it("does not re-emit when the active category is clicked again", () => {
    const element = createSelector("docs");
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    pillFor(element, "docs").click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves selection with arrow keys and keeps focus on the checked pill", () => {
    const element = createSelector("all");

    pillFor(element, "all").focus();
    pillFor(element, "all").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("docs");
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("docs");

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(element.value).toBe("all");
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("all");
  });

  it("makes only the checked pill tabbable via roving tabindex", () => {
    const element = createSelector("media");

    expect(pillFor(element, "media").getAttribute("tabindex")).toBe("0");
    expect(pillFor(element, "all").getAttribute("tabindex")).toBe("-1");
    expect(pillFor(element, "docs").getAttribute("tabindex")).toBe("-1");
  });

  it("renders an empty affordance with no options", () => {
    const element = document.createElement("box-category-selector") as BoxCategorySelectorElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="group"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No categories");
  });

  it("collapses options beyond max-links into a More menu", () => {
    const element = document.createElement("box-category-selector") as BoxCategorySelectorElement;
    element.options = [
      { value: "all", label: "All" },
      { value: "docs", label: "Documents" },
      { value: "media", label: "Media" },
      { value: "images", label: "Images" },
      { value: "audio", label: "Audio" },
    ];
    element.maxLinks = 2;
    document.body.append(element);

    // Only the first 2 categories render inline as radio pills.
    const inlinePills = element.shadowRoot?.querySelectorAll('[part~="pill"]:not([data-more])');
    expect(inlinePills?.length).toBe(2);

    const more = element.shadowRoot?.querySelector('[data-more]') as HTMLButtonElement;
    expect(more).toBeTruthy();
    const menu = element.shadowRoot?.querySelector('[part="more-menu"]') as HTMLElement;
    expect(menu.hidden).toBe(true);
    // The overflow (3 remaining) lives in the menu.
    expect(menu.querySelectorAll('[part="more-item"]').length).toBe(3);

    // Opening the menu positions it and exposes the items.
    more.click();
    expect(menu.hidden).toBe(false);
    expect(more.getAttribute("aria-expanded")).toBe("true");

    // Selecting an overflow item commits the value and marks More active.
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);
    (menu.querySelector('[part="more-item"][data-value="audio"]') as HTMLButtonElement).click();

    expect(element.value).toBe("audio");
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "audio" } }));
    expect(menu.hidden).toBe(true);
    expect(more.getAttribute("part")).toContain("pill-checked");
    expect(more.textContent).toContain("Audio");
  });
});
