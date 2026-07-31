// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Slider } from "../../../src/components/forms/slider.js";

describe("Slider", () => {
  beforeEach(() => {
    Slider.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while dragging", () => {
    const element = document.createElement("box-slider") as Slider;
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
    const element = document.createElement("box-slider") as Slider;
    element.label = "Density";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="range"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Opacity";

    expect(document.activeElement).toBe(element);
  });
});
