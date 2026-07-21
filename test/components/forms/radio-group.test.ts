// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxRadioGroupElement, defineBoxRadioGroupElement } from "../../../src/components/forms/radio-group.js";
import { FORM_ERROR_MESSAGE_ID, getMirroredFormValue } from "../../../src/core/index.js";

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
    expect(element.shadowRoot?.querySelectorAll('[part~="option"]')).toHaveLength(2);
    expect(element.shadowRoot?.querySelector('[part~="option-selected"] input')).toBe(secondInput);

    const legend = element.shadowRoot?.querySelector('[part="label"]');
    expect(legend?.textContent).toBe("Select one option");

    // Assert focus is still on the active shadow root element and not lost to the body
    expect(element.shadowRoot?.activeElement).toBe(firstInput);
  });

  it("omits form value when unselected or stale, but keeps an explicit empty option", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.name = "choice";
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    document.body.append(element);

    expect(getMirroredFormValue(element.internals)).toBe(null);

    element.value = "missing";
    expect(getMirroredFormValue(element.internals)).toBe(null);

    element.options = [
      { label: "None", value: "" },
      { label: "Single", value: "single" },
    ];
    element.value = "";
    expect(getMirroredFormValue(element.internals)).toBe("");

    element.value = "single";
    expect(getMirroredFormValue(element.internals)).toBe("single");
  });

  it("propagates invalid ARIA state to every radio option", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    element.invalid = true;
    element.errorMessage = "Pick one";
    document.body.append(element);

    const inputs = Array.from(
      element.shadowRoot?.querySelectorAll('[part="input"]') ?? [],
    ) as HTMLInputElement[];
    expect(inputs).toHaveLength(2);

    const second = inputs[1]!;
    second.focus();
    expect(element.shadowRoot?.activeElement).toBe(second);

    for (const input of inputs) {
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-errormessage")).toBe(FORM_ERROR_MESSAGE_ID);
    }

    const error = element.shadowRoot?.querySelector('[part="error-message"]');
    expect(error?.textContent).toBe("Pick one");
    expect((error as HTMLElement | null)?.hidden).toBe(false);
  });

  it("mirrors form value when a radio change is dispatched", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.name = "choice";
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    const second = inputs[1] as HTMLInputElement;
    second.checked = true;
    second.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toBe("multiple");
    expect(getMirroredFormValue(element.internals)).toBe("multiple");
  });

  it("restores form value via formStateRestoreCallback", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    element.value = "single";
    document.body.append(element);

    element.formStateRestoreCallback("multiple");

    expect(element.value).toBe("multiple");
    expect(getMirroredFormValue(element.internals)).toBe("multiple");
    const inputs = Array.from(
      element.shadowRoot?.querySelectorAll('[part="input"]') ?? [],
    ) as HTMLInputElement[];
    expect(inputs[0]?.checked).toBe(false);
    expect(inputs[1]?.checked).toBe(true);
  });

  it("updates every internal radio name when host name changes after render", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.name = "before";
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    document.body.append(element);

    element.name = "after";

    const inputs = Array.from(
      element.shadowRoot?.querySelectorAll('[part="input"]') ?? [],
    ) as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    expect(inputs.every(input => input.name === "after")).toBe(true);
  });

  it("includes focus-within, hover, active, and disabled option styles", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part~="option"]:focus-within');
    expect(styles).toContain('[part~="option-selected"]');
    expect(styles).toContain("padding: 0.4rem 0.55rem;");
    expect(styles).toContain("border-radius: 12px;");
    expect(styles).toContain("--boe-token-surface-surface-brand");
    expect(styles).toContain('[part~="option"]:hover:not(:has([part="input"]:disabled))');
    expect(styles).toContain('[part~="option"]:active:not(:has([part="input"]:disabled))');
    expect(styles).toContain('[part~="option"]:has([part="input"]:disabled)');
    expect(styles).toContain("cursor: not-allowed");
    expect(styles).toContain("opacity: 0.55");
  });

  it("renders per-option descriptions and disables individual options", () => {
    const element = document.createElement("box-radio-group") as BoxRadioGroupElement;
    element.options = [
      { label: "Viewer", value: "viewer", description: "Can view and download." },
      { label: "Co-owner", value: "coowner", description: "Full control.", disabled: true },
    ];
    document.body.append(element);

    const options = element.shadowRoot?.querySelectorAll('[part~="option"]');
    const viewer = options?.[0] as HTMLElement;
    const coowner = options?.[1] as HTMLElement;

    expect(viewer.querySelector('[part="option-description"]')?.textContent).toContain("download");
    expect(viewer.dataset.hasDescription).toBe("true");

    const viewerInput = viewer.querySelector('[part="input"]') as HTMLInputElement;
    const coownerInput = coowner.querySelector('[part="input"]') as HTMLInputElement;
    expect(viewerInput.disabled).toBe(false);
    // The individually disabled option is inert even though the group is enabled.
    expect(coownerInput.disabled).toBe(true);
  });
});
