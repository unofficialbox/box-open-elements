// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxRangeSliderElement, defineBoxRangeSliderElement } from "../../../src/components/forms/range-slider.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

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
});
