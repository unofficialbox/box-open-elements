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
