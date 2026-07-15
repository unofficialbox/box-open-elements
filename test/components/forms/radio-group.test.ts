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

  it("retains focus on the internal input when attributes or properties change", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    element.value = "single";
    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    const firstInput = inputs[0] as HTMLInputElement;

    // Focus the internal input
    firstInput.focus();
    expect(element.shadowRoot?.activeElement).toBe(firstInput);

    // Change attributes/properties (should patch in-place)
    element.value = "multiple";
    element.label = "Select one option";

    // Check that values updated in DOM
    const secondInput = inputs[1] as HTMLInputElement;
    expect(firstInput.checked).toBe(false);
    expect(secondInput.checked).toBe(true);

    const legend = element.shadowRoot?.querySelector('[part="label"]');
    expect(legend?.textContent).toBe("Select one option");

    // Assert focus is still on the active shadow root element and not lost to the body
    expect(element.shadowRoot?.activeElement).toBe(firstInput);
  });
});
