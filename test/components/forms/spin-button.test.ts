// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSpinButtonElement, defineBoxSpinButtonElement } from "../../../src/components/forms/spin-button.js";

describe("BoxSpinButtonElement", () => {
  beforeEach(() => {
    defineBoxSpinButtonElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("increments and decrements while emitting value changes", () => {
    const element = document.createElement("box-spin-button") as BoxSpinButtonElement;
    const changed = vi.fn();
    element.value = 4;
    element.step = 2;
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const increment = element.shadowRoot?.querySelector('[part="increment"]') as HTMLButtonElement | null;
    increment?.click();

    expect(element.value).toBe(6);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 6 },
      }),
    );
  });

  it("supports keyboard stepping and spinbutton aria attributes", () => {
    const element = document.createElement("box-spin-button") as BoxSpinButtonElement;
    element.min = 0;
    element.max = 10;
    element.value = 4;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(element.value).toBe(5);
    expect(input?.getAttribute("role")).toBe("spinbutton");
    expect(input?.getAttribute("aria-valuenow")).toBe("5");
    expect(input?.getAttribute("aria-valuemin")).toBe("0");
    expect(input?.getAttribute("aria-valuemax")).toBe("10");
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-spin-button") as BoxSpinButtonElement;
    element.label = "Quantity";
    element.value = 4;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();
    input!.value = "77";

    element.label = "Count";

    expect(document.activeElement).toBe(element);
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input?.value).toBe("77");
  });
});
