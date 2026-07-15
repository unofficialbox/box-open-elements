// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSliderElement, defineBoxSliderElement } from "../../../src/components/forms/slider.js";

describe("BoxSliderElement", () => {
  beforeEach(() => {
    defineBoxSliderElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while dragging", () => {
    const element = document.createElement("box-slider") as BoxSliderElement;
    const changed = vi.fn();
    element.label = "Density";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="range"]') as HTMLInputElement | null;
    input!.value = "42";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 42 },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-slider") as BoxSliderElement;
    element.label = "Density";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="range"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Opacity";

    expect(document.activeElement).toBe(element);
  });
});
