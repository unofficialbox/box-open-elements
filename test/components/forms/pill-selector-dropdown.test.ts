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
    expect(menu?.getAttribute("role")).toBe("menu");
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

  it("exposes menu semantics and focuses the first item on open", () => {
    const element = createSelector();

    trigger(element).click();

    expect(element.shadowRoot?.querySelector('[part="menu"]')?.getAttribute("role")).toBe("menu");
    const items = element.shadowRoot?.querySelectorAll('[part="option"][role="menuitem"]');
    expect(items?.length).toBe(3);
    // Opening moves focus into the menu, onto the first item.
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("morgan");
  });

  it("moves focus between menu items with arrow keys", () => {
    const element = createSelector();
    trigger(element).click();

    const first = element.shadowRoot?.activeElement as HTMLElement;
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("alex");

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("sam");

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("alex");
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const element = createSelector();
    trigger(element).click();
    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeTruthy();

    (element.shadowRoot?.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
    expect(trigger(element).getAttribute("aria-expanded")).toBe("false");
    expect((element.shadowRoot?.activeElement as HTMLElement)?.getAttribute("part")).toBe("trigger");
  });

  it("keeps the menu open after adding and advances focus to the next option", () => {
    const element = createSelector();
    trigger(element).click();

    (element.shadowRoot?.querySelector('[part="option"][data-value="morgan"]') as HTMLButtonElement).click();

    // Still open, morgan gone, focus on the next remaining option.
    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeTruthy();
    expect(element.value).toEqual(["morgan"]);
    expect((element.shadowRoot?.activeElement as HTMLElement)?.dataset.value).toBe("alex");
  });

  it("returns focus to the trigger after removing a pill", () => {
    const element = createSelector(["morgan", "alex"]);

    (element.shadowRoot?.querySelector('[part="pill-remove"][data-value="morgan"]') as HTMLButtonElement).click();

    expect(element.value).toEqual(["alex"]);
    expect((element.shadowRoot?.activeElement as HTMLElement)?.getAttribute("part")).toBe("trigger");
  });

  it("returns focus to the trigger when the menu is closed by clicking the trigger", () => {
    const element = createSelector();
    trigger(element).click();
    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeTruthy();

    trigger(element).click();

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
    expect((element.shadowRoot?.activeElement as HTMLElement)?.getAttribute("part")).toBe("trigger");
  });

  it("closes on Escape from the trigger when the last option was just added", () => {
    // Selecting the final option leaves the menu open with focus on the trigger.
    const element = createSelector(["morgan", "alex"]);
    trigger(element).click();
    (element.shadowRoot?.querySelector('[part="option"][data-value="sam"]') as HTMLButtonElement).click();

    expect(element.value).toEqual(["morgan", "alex", "sam"]);
    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeTruthy();
    expect((element.shadowRoot?.activeElement as HTMLElement)?.getAttribute("part")).toBe("trigger");

    trigger(element).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
    expect(trigger(element).getAttribute("aria-expanded")).toBe("false");
    expect((element.shadowRoot?.activeElement as HTMLElement)?.getAttribute("part")).toBe("trigger");
  });

  const makeCustom = (attrs: Record<string, string> = {}): BoxPillSelectorDropdownElement => {
    const el = document.createElement("box-pill-selector-dropdown") as BoxPillSelectorDropdownElement;
    el.setAttribute("allow-custom", "");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.append(el);
    return el;
  };

  const input = (el: BoxPillSelectorDropdownElement): HTMLInputElement =>
    el.shadowRoot?.querySelector('[part="custom-input"]') as HTMLInputElement;

  const typeAndKey = (el: BoxPillSelectorDropdownElement, text: string, key: string): void => {
    const i = input(el);
    i.value = text;
    i.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  };

  it("shows the text input only when allow-custom is set", () => {
    const el = makeCustom();
    expect(input(el).hidden).toBe(false);
  });

  it("creates a custom pill on Enter and clears the input", () => {
    const el = makeCustom();
    const changed = vi.fn();
    el.addEventListener("value-changed", changed);
    typeAndKey(el, "morgan@box.com", "Enter");
    expect(el.value).toEqual(["morgan@box.com"]);
    expect(input(el).value).toBe("");
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("creates a pill on comma", () => {
    const el = makeCustom();
    typeAndKey(el, "alex@box.com", ",");
    expect(el.value).toEqual(["alex@box.com"]);
  });

  it("validates against pattern and rejects invalid entries", () => {
    const el = makeCustom({ pattern: "[^@\\s]+@[^@\\s]+\\.[^@\\s]+" });
    const invalid = vi.fn();
    el.addEventListener("invalid-entry", invalid);
    typeAndKey(el, "not-an-email", "Enter");
    expect(el.value).toEqual([]);
    expect(invalid).toHaveBeenCalledTimes(1);
    expect(input(el).getAttribute("aria-invalid")).toBe("true");

    typeAndKey(el, "ok@box.com", "Enter");
    expect(el.value).toEqual(["ok@box.com"]);
  });

  it("splits a pasted list into multiple pills", () => {
    const el = makeCustom();
    const i = input(el);
    // jsdom lacks DataTransfer; stub the clipboardData the handler reads.
    const evt = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "clipboardData", {
      value: { getData: () => "a@box.com, b@box.com\nc@box.com" },
    });
    i.dispatchEvent(evt);
    expect(new Set(el.value)).toEqual(new Set(["a@box.com", "b@box.com", "c@box.com"]));
  });

  it("removes the last pill on Backspace in an empty input", () => {
    const el = makeCustom();
    el.value = ["a@box.com", "b@box.com"];
    typeAndKey(el, "", "Backspace");
    expect(el.value).toEqual(["a@box.com"]);
  });

});
