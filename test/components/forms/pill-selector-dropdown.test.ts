// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxPillSelectorDropdownElement,
  defineBoxPillSelectorDropdownElement,
} from "../../../src/components/forms/pill-selector-dropdown.js";

const sampleOptions = [
  { value: "morgan", label: "Morgan Lee" },
  { value: "alex", label: "Alex Kim" },
  { value: "sam", label: "Sam Patel" },
];

const createSelector = (value: string[] = []): BoxPillSelectorDropdownElement => {
  const element = document.createElement("box-pill-selector-dropdown") as BoxPillSelectorDropdownElement;
  element.options = sampleOptions;
  element.value = value;
  document.body.append(element);
  return element;
};

const trigger = (element: BoxPillSelectorDropdownElement): HTMLButtonElement =>
  element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;

describe("BoxPillSelectorDropdownElement", () => {
  beforeEach(() => {
    defineBoxPillSelectorDropdownElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders preset selection as removable pills", () => {
    const element = createSelector(["morgan"]);

    const pills = element.shadowRoot?.querySelectorAll('[part="pill"]');
    expect(pills?.length).toBe(1);
    expect(pills?.[0].querySelector('[part="pill-label"]')?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.querySelector('[part="pill-remove"]')).toBeTruthy();
  });

  it("opens the menu from the trigger and lists only unselected options", () => {
    const element = createSelector(["morgan"]);

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
    expect(trigger(element).getAttribute("aria-expanded")).toBe("false");

    trigger(element).click();

    const menu = element.shadowRoot?.querySelector('[part="menu"]');
    expect(menu?.getAttribute("role")).toBe("listbox");
    expect(trigger(element).getAttribute("aria-expanded")).toBe("true");
    const optionValues = Array.from(element.shadowRoot?.querySelectorAll('[part="option"]') ?? []).map(
      node => (node as HTMLElement).dataset.value,
    );
    expect(optionValues).toEqual(["alex", "sam"]);
  });

  it("adds an option from the menu and emits value-changed", () => {
    const element = createSelector();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    trigger(element).click();
    (element.shadowRoot?.querySelector('[part="option"][data-value="alex"]') as HTMLButtonElement).click();

    expect(element.value).toEqual(["alex"]);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { value: ["alex"] } }));
    // The added option leaves the available list.
    expect(element.shadowRoot?.querySelector('[part="option"][data-value="alex"]')).toBeNull();
  });

  it("removes a pill and emits value-changed", () => {
    const element = createSelector(["morgan", "alex"]);
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    (element.shadowRoot?.querySelector('[part="pill-remove"][data-value="morgan"]') as HTMLButtonElement).click();

    expect(element.value).toEqual(["alex"]);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { value: ["alex"] } }));
  });

  it("shows a no-more-options affordance when all are selected", () => {
    const element = createSelector(["morgan", "alex", "sam"]);

    trigger(element).click();
    expect(element.shadowRoot?.querySelector('[part="option"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="option-empty"]')?.textContent).toContain("No more options");
  });
});
