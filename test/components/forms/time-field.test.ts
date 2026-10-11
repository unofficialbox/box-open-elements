// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TimeField } from "../../../src/components/forms/time-field.js";

describe("TimeField", () => {
  beforeEach(() => {
    TimeField.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reactively connects label, description, required and error state without replacing a focused input", () => {
    const element = document.createElement("box-time-field") as TimeField;
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

  it("emits value changes when the time changes", () => {
    const element = document.createElement("box-time-field") as TimeField;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "14:30";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "14:30" },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-time-field") as TimeField;
    element.label = "Time";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Start time";

    expect(document.activeElement).toBe(element);
  });

  it("parses 12h and 24h strings to canonical HH:MM", () => {
    expect(TimeField.parseTime("1:30 PM")).toBe("13:30");
    expect(TimeField.parseTime("12:00 am")).toBe("00:00");
    expect(TimeField.parseTime("12 pm")).toBe("12:00");
    expect(TimeField.parseTime("9 am")).toBe("09:00");
    expect(TimeField.parseTime("13:45")).toBe("13:45");
    expect(TimeField.parseTime("")).toBe("");
    expect(TimeField.parseTime("25:00")).toBeNull();
    expect(TimeField.parseTime("half past two")).toBeNull();
  });

  it("setTimeString applies a valid time and emits parse-error on failure", () => {
    const element = document.createElement("box-time-field") as TimeField;
    document.body.append(element);

    const changed = vi.fn();
    const errored = vi.fn();
    element.addEventListener("value-changed", changed);
    element.addEventListener("parse-error", errored);

    expect(element.setTimeString("3:15 pm")).toBe(true);
    expect(element.value).toBe("15:15");
    expect(changed).toHaveBeenCalledTimes(1);

    expect(element.setTimeString("nope")).toBe(false);
    expect(element.value).toBe("15:15");
    expect(errored).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "nope" } }));
  });
});
