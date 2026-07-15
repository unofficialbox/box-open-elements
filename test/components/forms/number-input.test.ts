// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxNumberInputElement, defineBoxNumberInputElement } from "../../../src/components/forms/number-input.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxNumberInputElement", () => {
  beforeEach(() => {
    defineBoxNumberInputElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits numeric value changes while typing", () => {
    const element = document.createElement("box-number-input") as BoxNumberInputElement;
    const changed = vi.fn();
    element.label = "Version";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "7";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 7 },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-number-input") as BoxNumberInputElement;
    element.label = "Version";
    element.value = 3;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();
    // Mid-edit value that has not been committed yet.
    input!.value = "99";

    element.label = "Build";

    expect(document.activeElement).toBe(element);
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input?.value).toBe("99");
  });

  it("clamps values to min and max bounds", () => {
    const element = document.createElement("box-number-input") as BoxNumberInputElement;
    element.min = 0;
    element.max = 10;
    document.body.append(element);

    element.value = 99;
    expect(element.value).toBe(10);
    expect(getMirroredFormValue(element.internals)).toBe("10");

    element.value = -5;
    expect(element.value).toBe(0);
    expect(getMirroredFormValue(element.internals)).toBe("0");
  });

  it("clamps user input to min and max bounds", () => {
    const element = document.createElement("box-number-input") as BoxNumberInputElement;
    element.min = 1;
    element.max = 5;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "9";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.value).toBe(5);
    expect(getMirroredFormValue(element.internals)).toBe("5");
  });
});
