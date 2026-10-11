// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateField } from "../../../src/components/forms/date-field.js";

describe("DateField", () => {
  beforeEach(() => {
    DateField.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reactively connects label, description, required and error state without replacing a focused input", () => {
    const element = document.createElement("box-date-field") as DateField;
    element.label = "Schedule time";
    element.description = "Choose the local time";
    element.required = true;
    element.invalid = true;
    element.errorMessage = "Outside the allowed range";
    document.body.append(element);
    const input = element.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement;
    const label = element.shadowRoot!.querySelector('[part="label"]') as HTMLElement;
    const description = element.shadowRoot!.querySelector('[part="description"]') as HTMLElement;
    const error = element.shadowRoot!.querySelector('[part="error-message"]') as HTMLElement;
    expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(description.textContent).toBe("Choose the local time");
    expect(description.hidden).toBe(false);
    expect(input.required).toBe(true);
    expect(label.querySelector(".boe-required-mark")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-errormessage")).toBe(error.id);
    expect(error.hidden).toBe(false);
    input.focus();
    element.label = "Updated label";
    element.description = "";
    element.required = false;
    element.invalid = false;
    element.hideLabel = true;
    expect(element.shadowRoot!.querySelector('[part="input"]')).toBe(input);
    expect(element.shadowRoot!.activeElement).toBe(input);
    expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    expect(description.hidden).toBe(true);
    expect(input.required).toBe(false);
    expect(label.querySelector(".boe-required-mark")).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.hasAttribute("aria-errormessage")).toBe(false);
    expect(error.hidden).toBe(true);
  });

  it("emits value changes when the date changes", () => {
    const element = document.createElement("box-date-field") as DateField;
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
    const element = document.createElement("box-date-field") as DateField;
    element.label = "Date";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Start date";

    expect(document.activeElement).toBe(element);
  });

  it("shows a clear button only when clearable with a value, and clears on click", () => {
    const element = document.createElement("box-date-field") as DateField;
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
    const element = document.createElement("box-date-field") as DateField;
    element.value = "2026-07-21";
    document.body.append(element);

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLElement;
    expect(control.dataset.clearable).toBe("false");
  });
});
