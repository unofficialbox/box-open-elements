// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxNumberInputElement, defineBoxNumberInputElement } from "../../../src/components/forms/number-input.js";

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
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Build";

    expect(document.activeElement).toBe(element);
  });
});
