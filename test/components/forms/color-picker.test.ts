// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxColorPickerElement,
  defineBoxColorPickerElement,
} from "../../../src/components/forms/color-picker.js";

describe("BoxColorPickerElement", () => {
  beforeEach(() => {
    defineBoxColorPickerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the current color value and label", () => {
    const element = document.createElement("box-color-picker") as BoxColorPickerElement;
    element.label = "Accent Color";
    element.value = "#ff6600";

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    const value = element.shadowRoot?.querySelector('[part="value"]') as HTMLSpanElement | null;
    expect(input?.value).toBe("#ff6600");
    expect(value?.textContent).toBe("#ff6600");
  });

  it("emits value-changed from the native color input", () => {
    const element = document.createElement("box-color-picker") as BoxColorPickerElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.value = "#22c55e";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(element.value).toBe("#22c55e");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "#22c55e" },
      }),
    );
  });

  it("supports swatch selection", () => {
    const element = document.createElement("box-color-picker") as BoxColorPickerElement;
    element.swatches = [
      { label: "Sky", value: "#38bdf8" },
      { label: "Mint", value: "#22c55e" },
    ];

    document.body.append(element);

    const swatches = element.shadowRoot?.querySelectorAll('[part="swatch"]') ?? [];
    expect(swatches[0]?.getAttribute("role")).toBeNull();
    (swatches[1] as HTMLButtonElement | undefined)?.click();

    expect(element.value).toBe("#22c55e");
    expect((swatches[1] as HTMLButtonElement).getAttribute("aria-pressed")).toBe("true");
  });

  it("supports disabled state", () => {
    const element = document.createElement("box-color-picker") as BoxColorPickerElement;
    element.disabled = true;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    expect(input?.disabled).toBe(true);
  });
});
