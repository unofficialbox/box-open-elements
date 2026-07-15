// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxRangeSliderElement, defineBoxRangeSliderElement } from "../../../src/components/forms/range-slider.js";
import { FORM_ERROR_MESSAGE_ID, formDataFromRange, getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxRangeSliderElement", () => {
  beforeEach(() => {
    defineBoxRangeSliderElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits both values when either thumb changes", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="range-start"]') as HTMLInputElement | null;
    input!.value = "32";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { start: 32, end: 80 },
      }),
    );
  });

  it("normalizes the range when thumbs cross", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    document.body.append(element);

    const endInput = element.shadowRoot?.querySelector('[part="range-end"]') as HTMLInputElement | null;
    endInput!.value = "10";
    endInput?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.start).toBe(10);
    expect(element.end).toBe(20);
  });

  it("mirrors start and end values as FormData entries", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    element.name = "budget";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="range-start"]') as HTMLInputElement | null;
    input!.value = "32";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    const formValue = getMirroredFormValue(element.internals);
    expect(formValue).toBeInstanceOf(FormData);
    expect((formValue as FormData).get("budget-start")).toBe("32");
    expect((formValue as FormData).get("budget-end")).toBe("80");
  });

  it("restores form value via formStateRestoreCallback with FormData", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    element.name = "budget";
    element.min = 0;
    element.max = 100;
    document.body.append(element);

    const restored = formDataFromRange("budget", 15, 45);
    element.formStateRestoreCallback(restored);

    expect(element.start).toBe(15);
    expect(element.end).toBe(45);
    const mirrored = getMirroredFormValue(element.internals);
    expect(mirrored).toBeInstanceOf(FormData);
    expect((mirrored as FormData).get("budget-start")).toBe("15");
    expect((mirrored as FormData).get("budget-end")).toBe("45");
  });

  it("clamps and orders restored range values", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    element.name = "budget";
    element.min = 0;
    element.max = 50;
    document.body.append(element);

    element.formStateRestoreCallback(formDataFromRange("budget", 60, 5));

    expect(element.start).toBe(5);
    expect(element.end).toBe(50);
  });

  it("propagates invalid ARIA state to both range thumbs", () => {
    const element = document.createElement("box-range-slider") as BoxRangeSliderElement;
    element.invalid = true;
    element.errorMessage = "Range is required";
    document.body.append(element);

    const startInput = element.shadowRoot?.querySelector('[part="range-start"]') as HTMLInputElement;
    const endInput = element.shadowRoot?.querySelector('[part="range-end"]') as HTMLInputElement;

    for (const input of [startInput, endInput]) {
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-errormessage")).toBe(FORM_ERROR_MESSAGE_ID);
    }

    const error = element.shadowRoot?.querySelector('[part="error-message"]');
    expect(error?.textContent).toBe("Range is required");
    expect((error as HTMLElement | null)?.hidden).toBe(false);
  });
});
