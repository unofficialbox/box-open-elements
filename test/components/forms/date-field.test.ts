// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxDateFieldElement, defineBoxDateFieldElement } from "../../../src/components/forms/date-field.js";

describe("BoxDateFieldElement", () => {
  beforeEach(() => {
    defineBoxDateFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes when the date changes", () => {
    const element = document.createElement("box-date-field") as BoxDateFieldElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "2026-04-03";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "2026-04-03" },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-date-field") as BoxDateFieldElement;
    element.label = "Date";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Start date";

    expect(document.activeElement).toBe(element);
  });

  it("shows a clear button only when clearable with a value, and clears on click", () => {
    const element = document.createElement("box-date-field") as BoxDateFieldElement;
    element.clearable = true;
    element.value = "2026-07-21";
    document.body.append(element);

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLElement;
    const clear = element.shadowRoot?.querySelector('[part="clear"]') as HTMLButtonElement;
    expect(control.dataset.clearable).toBe("true");

    const changed = vi.fn();
    element.addEventListener("value-changed", changed);
    clear.click();

    expect(element.value).toBe("");
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "" } }));
    // With no value the clear affordance hides again.
    expect(control.dataset.clearable).toBe("false");
  });

  it("does not show the clear button when not clearable", () => {
    const element = document.createElement("box-date-field") as BoxDateFieldElement;
    element.value = "2026-07-21";
    document.body.append(element);

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLElement;
    expect(control.dataset.clearable).toBe("false");
  });
});
