// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTextFieldElement, defineBoxTextFieldElement } from "../../../src/components/forms/text-field.js";

describe("BoxTextFieldElement", () => {
  beforeEach(() => {
    defineBoxTextFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while typing", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    const changed = vi.fn();
    element.label = "Name";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Roadmap";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "Roadmap" },
      }),
    );
  });

  it("forwards disabled state to the input", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.disabled = true;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;

    expect(input?.disabled).toBe(true);
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "Name";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Full name";

    expect(document.activeElement).toBe(element);
  });
});
