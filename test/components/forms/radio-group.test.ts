// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxRadioGroupElement, defineBoxRadioGroupElement } from "../../../src/components/forms/radio-group.js";

describe("BoxRadioGroupElement", () => {
  beforeEach(() => {
    defineBoxRadioGroupElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes when a new option is selected", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    const changed = vi.fn();
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    element.value = "single";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    const secondInput = inputs[1] as HTMLInputElement | undefined;
    secondInput!.checked = true;
    secondInput?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toBe("multiple");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "multiple" },
      }),
    );
  });

  it("forwards disabled state to radio inputs", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    element.disabled = true;

    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];

    expect(Array.from(inputs).every(node => (node as HTMLInputElement).disabled)).toBe(true);
  });
});
